# ThreadIt Admin & Media Update Script
# Run from the project root
import os
import shutil
from datetime import datetime
from pathlib import Path

# ─── CONFIG ───────────────────────────────────────────────────────────────────
ROOT = Path(__file__).parent
BACKEND = ROOT / "backend"
FRONTEND = ROOT / "frontend"
BACKUP = ROOT / f"_backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}"


def backup_file(path: Path):
    if path.exists():
        rel = path.relative_to(ROOT)
        dest = BACKUP / rel
        dest.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(path, dest)


def write_file(path: Path, content: str):
    backup_file(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content, encoding="utf-8")
    print(f"  [OK] {path.relative_to(ROOT)}")


def read_file(path: Path) -> str:
    return path.read_text(encoding="utf-8") if path.exists() else ""


def patch_file(path: Path, old: str, new: str) -> bool:
    content = read_file(path)
    if old in content:
        backup_file(path)
        content = content.replace(old, new)
        path.write_text(content, encoding="utf-8")
        print(f"  [PATCHED] {path.relative_to(ROOT)}")
        return True
    return False


def append_if_missing(path: Path, marker: str, addition: str):
    content = read_file(path)
    if marker not in content:
        backup_file(path)
        content += addition
        path.write_text(content, encoding="utf-8")
        print(f"  [APPENDED] {path.relative_to(ROOT)}")
    else:
        print(f"  [SKIP] Already has: {marker[:40]}...")


# ═══════════════════════════════════════════════════════════════════════════════
#  BACKEND MODELS
# ═══════════════════════════════════════════════════════════════════════════════

TRIBE_ROLE_MODEL = '''\
import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from app.database.base import Base


class TribeRole(Base):
    __tablename__ = "tribe_roles"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    tribe_id = Column(String(36), ForeignKey("tribes.id"), nullable=False, index=True)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    role = Column(String(20), nullable=False, default="MEMBER")  # OWNER, ADMIN, MEMBER
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    tribe = relationship("Tribe", back_populates="roles")
    user = relationship("User")

    __table_args__ = (
        UniqueConstraint("tribe_id", "user_id", name="uq_tribe_user_role"),
    )
'''


def create_tribe_role_model():
    write_file(BACKEND / "app" / "models" / "tribe_role.py", TRIBE_ROLE_MODEL)

    # Update __init__.py
    init_path = BACKEND / "app" / "models" / "__init__.py"
    content = read_file(init_path)
    if "tribe_role" not in content:
        backup_file(init_path)
        content = content.rstrip() + "\nfrom app.models.tribe_role import TribeRole\n"
        init_path.write_text(content, encoding="utf-8")
        print("  [UPDATED] models/__init__.py")


def update_thread_media_model():
    path = BACKEND / "app" / "models" / "thread_media.py"
    if not path.exists():
        print(f"  [SKIP] {path} does not exist — will be created by previous setup")
        return

    content = read_file(path)
    if "user_id" in content:
        print("  [SKIP] thread_media already has user_id")
        return

    # Add user_id column
    old = 'thread_id = Column(String(36), ForeignKey("threads.id"), nullable=False, index=True)'
    new = '''thread_id = Column(String(36), ForeignKey("threads.id"), nullable=False, index=True)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=True)'''
    if patch_file(path, old, new):
        print("  [NOTE] user_id added to ThreadMedia — existing rows will have NULL")


def update_tribe_model():
    """Add roles relationship to Tribe model if not present."""
    path = BACKEND / "app" / "models" / "tribe.py"
    if not path.exists():
        print("  [SKIP] tribe.py model not found")
        return

    content = read_file(path)
    if "back_populates=\"tribe\"" in content and "roles" in content:
        print("  [SKIP] Tribe already has roles relationship")
        return

    if "roles = relationship" not in content:
        # Try to add it after existing relationships
        old_rel = 'memberships = relationship'
        if old_rel in content:
            patch_file(
                path,
                old_rel,
                'roles = relationship("TribeRole", back_populates="tribe", '
                'cascade="all, delete-orphan")\n    ' + old_rel,
            )
        else:
            # Append at end of class
            backup_file(path)
            content = content.rstrip()
            if not content.endswith("pass"):
                content += '\n    roles = relationship("TribeRole", back_populates="tribe", cascade="all, delete-orphan")\n'
            else:
                content = content.replace(
                    "pass",
                    'roles = relationship("TribeRole", back_populates="tribe", cascade="all, delete-orphan")\n',
                )
            path.write_text(content, encoding="utf-8")
            print("  [UPDATED] Tribe model with roles relationship")


