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
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await authApi.signup({ username, email, password });
      setSuccess(true);
      setTimeout(() => router.push("/login"), 1500);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fade-up">
      <div className="text-center mb-8">
        <div className="w-12 h-12 bg-gold rounded-xl flex items-center justify-center mx-auto mb-4">
          <span className="text-base font-heading font-bold text-xl">T</span>
        </div>
        <h1 className="font-heading font-bold text-2xl text-txt">Create your account</h1>
        <p className="text-txt-muted text-sm mt-1">Join the ThreadIt community</p>
      </div>

      {success ? (
        <div className="card text-center py-8 fade-up">
          <div className="w-12 h-12 bg-up/20 rounded-full flex items-center justify-center mx-auto mb-3">
            <span className="text-up text-xl">+</span>
          </div>
          <p className="text-gold font-heading font-semibold text-lg">Account created!</p>
          <p className="text-txt-muted text-sm mt-2">Redirecting to login...</p>
        </div>
      ) : (
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
          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full text-sm flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-base border-t-transparent rounded-full animate-spin" />
                Creating account...
              </>
            ) : (
              "Sign Up"
            )}
          </button>
        </form>
      )}

      <p className="text-center text-sm text-txt-muted mt-6">
        Already have an account? <Link href="/login" className="text-gold hover:text-gold-light transition-colors">Sign in</Link>
      </p>
    </div>
  );
}
