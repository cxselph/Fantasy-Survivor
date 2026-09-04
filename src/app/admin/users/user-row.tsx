"use client";

import { useActionState } from "react";
import {
  updateInvite,
  updateUser,
  disableUser,
  enableUser,
  unlockUser,
  type UpdateUserState,
  type UpdateInviteState,
} from "@/lib/actions/users";
import { DeleteUserButton } from "./delete-user-button";

// Shared column template so the header and every row (regardless of which fields/actions it
// shows) line up - a plain <table> can't do this cleanly once each row needs to be its own
// <form>, so each row is a grid with the same explicit columns instead.
export const USER_ROW_GRID = "grid grid-cols-[minmax(120px,1fr)_minmax(170px,1.4fr)_100px_130px_minmax(150px,auto)] gap-3";

type UserRowUser = {
  id: number;
  name: string;
  email: string;
  role: "ADMIN" | "MEMBER";
};

export function UserRow({
  user,
  status,
  isSelf,
  isLastAdmin,
  isLocked,
}: {
  user: UserRowUser;
  status: "pending" | "active" | "disabled";
  isSelf: boolean;
  isLastAdmin: boolean;
  isLocked?: boolean;
}) {
  const isPending = status === "pending";
  const saveAction = (isPending ? updateInvite : updateUser) as (
    prevState: UpdateInviteState | UpdateUserState | undefined,
    formData: FormData,
  ) => Promise<UpdateInviteState | UpdateUserState>;
  const [state, formAction, pending] = useActionState(saveAction, undefined);

  const saveFormId = `user-save-${user.id}`;
  const canDeactivateOrDelete = !isSelf && !isLastAdmin;

  return (
    <div className={`${USER_ROW_GRID} items-center border-b border-neutral-100 py-2 text-sm`}>
      <form id={saveFormId} action={formAction} />
      <input form={saveFormId} type="hidden" name="userId" value={user.id} />

      <input
        form={saveFormId}
        type="text"
        name="name"
        defaultValue={user.name}
        required
        className="w-full rounded-md border border-neutral-300 px-2 py-1 text-sm focus:border-orange-500 focus:outline-none"
      />
      <input
        form={saveFormId}
        type="email"
        name="email"
        defaultValue={user.email}
        required
        className="w-full rounded-md border border-neutral-300 px-2 py-1 text-sm focus:border-orange-500 focus:outline-none"
      />
      <select
        form={saveFormId}
        name="role"
        defaultValue={user.role}
        className="w-full rounded-md border border-neutral-300 px-2 py-1 text-sm focus:border-orange-500 focus:outline-none"
      >
        <option value="MEMBER">Member</option>
        <option value="ADMIN">Admin</option>
      </select>

      <div className="flex flex-col gap-0.5">
        {status === "pending" && <span className="font-medium text-yellow-700">Invite pending</span>}
        {status === "active" && <span className="font-medium text-green-700">Active</span>}
        {status === "disabled" && <span className="font-medium text-neutral-500">Disabled</span>}
        {isLocked && <span className="font-medium text-red-700">🔒 Locked out</span>}
        {state?.error && <span className="text-xs text-red-600">{state.error}</span>}
        {state?.success && <span className="text-xs text-green-700">{state.success}</span>}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          form={saveFormId}
          type="submit"
          disabled={pending}
          className="rounded-md border border-orange-300 bg-white px-2 py-1 text-xs font-semibold text-orange-700 hover:border-orange-400 disabled:opacity-50"
        >
          {pending ? "Saving..." : isPending ? "Save & resend" : "Save"}
        </button>

        {status === "disabled" && (
          <form action={enableUser.bind(null, user.id)}>
            <button type="submit" className="text-xs font-semibold text-orange-700 underline hover:no-underline">
              Enable
            </button>
          </form>
        )}

        {isLocked && (
          <form action={unlockUser.bind(null, user.id)}>
            <button type="submit" className="text-xs font-semibold text-orange-700 underline hover:no-underline">
              Unlock
            </button>
          </form>
        )}

        {status === "active" && canDeactivateOrDelete && (
          <form action={disableUser.bind(null, user.id)}>
            <button type="submit" className="text-xs font-semibold text-orange-700 underline hover:no-underline">
              Disable
            </button>
          </form>
        )}

        {(status !== "active" || canDeactivateOrDelete) && (
          <DeleteUserButton userId={user.id} name={user.name} label={isPending ? "Delete invite" : "Delete"} />
        )}
      </div>
    </div>
  );
}