# ═══════════════════════════════════════════════════════════════════════════════
#  BACKEND SERVICES
# ═══════════════════════════════════════════════════════════════════════════════

ROLE_SERVICE = '''\
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.tribe_role import TribeRole
from app.models.tribe import Tribe


async def get_user_role(db: AsyncSession, tribe_id: str, user_id: str) -> str | None:
    """Get user's role in a tribe. Returns None if not a member."""
    result = await db.execute(
        select(TribeRole).where(
            TribeRole.tribe_id == tribe_id,
            TribeRole.user_id == user_id,
        )
    )
    role = result.scalar_one_or_none()
    return role.role if role else None


async def ensure_owner_role(db: AsyncSession, tribe_id: str, user_id: str) -> None:
    """Create OWNER role for tribe creator if not exists."""
    existing = await get_user_role(db, tribe_id, user_id)
    if existing:
        return
    role = TribeRole(tribe_id=tribe_id, user_id=user_id, role="OWNER")
    db.add(role)
    await db.flush()


async def promote_to_admin(db: AsyncSession, tribe_id: str, user_id: str) -> TribeRole:
    """Promote a MEMBER to ADMIN."""
    result = await db.execute(
        select(TribeRole).where(
            TribeRole.tribe_id == tribe_id,
            TribeRole.user_id == user_id,
        )
    )
    role = result.scalar_one_or_none()
    if not role:
        role = TribeRole(tribe_id=tribe_id, user_id=user_id, role="ADMIN")
        db.add(role)
    else:
        role.role = "ADMIN"
    await db.flush()
    await db.refresh(role)
    return role


async def demote_to_member(db: AsyncSession, tribe_id: str, user_id: str) -> TribeRole:
    """Demote an ADMIN to MEMBER."""
    result = await db.execute(
        select(TribeRole).where(
            TribeRole.tribe_id == tribe_id,
            TribeRole.user_id == user_id,
        )
    )
    role = result.scalar_one_or_none()
    if not role:
        role = TribeRole(tribe_id=tribe_id, user_id=user_id, role="MEMBER")
        db.add(role)
    else:
        role.role = "MEMBER"
    await db.flush()
    await db.refresh(role)
    return role


async def remove_from_tribe(db: AsyncSession, tribe_id: str, user_id: str) -> None:
    """Remove user from tribe (delete role and membership)."""
    result = await db.execute(
        select(TribeRole).where(
            TribeRole.tribe_id == tribe_id,
            TribeRole.user_id == user_id,
        )
    )
    role = result.scalar_one_or_none()
    if role:
        await db.delete(role)
    await db.flush()


async def get_tribe_members_with_roles(db: AsyncSession, tribe_id: str) -> list:
    """Get all members of a tribe with their roles."""
    from app.models.user import User
    result = await db.execute(
        select(TribeRole, User)
        .join(User, TribeRole.user_id == User.id)
        .where(TribeRole.tribe_id == tribe_id)
        .order_by(
            TribeRole.role.asc(),  # OWNER first, then ADMIN, then MEMBER
            TribeRole.created_at.asc(),
        )
    )
    return result.all()
'''


def create_role_service():
    write_file(BACKEND / "app" / "services" / "role_service.py", ROLE_SERVICE)


# ═══════════════════════════════════════════════════════════════════════════════
#  BACKEND ROUTES — COMMENTS
# ═══════════════════════════════════════════════════════════════════════════════

