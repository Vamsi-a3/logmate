import os
import wave
import time
import queue
import threading
import asyncio
import numpy as np
import requests

try:
    import sounddevice as sd
except Exception as _sd_exc:
    sd = None  # type: ignore
    _SD_IMPORT_ERR = str(_sd_exc)
else:
    _SD_IMPORT_ERR = None

from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware
import uvicorn



# Deprecated: voice uses the browser + Next.js /api/transcribe. Kept only for local experiments.
API_KEY = os.environ.get("SARVAM_API_KEY")

URL = "https://api.sarvam.ai/speech-to-text"
SAMPLE_RATE = 16000
CHUNK_DURATION = 0.1  # 100ms chunks
SILENCE_DURATION = 5  # Cut chunk after 5s silence
MAX_DURATION = 25     # Hard cut chunk after 25s continuous speech to avoid 30s limit
SILENCE_FRAMES = int(SILENCE_DURATION / CHUNK_DURATION)
CHUNK_FRAMES = int(SAMPLE_RATE * CHUNK_DURATION)
MAX_FRAMES = int(MAX_DURATION / CHUNK_DURATION)
SILENCE_THRESHOLD = 500

audio_queue = queue.Queue()
transcript_queue = queue.Queue()
app = FastAPI()

_default_origins = (
    "http://localhost:3000,http://127.0.0.1:3000,"
    "http://localhost:3001,http://127.0.0.1:3001"
)
_allow = os.environ.get("ALLOWED_ORIGINS", _default_origins)
_allow_origins = [o.strip() for o in _allow.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_allow_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

os.makedirs("audio", exist_ok=True)

# Application state
is_system_recording = False

def save_wav(audio, filename):
    with wave.open(filename, 'wb') as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(SAMPLE_RATE)
        wf.writeframes(audio.tobytes())

def send_to_sarvam(filename):
    if not API_KEY:
        print("[!] SARVAM_API_KEY is not set; skipping Sarvam request.")
        return
    headers = {"Authorization": f"Bearer {API_KEY}"}
    try:
        with open(filename, "rb") as f:
            files = {"file": ("audio.wav", f, "audio/wav")}
            data = {"model": "saaras:v3", "mode": "translate"}
            response = requests.post(URL, headers=headers, files=files, data=data)

        if response.status_code == 200:
            res = response.json()
            transcript = res.get("transcript", "").strip()
            
            # Hallucination filter
            words = transcript.lower().replace(",", "").replace(".", "").split()
            is_hallucination = len(words) > 0 and (words.count("yes") / len(words)) >= 0.5
            
            if transcript and not is_hallucination:
                print(f"[*] Translated: {transcript}")
                transcript_queue.put(transcript)
        else:
            print(f"[!] API Error: {response.text}")
    except Exception as e:
        print(f"[!] Network Error: {e}")

def record_thread_loop():
    if sd is None:
        print(
            f"[mic] sounddevice unavailable — mic capture disabled "
            f"(typical on cloud servers). {_SD_IMPORT_ERR or ''}"
        )
        return

    global is_system_recording
    buffer = []
    silence_counter = 0
    is_recording = False

    def callback(indata, frames, time_info, status):
        nonlocal buffer, silence_counter, is_recording
        if not is_system_recording:
            # If user clicked Stop, flush remaining buffer immediately if recording
            if is_recording and len(buffer) > 0:
                audio_queue.put(np.concatenate(buffer, axis=0))
                buffer.clear()
            is_recording = False
            return
            
        audio_data = indata.copy()
        amplitude = np.max(np.abs(audio_data))
        
        if amplitude >= SILENCE_THRESHOLD:
            is_recording = True
            silence_counter = 0
            buffer.append(audio_data)
            
            # Force chunk bounds to prevent 30-sec limit error
            if len(buffer) >= MAX_FRAMES:
                audio_queue.put(np.concatenate(buffer, axis=0))
                buffer.clear()
                silence_counter = 0
                
        elif is_recording:
            silence_counter += 1
            buffer.append(audio_data)
            
            if silence_counter >= SILENCE_FRAMES:
                audio_queue.put(np.concatenate(buffer, axis=0))
                buffer.clear()
                is_recording = False
                silence_counter = 0

    try:
        with sd.InputStream(samplerate=SAMPLE_RATE, channels=1, dtype='int16', 
                            blocksize=CHUNK_FRAMES, callback=callback):
            while True:
                time.sleep(0.1)
    except Exception as e:
        print(f"Microphone loop died: {e}")

def process_thread_loop():
    chunk_id = int(time.time())
    while True:
        try:
            audio = audio_queue.get()
            if audio is None: break
            
            amplitude = np.max(np.abs(audio))
            if amplitude < SILENCE_THRESHOLD:
                audio_queue.task_done()
                continue
                
            filename = f"audio/temp_{chunk_id}.wav"
            save_wav(audio, filename)
            send_to_sarvam(filename)
            audio_queue.task_done()
            chunk_id += 1
        except Exception:
            time.sleep(1)

# Ignite background loops on startup
threading.Thread(target=record_thread_loop, daemon=True).start()
threading.Thread(target=process_thread_loop, daemon=True).start()



@app.post("/start")
def start_mic():
    global is_system_recording
    is_system_recording = True
    return {"status": "started"}

@app.post("/stop")
def stop_mic():
    global is_system_recording
    is_system_recording = False
    return {"status": "stopped"}

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            # Emits transcripts dynamically down to the web client
            if not transcript_queue.empty():
                text = transcript_queue.get()
                await websocket.send_text(text)
                transcript_queue.task_done()
            else:
                await asyncio.sleep(0.1)
    except Exception:
        pass

if __name__ == "__main__":
    print("[*] App running at http://localhost:8000")
    uvicorn.run("web_app:app", host="127.0.0.1", port=8000, reload=False)
