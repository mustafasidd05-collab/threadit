
================================================================================
  MANUAL FRONTEND UPDATES
  The script created new components but these existing files need manual edits.
  Copy the code blocks below into the correct files.
================================================================================


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 FILE: frontend/components/ThreadCard.tsx
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

 1. Add these imports at the top (near the other imports):

import ContextMenu from "./ContextMenu";
import ConfirmModal from "./ConfirmModal";
import { Trash2 } from "lucide-react";
import { threadsApi } from "@/lib/api";
import { useAuth } from "@/lib/auth";

 2. Add state inside the component function (after the existing declarations):

const { user } = useAuth();
const [deleted, setDeleted] = useState(false);
const [showDeleteModal, setShowDeleteModal] = useState(false);
const [deleting, setDeleting] = useState(false);

const isAuthor = user?.id === thread.author?.id;

 3. Add this AFTER the opening <article> tag (inside the card, at the top-right):

{/* Three-dot menu */}
<div className="absolute top-3 right-3 z-10" onClick={(e) => e.preventDefault()}>
    <ContextMenu
        items={[
            ...(isAuthor
                ? [
                      {
                          label: "Delete",
                          icon: <Trash2 size={14} />,
                          onClick: () => setShowDeleteModal(true),
                          danger: true,
                      },
                  ]
                : []),
        ]}
    />
</div>

 4. Add this BEFORE the closing </motion.div> (at the very bottom of the component):

<ConfirmModal
    open={showDeleteModal}
    onClose={() => setShowDeleteModal(false)}
    onConfirm={async () => {
        setDeleting(true);
        try {
            await threadsApi.delete(thread.id);
            setDeleted(true);
            setShowDeleteModal(false);
        } catch (err: any) {
            alert(err.message || "Failed to delete");
        } finally {
            setDeleting(false);
        }
    }}
    title="Delete Thread"
    message={`Delete "${thread.title}"? This cannot be undone.`}
    confirmText="Delete"
    loading={deleting}
/>

 5. Add early return after the state declarations (before the return JSX):

if (deleted) return null;

 6. Add "useState" to the React import at the top:

import { useState } from "react";


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 FILE: frontend/app/(main)/thread/[id]/page.tsx
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

 1. Add imports:

import ContextMenu from "@/components/ContextMenu";
import ConfirmModal from "@/components/ConfirmModal";
import { Trash2 } from "lucide-react";
import { commentsApi } from "@/lib/api";

 2. Find the Comment component function and add these props/state:

function Comment({
  comment,
  depth = 0,
  onReply,
  onDelete,
  currentUser,
}: {
  comment: any;
  depth?: number;
  onReply: (parentId: string) => void;
  onDelete: (commentId: string) => void;
  currentUser: any;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const children = comment.replies || [];
  const isAuthor = currentUser?.id === comment.author?.id;

 3. Add delete menu next to the collapse button (inside the comment header):

<div className="flex items-center gap-2 mb-1.5">
    <button
        onClick={() => setCollapsed(!collapsed)}
        className="text-txt-faint hover:text-txt transition-colors"
    >
        {collapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
    </button>
    {/* ... existing author info ... */}
    {/* ADD THIS after the time display: */}
    {isAuthor && (
        <ContextMenu
            items={[
                {
                    label: "Delete",
                    icon: <Trash2 size={14} />,
                    onClick: () => setShowDeleteModal(true),
                    danger: true,
                },
            ]}
        />
    )}
</div>

 4. Add the ConfirmModal at the end of the Comment function:

<ConfirmModal
    open={showDeleteModal}
    onClose={() => setShowDeleteModal(false)}
    onConfirm={() => {
        onDelete(comment.id);
        setShowDeleteModal(false);
    }}
    title="Delete Comment"
    message="This comment will be deleted."
    confirmText="Delete"
/>

 5. Update the Comment usage in the render section to pass new props:

<Comment
    key={comment.id}
    comment={comment}
    onReply={(parentId) => {
        setReplyTo(parentId);
        window.scrollTo({ top: 0, behavior: "smooth" });
    }}
    onDelete={async (commentId) => {
        try {
            await commentsApi.delete(commentId);
            // Reload thread
            const data = await threadsApi.detail(id as string);
            setThread(data);
            setComments(data.comments || data.children || []);
        } catch (err: any) {
            alert(err.message || "Failed to delete");
        }
    }}
    currentUser={user}
/>


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 FILE: frontend/app/(main)/tribe/[name]/page.tsx
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

 1. Add imports:

import TribeAdminPanel from "@/components/TribeAdminPanel";
import { Settings } from "lucide-react";

 2. Add state:

const [showAdmin, setShowAdmin] = useState(false);

 3. Find the tribe header area and add an admin button (only for owner/admin).
    Add this near the Join/Leave button:

{(tribe.user_role === "OWNER" || tribe.user_role === "ADMIN") && (
    <button
        onClick={() => setShowAdmin(true)}
        className="btn-icon"
        title="Manage Tribe"
    >
        <Settings size={18} />
    </button>
)}

 4. Add the TribeAdminPanel component at the bottom of the return JSX:

<TribeAdminPanel
    tribeId={tribe.id}
    tribeName={tribe.name}
    isOpen={showAdmin}
    onClose={() => setShowAdmin(false)}
/>


================================================================================
  DONE — Save all files and restart both servers
================================================================================
