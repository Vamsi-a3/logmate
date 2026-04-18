/**
 * Browser mic → 16 kHz mono PCM chunking (mirrors web_app.py), WAV → POST /api/transcribe.
 */

import { encodeWavPcm16Mono } from "@/lib/wav-encode";

export const SAMPLE_RATE = 16000;
const CHUNK_DURATION = 0.1;
const SILENCE_DURATION = 5;
const MAX_DURATION = 25;
const SILENCE_FRAMES = Math.floor(SILENCE_DURATION / CHUNK_DURATION);
const CHUNK_FRAMES = Math.floor(SAMPLE_RATE * CHUNK_DURATION);
const MAX_FRAMES = Math.floor(MAX_DURATION / CHUNK_DURATION);
/** int16 amplitude — same as numpy int16 mic in web_app.py */
const SILENCE_THRESHOLD = 500;

export type SarvamVoiceHandlers = {
  onTranscript: (text: string) => void;
  onError?: (message: string) => void;
};

function downsampleFloat32(
  input: Float32Array,
  inputRate: number,
  outputRate: number
): Float32Array {
  if (inputRate === outputRate) return input.slice();
  const ratio = inputRate / outputRate;
  const outLen = Math.floor(input.length / ratio);
  const out = new Float32Array(outLen);
  for (let i = 0; i < outLen; i++) {
    const srcPos = i * ratio;
    const i0 = Math.floor(srcPos);
    const i1 = Math.min(i0 + 1, input.length - 1);
    const t = srcPos - i0;
    out[i] = input[i0] * (1 - t) + input[i1] * t;
  }
  return out;
}

function floatToInt16(f: Float32Array): Int16Array {
  const out = new Int16Array(f.length);
  for (let i = 0; i < f.length; i++) {
    const s = Math.max(-1, Math.min(1, f[i]));
    out[i] = s < 0 ? Math.round(s * 0x8000) : Math.round(s * 0x7fff);
  }
  return out;
}

function maxAbs(samples: Int16Array): number {
  let m = 0;
  for (let i = 0; i < samples.length; i++) {
    const v = Math.abs(samples[i]);
    if (v > m) m = v;
  }
  return m;
}

function concatBlocks(blocks: Int16Array[]): Int16Array {
  let len = 0;
  for (const b of blocks) len += b.length;
  const out = new Int16Array(len);
  let off = 0;
  for (const b of blocks) {
    out.set(b, off);
    off += b.length;
  }
  return out;
}

async function postTranscribe(wav: Blob): Promise<string> {
  const form = new FormData();
  form.append("file", wav, "audio.wav");
  const res = await fetch("/api/transcribe", {
    method: "POST",
    body: form,
  });
  const data = (await res.json()) as { transcript?: string; error?: string };
  if (!res.ok) {
    throw new Error(data.error ?? `Transcription failed (${res.status})`);
  }
  return (data.transcript ?? "").trim();
}

type Session = {
  stop: () => Promise<void>;
};

/**
 * Start capture. Returns stop() which flushes the last utterance and waits for in-flight requests.
 */
