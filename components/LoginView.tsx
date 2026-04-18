"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { ArrowRight } from "lucide-react";
import type { AppUser } from "@/types";

type LoginViewProps = {
  onLogin: (user: AppUser) => void;
};

export function LoginView({ onLogin }: LoginViewProps) {
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submitLogin = async () => {
    if (!username.trim() || !password) return;
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim(), password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Login failed");
        return;
      }
      onLogin(data.user as AppUser);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const submitSignUp = async () => {
    if (!username.trim() || !password || password !== confirmPassword) return;
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim(), password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Signup failed");
        return;
      }
      onLogin(data.user as AppUser);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-surface">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-[400px] border border-primary rounded-md p-10 flex flex-col gap-10 bg-white"
      >
        <div className="text-center">
          <h1 className="text-[2rem] font-bold tracking-[-0.06em] uppercase text-primary">
            LogMate
          </h1>
          <p className="text-[0.65rem] uppercase tracking-[0.2em] text-on-surface-variant font-bold mt-2">
            {authMode === "login" ? "Sign in" : "Create account"}
          </p>
        </div>

        {error && (
          <p className="text-[0.75rem] text-red-600 text-center font-medium">
            {error}
          </p>
        )}

        {authMode === "login" ? (
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <label
                className="text-[0.65rem] uppercase tracking-[0.15em] text-on-surface-variant font-bold"
                htmlFor="username"
              >
                Username
              </label>
              <input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-white border border-primary rounded-md px-4 py-3 text-sm focus:outline-none focus:bg-surface-container-low transition-colors"
                placeholder="Enter your username"
                type="text"
                autoComplete="username"
                onKeyDown={(e) => {
                  if (e.key === "Enter") void submitLogin();
                }}
              />
            </div>
            <div className="flex flex-col gap-2">
              <label
                className="text-[0.65rem] uppercase tracking-[0.15em] text-on-surface-variant font-bold"
                htmlFor="password"
              >
                Password
              </label>
              <input
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white border border-primary rounded-md px-4 py-3 text-sm focus:outline-none focus:bg-surface-container-low transition-colors"
                placeholder="Enter your password"
                type="password"
                autoComplete="current-password"
                onKeyDown={(e) => {
                  if (e.key === "Enter") void submitLogin();
                }}
              />
            </div>
            <div className="flex flex-col gap-4 mt-2">
              <button
                type="button"
                onClick={() => void submitLogin()}
                disabled={loading || !username.trim() || !password}
                className="w-full bg-primary text-white font-bold text-sm rounded-md py-4 hover:bg-neutral-800 transition-colors flex justify-center items-center gap-2 group disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {loading ? "LOGGING IN..." : "LOGIN"}
                {!loading && (
                  <ArrowRight
                    size={16}
                    className="group-hover:translate-x-1 transition-transform"
                  />
                )}
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthMode("signup");
                  setConfirmPassword("");
                  setError("");
                }}
                className="w-full bg-transparent border border-primary text-primary font-bold text-sm rounded-md py-4 hover:bg-surface-container-low transition-colors"
              >
                SIGN UP
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <label
                className="text-[0.65rem] uppercase tracking-[0.15em] text-on-surface-variant font-bold"
                htmlFor="su-username"
              >
                Username
              </label>
              <input
                id="su-username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-white border border-primary rounded-md px-4 py-3 text-sm focus:outline-none focus:bg-surface-container-low transition-colors"
                placeholder="Choose a username"
                type="text"
                autoComplete="username"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label
                className="text-[0.65rem] uppercase tracking-[0.15em] text-on-surface-variant font-bold"
                htmlFor="su-password"
              >
                Password
              </label>
              <input
                id="su-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white border border-primary rounded-md px-4 py-3 text-sm focus:outline-none focus:bg-surface-container-low transition-colors"
                placeholder="Create a password"
                type="password"
                autoComplete="new-password"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label
                className="text-[0.65rem] uppercase tracking-[0.15em] text-on-surface-variant font-bold"
                htmlFor="su-confirm"
              >
                Confirm password
              </label>
              <input
                id="su-confirm"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-white border border-primary rounded-md px-4 py-3 text-sm focus:outline-none focus:bg-surface-container-low transition-colors"
                placeholder="Confirm your password"
                type="password"
                autoComplete="new-password"
                onKeyDown={(e) => {
                  if (e.key === "Enter") void submitSignUp();
                }}
              />
            </div>
            {confirmPassword && password !== confirmPassword && (
              <p className="text-[0.7rem] text-red-600 font-medium">
                Passwords do not match.
              </p>
            )}
            <div className="flex flex-col gap-4 mt-2">
              <button
                type="button"
                onClick={() => void submitSignUp()}
                disabled={
                  loading ||
                  !username.trim() ||
                  !password ||
                  password !== confirmPassword
                }
                className="w-full bg-primary text-white font-bold text-sm rounded-md py-4 hover:bg-neutral-800 transition-colors flex justify-center items-center gap-2 group disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {loading ? "CREATING..." : "CREATE ACCOUNT"}
                {!loading && (
                  <ArrowRight
                    size={16}
                    className="group-hover:translate-x-1 transition-transform"
                  />
                )}
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthMode("login");
                  setConfirmPassword("");
                  setError("");
                }}
                className="w-full bg-transparent border border-primary text-primary font-bold text-sm rounded-md py-4 hover:bg-surface-container-low transition-colors"
              >
                BACK TO LOGIN
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