COMMENTS_ROUTES = '''\
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime, timezone
from app.database.session import get_db
from app.auth.dependencies import get_current_user
from app.models.user import User
from app.models.thread import Thread
from app.models.tribe import Tribe
from app.services.role_service import get_user_role

router = APIRouter(prefix="/comments", tags=["comments"])


@router.delete("/{comment_id}")
async def delete_comment(
    comment_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Thread).where(Thread.id == comment_id)
    )
    comment = result.scalar_one_or_none()

    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")

    if comment.deleted_at:
        raise HTTPException(status_code=404, detail="Comment already deleted")

    is_author = comment.author_id == current_user.id
    is_admin = False

    # Check if user is tribe admin/owner
    if comment.tribe_id:
        role = await get_user_role(db, comment.tribe_id, current_user.id)
        is_admin = role in ("OWNER", "ADMIN")

    # For comments inside a thread, check the parent thread's tribe
    if not is_author and not is_admin and comment.parent_thread_id:
        parent_result = await db.execute(
            select(Thread).where(Thread.id == comment.parent_thread_id)
        )
        parent = parent_result.scalar_one_or_none()
        if parent and parent.tribe_id:
            role = await get_user_role(db, parent.tribe_id, current_user.id)
            is_admin = role in ("OWNER", "ADMIN")

    if not is_author and not is_admin:
        raise HTTPException(status_code=403, detail="Not authorized to delete this comment")

    comment.deleted_at = datetime.now(timezone.utc)
    await db.flush()

    return {"success": True, "message": "Comment deleted"}
'''


def create_comments_routes():
    write_file(BACKEND / "app" / "routes" / "comments.py", COMMENTS_ROUTES)


# ═══════════════════════════════════════════════════════════════════════════════
#  UPDATE THREAD ROUTES — ADD DELETE
# ═══════════════════════════════════════════════════════════════════════════════

def update_thread_routes_delete():
    path = BACKEND / "app" / "routes" / "threads.py"
    if not path.exists():
        print("  [SKIP] threads.py route not found")
        return

    content = read_file(path)

    # Add role_service import if missing
    if "role_service" not in content:
        old_import = "from app.auth.dependencies import get_current_user, get_optional_user"
        new_import = (
            "from app.auth.dependencies import get_current_user, get_optional_user\n"
            "from app.services.role_service import get_user_role"
        )
        patch_file(path, old_import, new_import)

    # Check if delete route already exists with role check
    if "is_admin" in content and "get_user_role" in content:
        print("  [SKIP] Delete route already has role-based checks")
        return

    # Update the existing delete route to include role check
    old_delete = '''@router.delete("/{thread_id}", status_code=200)
async def remove_thread(
    thread_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    await soft_delete_thread(db, thread_id, current_user.id)
    return {"message": "Thread deleted"}'''

    new_delete = '''@router.delete("/{thread_id}", status_code=200)
async def remove_thread(
    thread_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    from sqlalchemy import select as sa_select
    from app.models.thread import Thread as ThreadModel

    thread_result = await db.execute(sa_select(ThreadModel).where(ThreadModel.id == thread_id))
    thread_obj = thread_result.scalar_one_or_none()
    if not thread_obj:
        raise HTTPException(status_code=404, detail="Thread not found")

    is_author = thread_obj.author_id == current_user.id
    is_admin = False

    if thread_obj.tribe_id:
        role = await get_user_role(db, thread_obj.tribe_id, current_user.id)
        is_admin = role in ("OWNER", "ADMIN")

    if not is_author and not is_admin:
        raise HTTPException(status_code=403, detail="Not authorized to delete this thread")

    await soft_delete_thread(db, thread_id, thread_obj.author_id)
    return {"success": True, "message": "Thread deleted"}'''

    patch_file(path, old_delete, new_delete)


# ═══════════════════════════════════════════════════════════════════════════════
#  TRIBE ROUTES — ADMIN ENDPOINTS
# ═══════════════════════════════════════════════════════════════════════════════

