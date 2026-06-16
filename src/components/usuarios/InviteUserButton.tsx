"use client";

import { useState } from "react";
import { UserPlus } from "lucide-react";
import { InviteUserModal } from "./InviteUserModal";

export function InviteUserButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button onClick={() => setOpen(true)} className="btn-primary">
        <UserPlus className="h-4 w-4" />
        Convidar usuário
      </button>
      <InviteUserModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
