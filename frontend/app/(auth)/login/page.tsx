"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { authApi } from "@/lib/api";
import { useAuth } from "@/lib/auth";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const { access_token } = await authApi.login({ email, password });
      await login(access_token);
      router.push("/home");
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
        <h1 className="font-heading font-bold text-2xl text-txt">Welcome back</h1>
        <p className="text-txt-muted text-sm mt-1">Sign in to continue to ThreadIt</p>
      </div>

      <form onSubmit={handleSubmit} className="card space-y-4">
        {error && (
          <p className="text-sm text-down bg-down/10 px-3 py-2 rounded-lg">{error}</p>
        )}
        <div>
          <label className="block text-xs font-mono text-txt-muted mb-1.5 uppercase tracking-wider">Email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input-field" placeholder="you@example.com" required />
        </div>
        <div>
          <label className="block text-xs font-mono text-txt-muted mb-1.5 uppercase tracking-wider">Password</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="input-field" placeholder="Enter your password" required minLength={8} />
        </div>
        <button type="submit" disabled={loading} className="btn-primary w-full text-sm">
          {loading ? "Signing in..." : "Sign In"}
        </button>
      </form>

      <p className="text-center text-sm text-txt-muted mt-6">
        Don&apos;t have an account?{" "}
        <Link href="/signup" className="text-gold hover:text-gold-light transition-colors">Create one</Link>
      </p>
    </div>
  );
}
