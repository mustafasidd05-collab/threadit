"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield,
  ShieldCheck,
  Crown,
  UserMinus,
  ChevronUp,
  ChevronDown,
  Trash2,
  Users,
  Loader2,
  X,
} from "lucide-react";
import { tribesApi } from "@/lib/api";
import ConfirmModal from "./ConfirmModal";
import { useAuth } from "@/lib/auth";

interface Member {
  user: { id: string; username: string; avatar_url?: string };
  role: string;
  joined_at: string;
}

interface TribeAdminPanelProps {
  tribeId: string;
  tribeName: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function TribeAdminPanel({
  tribeId,
  tribeName,
  isOpen,
  onClose,
}: TribeAdminPanelProps) {
  const { user } = useAuth();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [deleteModal, setDeleteModal] = useState(false);
  const [removeModal, setRemoveModal] = useState<string | null>(null);

  const myRole = members.find((m) => m.user.id === user?.id)?.role || "MEMBER";
  const isOwner = myRole === "OWNER";

  const loadMembers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await tribesApi.adminMembers(tribeId);
      setMembers(data);
    } catch (err) {
      console.error("Failed to load members:", err);
    } finally {
      setLoading(false);
    }
  }, [tribeId]);

  useEffect(() => {
    if (isOpen) loadMembers();
  }, [isOpen, loadMembers]);

  const handlePromote = async (userId: string) => {
    setActionLoading(userId + "-promote");
    try {
      await tribesApi.promote(tribeId, userId);
      await loadMembers();
    } catch (err: any) {
      alert(err.message || "Failed to promote");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDemote = async (userId: string) => {
    setActionLoading(userId + "-demote");
    try {
      await tribesApi.demote(tribeId, userId);
      await loadMembers();
    } catch (err: any) {
      alert(err.message || "Failed to demote");
    } finally {
      setActionLoading(null);
    }
  };

  const handleRemove = async (userId: string) => {
    setActionLoading(userId + "-remove");
    try {
      await tribesApi.removeMember(tribeId, userId);
      setRemoveModal(null);
      await loadMembers();
    } catch (err: any) {
      alert(err.message || "Failed to remove member");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteTribe = async () => {
    setActionLoading("delete-tribe");
    try {
      await tribesApi.deleteTribe(tribeId);
      window.location.href = "/home";
    } catch (err: any) {
      alert(err.message || "Failed to delete tribe");
      setActionLoading(null);
    }
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[90] bg-base/80 backdrop-blur flex items-center justify-center p-4"
            onClick={onClose}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 12 }}
              onClick={(e) => e.stopPropagation()}
              className="card max-w-lg w-full max-h-[80vh] overflow-hidden flex flex-col"
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gold/10 rounded-xl flex items-center justify-center">
                    <Shield size={20} className="text-gold" />
                  </div>
                  <div>
                    <h3 className="font-heading font-semibold text-txt">
                      Tribe Management
                    </h3>
                    <p className="text-xs text-txt-faint">t/{tribeName}</p>
                  </div>
                </div>
                <button onClick={onClose} className="btn-icon">
                  <X size={16} />
                </button>
              </div>

              {/* Members */}
              <div className="flex-1 overflow-y-auto space-y-2 mb-4">
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 size={24} className="animate-spin text-gold" />
                  </div>
                ) : members.length === 0 ? (
                  <div className="text-center py-8">
                    <Users size={24} className="text-txt-faint mx-auto mb-2" />
                    <p className="text-sm text-txt-muted">No members found</p>
                  </div>
                ) : (
                  members.map((m) => (
                    <motion.div
                      key={m.user.id}
                      layout
                      className="flex items-center justify-between p-3 bg-surface-2 rounded-xl border border-border"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-surface-3 rounded-full flex items-center justify-center border border-border">
                          <span className="text-xs font-bold text-gold">
                            {m.user.username?.[0]?.toUpperCase() || "?"}
                          </span>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-txt">
                            {m.user.username}
                          </span>
                          <div className="flex items-center gap-1 mt-0.5">
                            {m.role === "OWNER" && (
                              <span className="badge text-[10px] bg-gold/10 text-gold border-gold/20">
                                <Crown size={9} className="mr-0.5" /> Owner
                              </span>
                            )}
                            {m.role === "ADMIN" && (
                              <span className="badge text-[10px] bg-up/10 text-up border-up/20">
                                <ShieldCheck size={9} className="mr-0.5" /> Admin
                              </span>
                            )}
                            {m.role === "MEMBER" && (
                              <span className="badge text-[10px] bg-surface-3 text-txt-faint">
                                Member
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      {m.user.id !== user?.id && m.role !== "OWNER" && (
                        <div className="flex items-center gap-1">
                          {isOwner && m.role === "MEMBER" && (
                            <button
                              onClick={() => handlePromote(m.user.id)}
                              disabled={!!actionLoading}
                              className="btn-icon text-up hover:bg-up/10"
                              title="Make Admin"
                            >
                              {actionLoading === m.user.id + "-promote" ? (
                                <Loader2 size={14} className="animate-spin" />
                              ) : (
                                <ChevronUp size={14} />
                              )}
                            </button>
                          )}
                          {isOwner && m.role === "ADMIN" && (
                            <button
                              onClick={() => handleDemote(m.user.id)}
                              disabled={!!actionLoading}
                              className="btn-icon text-txt-faint hover:bg-surface-3"
                              title="Remove Admin"
                            >
                              {actionLoading === m.user.id + "-demote" ? (
                                <Loader2 size={14} className="animate-spin" />
                              ) : (
                                <ChevronDown size={14} />
                              )}
                            </button>
                          )}
                          <button
                            onClick={() => setRemoveModal(m.user.id)}
                            disabled={!!actionLoading}
                            className="btn-icon text-down hover:bg-down/10"
                            title="Remove from Tribe"
                          >
                            {actionLoading === m.user.id + "-remove" ? (
                              <Loader2 size={14} className="animate-spin" />
                            ) : (
                              <UserMinus size={14} />
                            )}
                          </button>
                        </div>
                      )}
                    </motion.div>
                  ))
                )}
              </div>

              {/* Delete Tribe */}
              {isOwner && (
                <div className="pt-4 border-t border-border">
                  <button
                    onClick={() => setDeleteModal(true)}
                    className="btn-secondary w-full flex items-center justify-center gap-2 text-down hover:bg-down/10 border-down/20"
                  >
                    <Trash2 size={14} />
                    Delete Tribe
                  </button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Remove Member Modal */}
      <ConfirmModal
        open={!!removeModal}
        onClose={() => setRemoveModal(null)}
        onConfirm={() => removeModal && handleRemove(removeModal)}
        title="Remove Member"
        message="This user will be removed from the tribe. They can rejoin later."
        confirmText="Remove"
      />

      {/* Delete Tribe Modal */}
      <ConfirmModal
        open={deleteModal}
        onClose={() => setDeleteModal(false)}
        onConfirm={handleDeleteTribe}
        title="Delete Tribe"
        message={`This will permanently delete t/${tribeName} and all its threads, comments, and memberships. This action cannot be undone.`}
        confirmText="Delete Tribe"
        requireTyping
        loading={actionLoading === "delete-tribe"}
      />
    </>
  );
}
