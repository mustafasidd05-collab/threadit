"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { authApi } from "@/lib/api";

export default function SignupPage() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [devOtp, setDevOtp] = useState("");
  const router = useRouter();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await authApi.signup({ username, email, password });
      setOtpSent(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await authApi.verifyOtp({ email, otp });
      router.push("/login");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setLoading(true);
    setError("");
    try {
      await authApi.resendOtp({ username, email, password });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!otpSent) {
    return (
      <div className="fade-up">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-gold rounded-xl flex items-center justify-center mx-auto mb-4">
            <span className="text-base font-heading font-bold text-xl">T</span>
          </div>
          <h1 className="font-heading font-bold text-2xl text-txt">Create your account</h1>
          <p className="text-txt-muted text-sm mt-1">Join the ThreadIt community</p>
        </div>
        <form onSubmit={handleSignup} className="card space-y-4">
          {error && <p className="text-sm text-down bg-down/10 px-3 py-2 rounded-lg">{error}</p>}
          <div>
            <label className="block text-xs font-mono text-txt-muted mb-1.5 uppercase tracking-wider">Username</label>
            <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} className="input-field" placeholder="pick_a_username" required minLength={3} maxLength={30} pattern="^[a-zA-Z0-9_]+$" />
          </div>
          <div>
            <label className="block text-xs font-mono text-txt-muted mb-1.5 uppercase tracking-wider">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input-field" placeholder="you@example.com" required />
          </div>
          <div>
            <label className="block text-xs font-mono text-txt-muted mb-1.5 uppercase tracking-wider">Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="input-field" placeholder="Min 8 characters" required minLength={8} />
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full text-sm">
            {loading ? "Sending OTP..." : "Continue"}
          </button>
        </form>
        <p className="text-center text-sm text-txt-muted mt-6">
          Already have an account? <Link href="/login" className="text-gold hover:text-gold-light transition-colors">Sign in</Link>
        </p>
      </div>
    );
  }

  return (
    <div className="fade-up">
      <div className="text-center mb-8">
        <div className="w-12 h-12 bg-gold rounded-xl flex items-center justify-center mx-auto mb-4">
          <span className="text-base font-heading font-bold text-xl">T</span>
        </div>
        <h1 className="font-heading font-bold text-2xl text-txt">Verify your email</h1>
        <p className="text-txt-muted text-sm mt-1">Enter the 6-digit code sent to {email}</p>
        <p className="text-xs text-gold mt-2 font-mono">Check the backend console for the OTP (dev mode)</p>
      </div>
      <form onSubmit={handleVerifyOtp} className="card space-y-4">
        {error && <p className="text-sm text-down bg-down/10 px-3 py-2 rounded-lg">{error}</p>}
        <div>
          <label className="block text-xs font-mono text-txt-muted mb-1.5 uppercase tracking-wider text-center">OTP Code</label>
          <div className="flex gap-2 justify-center">
            {Array.from({ length: 6 }).map((_, i) => (
              <input
                key={i}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={otp[i] || ""}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, "");
                  const newOtp = otp.padEnd(6, " ").split("");
                  newOtp[i] = val;
                  const joined = newOtp.join("").trimEnd();
                  setOtp(joined);
                  if (val && e.target.nextElementSibling) {
                    (e.target.nextElementSibling as HTMLInputElement).focus();
                  }
                }}
                className="w-11 h-14 text-center text-xl font-mono font-bold bg-surface-2 border border-border rounded-lg text-txt focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold/30 transition-all"
              />
            ))}
          </div>
        </div>
        <button type="submit" disabled={loading || otp.length < 6} className="btn-primary w-full text-sm">
          {loading ? "Verifying..." : "Verify & Create Account"}
        </button>
        <button type="button" onClick={handleResend} disabled={loading} className="btn-secondary w-full text-sm">
          Resend OTP
        </button>
      </form>
    </div>
  );
}
