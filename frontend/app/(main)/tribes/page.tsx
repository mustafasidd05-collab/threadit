"use client";

import { useEffect, useState } from "react";
import { tribesApi } from "@/lib/api";
import type { Tribe } from "@/lib/types";
import TribeCard from "@/components/TribeCard";
import { useAuth } from "@/lib/auth";

export default function TribesPage() {
  const { user } = useAuth();
  const [tribes, setTribes] = useState<Tribe[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [error, setError] = useState("");

  const loadTribes = () => {
    setLoading(true);
    tribesApi.list().then(setTribes).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { loadTribes(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setError("");
    try {
      await tribesApi.create({ name, description: desc });
      setName("");
      setDesc("");
      loadTribes();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  };

  const handleJoinLeave = async (tribe: Tribe) => {
    try {
      if (tribe.is_member) {
        await tribesApi.leave(tribe.id);
      } else {
        await tribesApi.join(tribe.id);
      }
      loadTribes();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <h1 className="font-heading font-extrabold text-3xl text-txt tracking-tight mb-2">Tribes</h1>
      <p className="text-txt-muted text-sm mb-8">Communities you can join</p>

      {/* Create Tribe */}
      {user && (
        <form onSubmit={handleCreate} className="card space-y-3 mb-8">
          <h2 className="font-heading font-semibold text-gold text-sm">Create a Tribe</h2>
          {error && <p className="text-xs text-down">{error}</p>}
          <div className="flex gap-3">
            <input type="text" placeholder="tribe_name" value={name} onChange={(e) => setName(e.target.value)} className="input-field flex-1" required minLength={2} maxLength={50} pattern="^[a-zA-Z0-9_]+$" />
            <input type="text" placeholder="Description" value={desc} onChange={(e) => setDesc(e.target.value)} className="input-field flex-1" maxLength={2000} />
            <button type="submit" disabled={creating} className="btn-primary text-sm whitespace-nowrap">
              {creating ? "..." : "Create"}
            </button>
          </div>
        </form>
      )}

      {/* Tribe List */}
      {loading ? (
        <div className="space-y-4">{[...Array(3)].map((_, i) => <div key={i} className="card animate-pulse h-24" />)}</div>
      ) : tribes.length === 0 ? (
        <div className="card text-center py-12"><p className="text-txt-muted font-mono text-sm">No tribes yet. Create the first one!</p></div>
      ) : (
        <div className="space-y-3">{tribes.map((tribe) => <TribeCard key={tribe.id} tribe={tribe} onJoinLeave={() => handleJoinLeave(tribe)} />)}</div>
      )}
    </div>
  );
}