TRIBE_ADMIN_ROUTES = '''\
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime, timezone
from app.database.session import get_db
from app.auth.dependencies import get_current_user
from app.models.user import User
from app.models.tribe import Tribe
from app.models.thread import Thread
from app.models.tribe_role import TribeRole
from app.services.role_service import (
    get_user_role,
    promote_to_admin,
    demote_to_member,
    remove_from_tribe,
    get_tribe_members_with_roles,
)
from app.schemas.user import UserOut

router = APIRouter(prefix="/tribes/admin", tags=["tribe-admin"])


@router.get("/{tribe_id}/members")
async def list_members(
    tribe_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    role = await get_user_role(db, tribe_id, current_user.id)
    if role not in ("OWNER", "ADMIN"):
        raise HTTPException(status_code=403, detail="Admin access required")

    members = await get_tribe_members_with_roles(db, tribe_id)
    result = []
    for tribe_role, user in members:
        result.append({
            "user": UserOut.model_validate(user),
            "role": tribe_role.role,
            "joined_at": tribe_role.created_at.isoformat(),
        })
    return result


@router.post("/{tribe_id}/members/{user_id}/promote")
async def promote_member(
    tribe_id: str,
    user_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    role = await get_user_role(db, tribe_id, current_user.id)
    if role != "OWNER":
        raise HTTPException(status_code=403, detail="Only owner can promote members")

    target_role = await get_user_role(db, tribe_id, user_id)
    if not target_role:
        raise HTTPException(status_code=404, detail="User is not a member of this tribe")
    if target_role == "OWNER":
        raise HTTPException(status_code=400, detail="Cannot change owner role")

    updated = await promote_to_admin(db, tribe_id, user_id)
    return {"success": True, "role": updated.role}


@router.post("/{tribe_id}/members/{user_id}/demote")
async def demote_member(
    tribe_id: str,
    user_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    role = await get_user_role(db, tribe_id, current_user.id)
    if role != "OWNER":
        raise HTTPException(status_code=403, detail="Only owner can demote admins")

    target_role = await get_user_role(db, tribe_id, user_id)
    if not target_role:
        raise HTTPException(status_code=404, detail="User is not a member of this tribe")
    if target_role == "OWNER":
        raise HTTPException(status_code=400, detail="Cannot change owner role")

    updated = await demote_to_member(db, tribe_id, user_id)
    return {"success": True, "role": updated.role}


@router.delete("/{tribe_id}/members/{user_id}")
async def remove_member(
    tribe_id: str,
    user_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    caller_role = await get_user_role(db, tribe_id, current_user.id)
    if caller_role not in ("OWNER", "ADMIN"):
        raise HTTPException(status_code=403, detail="Admin access required")

    target_role = await get_user_role(db, tribe_id, user_id)
    if not target_role:
        raise HTTPException(status_code=404, detail="User is not a member of this tribe")
    if target_role == "OWNER":
        raise HTTPException(status_code=400, detail="Cannot remove the owner")
    if caller_role == "ADMIN" and target_role == "ADMIN":
        raise HTTPException(status_code=403, detail="Admins cannot remove other admins")

    await remove_from_tribe(db, tribe_id, user_id)
    return {"success": True, "message": "Member removed"}


@router.delete("/{tribe_id}")
async def delete_tribe(
    tribe_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    role = await get_user_role(db, tribe_id, current_user.id)
    if role != "OWNER":
        raise HTTPException(status_code=403, detail="Only the owner can delete a tribe")

    result = await db.execute(select(Tribe).where(Tribe.id == tribe_id))
    tribe = result.scalar_one_or_none()
    if not tribe:
        raise HTTPException(status_code=404, detail="Tribe not found")

    # Soft-delete all threads in tribe
    threads_result = await db.execute(
        select(Thread).where(Thread.tribe_id == tribe_id, Thread.deleted_at.is_(None))
    )
    for thread in threads_result.scalars().all():
        thread.deleted_at = datetime.now(timezone.utc)

    # Delete all roles
    roles_result = await db.execute(select(TribeRole).where(TribeRole.tribe_id == tribe_id))
    for role_row in roles_result.scalars().all():
        await db.delete(role_row)

    # Delete memberships
    from app.models.tribe import TribeMember
    members_result = await db.execute(
        select(TribeMember).where(TribeMember.tribe_id == tribe_id)
    )
    for member in members_result.scalars().all():
        await db.delete(member)

    await db.delete(tribe)
    await db.flush()

    return {"success": True, "message": "Tribe deleted"}
'''


def create_tribe_admin_routes():
    write_file(BACKEND / "app" / "routes" / "tribe_admin.py", TRIBE_ADMIN_ROUTES)


# ═══════════════════════════════════════════════════════════════════════════════
#  UPDATE MAIN.PY — REGISTER NEW ROUTERS
# ═══════════════════════════════════════════════════════════════════════════════