export async function startSarvamVoiceCapture(
  handlers: SarvamVoiceHandlers
): Promise<Session> {
  if (typeof window === "undefined") {
    throw new Error("Voice capture requires a browser.");
  }

  let stream: MediaStream;
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        channelCount: 1,
        echoCancellation: true,
        noiseSuppression: true,
      },
    });
  } catch (e) {
    const name = e instanceof DOMException ? e.name : "Error";
    if (name === "NotAllowedError" || name === "PermissionDeniedError") {
      throw new Error("Microphone permission was denied.");
    }
    if (name === "NotFoundError") {
      throw new Error("No microphone was found.");
    }
    throw new Error("Could not access the microphone.");
  }

  const ACtx =
    window.AudioContext ||
    (
      window as typeof window & {
        webkitAudioContext?: typeof AudioContext;
      }
    ).webkitAudioContext;
  if (!ACtx) {
    stream.getTracks().forEach((t) => t.stop());
    throw new Error("Web Audio API is not available.");
  }

  const context = new ACtx({ sampleRate: SAMPLE_RATE });
  const inputRate = context.sampleRate;

  const source = context.createMediaStreamSource(stream);
  const mute = context.createGain();
  mute.gain.value = 0;

  const bufferSize = 4096;
  const processor = context.createScriptProcessor(
    bufferSize,
    1,
    1
  );

  /** Pending int16 samples at 16 kHz before splitting into CHUNK_FRAMES frames */
  let pending = new Int16Array(0);
  const frameBlocks: Int16Array[] = [];
  let isRecordingUtterance = false;
  let silenceCounter = 0;
  let destroyed = false;

  let transcriptionQueue: Promise<void> = Promise.resolve();

  function enqueueTranscription(task: () => Promise<void>): void {
    transcriptionQueue = transcriptionQueue
      .then(task)
      .catch((err) => {
        if (!destroyed) {
          handlers.onError?.(
            err instanceof Error ? err.message : "Transcription failed."
          );
        }
      });
  }

  function pushDownsampledInt16(samples: Int16Array) {
    if (samples.length === 0) return;
    const merged = new Int16Array(pending.length + samples.length);
    merged.set(pending);
    merged.set(samples, pending.length);
    pending = merged;

    while (pending.length >= CHUNK_FRAMES) {
      const frame = pending.slice(0, CHUNK_FRAMES);
      pending = pending.slice(CHUNK_FRAMES);
      processFrame(frame);
    }
  }

  function emitChunk(blocks: Int16Array[]) {
    if (blocks.length === 0) return;
    const pcm = concatBlocks(blocks);
    if (maxAbs(pcm) < SILENCE_THRESHOLD) return;

    const wav = encodeWavPcm16Mono(pcm, SAMPLE_RATE);
    enqueueTranscription(async () => {
      const text = await postTranscribe(wav);
      if (text) handlers.onTranscript(text);
    });
  }

  function processFrame(frame: Int16Array) {
    const amplitude = maxAbs(frame);
    if (amplitude >= SILENCE_THRESHOLD) {
      isRecordingUtterance = true;
      silenceCounter = 0;
      frameBlocks.push(frame);
      if (frameBlocks.length >= MAX_FRAMES) {
        emitChunk([...frameBlocks]);
        frameBlocks.length = 0;
        silenceCounter = 0;
      }
    } else if (isRecordingUtterance) {
      silenceCounter += 1;
      frameBlocks.push(frame);
      if (silenceCounter >= SILENCE_FRAMES) {
        emitChunk([...frameBlocks]);
        frameBlocks.length = 0;
        isRecordingUtterance = false;
        silenceCounter = 0;
      }
    }
  }

  processor.onaudioprocess = (ev: AudioProcessingEvent) => {
    if (destroyed) return;
    const input = ev.inputBuffer.getChannelData(0);
    const copy = new Float32Array(input.length);
    copy.set(input);
    const down = downsampleFloat32(copy, inputRate, SAMPLE_RATE);
    const i16 = floatToInt16(down);
    pushDownsampledInt16(i16);
  };

  source.connect(processor);
  processor.connect(mute);
  mute.connect(context.destination);

  if (context.state === "suspended") {
    await context.resume();
  }

  const stop = async (): Promise<void> => {
    if (destroyed) return;
    destroyed = true;

    try {
      processor.disconnect();
      mute.disconnect();
      source.disconnect();
    } catch {
      /* ignore */
    }

    stream.getTracks().forEach((t) => t.stop());

    await context.close().catch(() => {});

    /** Flush like web_app /stop: one chunk from buffer + pending tail */
    const tail: Int16Array[] = [...frameBlocks];
    if (pending.length > 0) tail.push(pending.slice());
    frameBlocks.length = 0;
    pending = new Int16Array(0);
    if (
      (isRecordingUtterance || tail.length > 0) &&
      tail.length > 0
    ) {
      const merged = concatBlocks(tail);
      if (maxAbs(merged) >= SILENCE_THRESHOLD) {
        emitChunk(tail);
      }
    }

    await transcriptionQueue;
  };

  return { stop };
}