def update_main_routes():
    path = BACKEND / "app" / "main.py"
    if not path.exists():
        print("  [SKIP] main.py not found")
        return

    content = read_file(path)

    patches = []

    # Add imports
    if "tribe_admin" not in content:
        old = "from app.routes import auth, users, threads, chat, files, otp, search, tribes"
        new = (
            "from app.routes import auth, users, threads, chat, files, otp, search, tribes\n"
            "from app.routes import comments as comments_routes\n"
            "from app.routes import tribe_admin"
        )
        patches.append((old, new))

    # Add router registrations
    if "tribe_admin.router" not in content:
        old_router = "app.include_router(tribes.router)"
        new_router = (
            "app.include_router(tribes.router)\n"
            "app.include_router(comments_routes.router)\n"
            "app.include_router(tribe_admin.router)"
        )
        patches.append((old_router, new_router))

    for old, new in patches:
        patch_file(path, old, new)


# ═══════════════════════════════════════════════════════════════════════════════
#  UPDATE TRIBE SERVICE — ADD OWNER ROLE ON CREATE
# ═══════════════════════════════════════════════════════════════════════════════

def update_tribe_service():
    path = BACKEND / "app" / "services" / "tribe_service.py"
    if not path.exists():
        print("  [SKIP] tribe_service.py not found")
        return

    content = read_file(path)

    if "ensure_owner_role" in content:
        print("  [SKIP] tribe_service already has owner role setup")
        return

    # Add import
    old_import = "from app.models.tribe import"
    if old_import in content:
        patch_file(
            path,
            old_import,
            "from app.services.role_service import ensure_owner_role\n" + old_import,
        )

    # Find the create_tribe function and add ensure_owner_role after flush
    old_flush = "await db.flush()\n    await db.refresh(tribe)\n    return tribe"
    if old_flush in content:
        new_flush = (
            "await db.flush()\n"
            "    await ensure_owner_role(db, tribe.id, user_id)\n"
            "    await db.refresh(tribe)\n"
            "    return tribe"
        )
        # Only patch the first occurrence (in create_tribe)
        patch_file(path, old_flush, new_flush)
    else:
        print("  [NOTE] Could not auto-patch tribe_service — add ensure_owner_role() manually")


# ═══════════════════════════════════════════════════════════════════════════════
#  FRONTEND COMPONENTS
# ═══════════════════════════════════════════════════════════════════════════════

CONTEXT_MENU = '''\
"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MoreVertical, Trash2, Edit, Shield, X } from "lucide-react";

interface MenuItem {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  danger?: boolean;
  disabled?: boolean;
}

interface ContextMenuProps {
  items: MenuItem[];
}

export default function ContextMenu({ items }: ContextMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen(!open);
        }}
        className="w-7 h-7 flex items-center justify-center rounded-lg text-txt-faint hover:text-txt hover:bg-surface-2 transition-all"
      >
        <MoreVertical size={16} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -4 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-8 z-50 w-44 bg-surface-2 border border-border rounded-xl shadow-2xl overflow-hidden py-1"
          >
            {items.map((item, i) => (
              <button
                key={i}
                disabled={item.disabled}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setOpen(false);
                  item.onClick();
                }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-colors ${
                  item.danger
                    ? "text-down hover:bg-down/10"
                    : "text-txt-muted hover:text-txt hover:bg-surface-3"
                } ${item.disabled ? "opacity-40 pointer-events-none" : ""}`}
              >
                {item.icon}
                {item.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
'''


CONFIRM_MODAL = '''\
"use client";

import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, X } from "lucide-react";
import { useState } from "react";

interface ConfirmModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  danger?: boolean;
  requireTyping?: boolean;
  loading?: boolean;
}

export default function ConfirmModal({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirm",
  danger = true,
  requireTyping = false,
  loading = false,
}: ConfirmModalProps) {
  const [typed, setTyped] = useState("");

  const canConfirm = !requireTyping || typed === "DELETE";

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] bg-base/80 backdrop-blur flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 12 }}
            onClick={(e) => e.stopPropagation()}
            className="card max-w-md w-full"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                {danger && (
                  <div className="w-10 h-10 bg-down/10 rounded-xl flex items-center justify-center">
                    <AlertTriangle size={20} className="text-down" />
                  </div>
                )}
                <h3 className="font-heading font-semibold text-lg text-txt">
                  {title}
                </h3>
              </div>
              <button onClick={onClose} className="btn-icon">
                <X size={16} />
              </button>
            </div>

            <p className="text-sm text-txt-muted leading-relaxed mb-4">
              {message}
            </p>

            {requireTyping && (
              <div className="mb-4">
                <p className="text-xs text-txt-faint mb-2">
                  Type <span className="font-mono font-bold text-txt">DELETE</span> to confirm:
                </p>
                <input
                  type="text"
                  value={typed}
                  onChange={(e) => setTyped(e.target.value)}
                  placeholder="Type DELETE"
                  className="input-field font-mono"
                  autoFocus
                />
              </div>
            )}

            <div className="flex items-center justify-end gap-3">
              <button onClick={onClose} className="btn-secondary text-sm">
                Cancel
              </button>
              <button
                onClick={onConfirm}
                disabled={!canConfirm || loading}
                className={`btn-primary text-sm flex items-center gap-2 ${
                  danger ? "bg-down hover:bg-down/90" : ""
                }`}
              >
                {loading && (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                )}
                {confirmText}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
'''


TRIBE_ADMIN_PANEL = '''\
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
'''


def create_frontend_components():
    write_file(FRONTEND / "components" / "ContextMenu.tsx", CONTEXT_MENU)
    write_file(FRONTEND / "components" / "ConfirmModal.tsx", CONFIRM_MODAL)
    write_file(FRONTEND / "components" / "TribeAdminPanel.tsx", TRIBE_ADMIN_PANEL)


# ═══════════════════════════════════════════════════════════════════════════════
#  UPDATE API CLIENT
# ═══════════════════════════════════════════════════════════════════════════════

def update_api_client():
    path = FRONTEND / "lib" / "api.ts"
    if not path.exists():
        print("  [SKIP] lib/api.ts not found")
        return

    content = read_file(path)

    # Add comments API if missing
    if "commentsApi" not in content:
        append_if_missing(
            path,
            "commentsApi",
            '''

// Comments
export const commentsApi = {
  delete: (id: string) =>
    api<any>(`/comments/${id}`, { method: "DELETE" }),
};
''',
        )

    # Add tribe admin API if missing
    if "adminMembers" not in content:
        # Find tribesApi closing brace
        append_if_missing(
            path,
            "adminMembers",
            "",
        )

        # Replace the entire tribesApi block
        old_tribes = '''// Tribes
export const tribesApi = {
  list: () => api<any[]>("/tribes"),
  detail: (name: string) => api<any>(`/tribes/${name}`),
  threads: (name: string, skip = 0, limit = 20) =>
    api<any[]>(`/tribes/${name}/threads?skip=${skip}&limit=${limit}`),
  create: (data: { name: string; description: string }) =>
    api<any>("/tribes", { method: "POST", body: JSON.stringify(data) }),
  join: (tribeId: string) =>
    api<any>(`/tribes/${tribeId}/join`, { method: "POST" }),
  leave: (tribeId: string) =>
    api<any>(`/tribes/${tribeId}/leave`, { method: "POST" }),
};'''

        new_tribes = '''// Tribes
export const tribesApi = {
  list: () => api<any[]>("/tribes"),
  detail: (name: string) => api<any>(`/tribes/${name}`),
  threads: (name: string, skip = 0, limit = 20) =>
    api<any[]>(`/tribes/${name}/threads?skip=${skip}&limit=${limit}`),
  create: (data: { name: string; description: string }) =>
    api<any>("/tribes", { method: "POST", body: JSON.stringify(data) }),
  join: (tribeId: string) =>
    api<any>(`/tribes/${tribeId}/join`, { method: "POST" }),
  leave: (tribeId: string) =>
    api<any>(`/tribes/${tribeId}/leave`, { method: "POST" }),
  // Admin
  adminMembers: (tribeId: string) =>
    api<any[]>(`/tribes/admin/${tribeId}/members`),
  promote: (tribeId: string, userId: string) =>
    api<any>(`/tribes/admin/${tribeId}/members/${userId}/promote`, { method: "POST" }),
  demote: (tribeId: string, userId: string) =>
    api<any>(`/tribes/admin/${tribeId}/members/${userId}/demote`, { method: "POST" }),
  removeMember: (tribeId: string, userId: string) =>
    api<any>(`/tribes/admin/${tribeId}/members/${userId}`, { method: "DELETE" }),
  deleteTribe: (tribeId: string) =>
    api<any>(`/tribes/admin/${tribeId}`, { method: "DELETE" }),
};'''

        patch_file(path, old_tribes, new_tribes)


# ═══════════════════════════════════════════════════════════════════════════════
#  GENERATE MANUAL UPDATE INSTRUCTIONS
# ═══════════════════════════════════════════════════════════════════════════════

MANUAL_INSTRUCTIONS = '''
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
'''


def save_manual_instructions():
    path = ROOT / "MANUAL_UPDATES.md"
    path.write_text(MANUAL_INSTRUCTIONS, encoding="utf-8")
    print(f"  [OK] {path.name} — follow these instructions for React component edits")


# ═══════════════════════════════════════════════════════════════════════════════
#  MAIN
# ═══════════════════════════════════════════════════════════════════════════════

def main():
    print()
    print("=" * 70)
    print("  ThreadIt Admin & Media Update")
    print("=" * 70)
    print()
    print(f"  Project root: {ROOT}")
    print(f"  Backup dir:   {BACKUP}")
    print()

    # Create backup directory
    BACKUP.mkdir(exist_ok=True)

    # ── BACKEND ────────────────────────────────────────────────────────────
    print("[1/8] Creating TribeRole model...")
    create_tribe_role_model()

    print("\n[2/8] Updating ThreadMedia model...")
    update_thread_media_model()

    print("\n[3/8] Updating Tribe model...")
    update_tribe_model()

    print("\n[4/8] Creating role service...")
    create_role_service()

    print("\n[5/8] Creating comments routes...")
    create_comments_routes()

    print("\n[6/8] Updating thread routes (delete with role check)...")
    update_thread_routes_delete()

    print("\n[7/8] Creating tribe admin routes...")
    create_tribe_admin_routes()

    print("\n[7a] Updating main.py routes...")
    update_main_routes()

    print("\n[7b] Updating tribe service (owner role on create)...")
    update_tribe_service()

    # ── FRONTEND ───────────────────────────────────────────────────────────
    print("\n[8/8] Creating frontend components...")
    create_frontend_components()

    print("\n[8a] Updating API client...")
    update_api_client()

    print("\n[8b] Saving manual update instructions...")
    save_manual_instructions()

    # ── SUMMARY ────────────────────────────────────────────────────────────
    print()
    print("=" * 70)
    print("  UPDATE COMPLETE")
    print("=" * 70)
    print()
    print("  Files created/modified:")
    print("    Backend:")
    print("      - models/tribe_role.py (NEW)")
    print("      - models/thread_media.py (UPDATED)")
    print("      - models/tribe.py (UPDATED)")
    print("      - services/role_service.py (NEW)")
    print("      - routes/comments.py (NEW)")
    print("      - routes/threads.py (UPDATED — delete with role check)")
    print("      - routes/tribe_admin.py (NEW)")
    print("      - main.py (UPDATED — new routers)")
    print("      - services/tribe_service.py (UPDATED — owner role)")
    print()
    print("    Frontend:")
    print("      - components/ContextMenu.tsx (NEW)")
    print("      - components/ConfirmModal.tsx (NEW)")
    print("      - components/TribeAdminPanel.tsx (NEW)")
    print("      - lib/api.ts (UPDATED — new endpoints)")
    print()
    print("    Manual updates needed:")
    print("      → Read MANUAL_UPDATES.md for React component edits")
    print()
    print(f"  Backup saved to: {BACKUP}")
    print()
    print("  Next steps:")
    print("    1. Follow MANUAL_UPDATES.md for React component changes")
    print("    2. Start backend:  cd backend && uvicorn app.main:app --reload")
    print("    3. Start frontend: cd frontend && npm run dev")
    print("    4. Test:")
    print("       - Create a tribe (you become owner)")
    print("       - Post a thread with image/video")
    print("       - Delete your own thread (three-dot menu)")
    print("       - Open tribe admin panel (settings icon)")
    print("       - Promote/remove members")
    print("       - Delete tribe (requires typing DELETE)")
    print()


if __name__ == "__main__":
    main()