import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { BackToAdmin } from "@/components/back-to-admin";
import { InviteForm } from "./invite-form";
import { UserRow, USER_ROW_GRID_TEMPLATE } from "./user-row";

export default async function AdminUsersPage() {
  const session = await requireAdmin();

  const [users, unclaimedTeams] = await Promise.all([
    prisma.user.findMany({ orderBy: [{ role: "asc" }, { name: "asc" }] }),
    prisma.fantasyTeam.findMany({
      where: { userId: null },
      include: { season: true },
      orderBy: [{ season: { number: "desc" } }, { ownerName: "asc" }],
    }),
  ]);

  const activeAdminCount = users.filter((u) => u.role === "ADMIN" && u.passwordHash && !u.disabledAt).length;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-bold">Manage Users</h1>
        <BackToAdmin />
      </div>

      <section className="rounded-lg border border-neutral-200 bg-white p-4">
        <h2 className="mb-3 font-semibold">Invite a user</h2>
        <InviteForm
          unclaimedTeams={unclaimedTeams.map((t) => ({
            id: t.id,
            ownerName: t.ownerName,
            seasonNumber: t.season.number,
          }))}
        />
      </section>

      <section className="rounded-lg border border-neutral-200 bg-white p-4">
        <h2 className="mb-3 font-semibold">Users</h2>
        {users.length === 0 ? (
          <p className="text-sm text-neutral-500">No users yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <div className="min-w-[720px]">
              <div
                className="grid gap-3 border-b border-neutral-200 px-1 pb-2 text-left text-sm font-medium text-neutral-500"
                style={{ gridTemplateColumns: USER_ROW_GRID_TEMPLATE }}
              >
                <span>Name</span>
                <span>Email</span>
                <span>Role</span>
                <span>Status</span>
                <span>Actions</span>
              </div>
              {users.map((user) => {
                const status = !user.passwordHash ? "pending" : user.disabledAt ? "disabled" : "active";
                const isLocked = !!user.lockedUntil && user.lockedUntil > new Date();
                const isLastAdmin = user.role === "ADMIN" && status === "active" && activeAdminCount <= 1;
                return (
                  <UserRow
                    key={user.id}
                    user={{ id: user.id, name: user.name, email: user.email, role: user.role }}
                    status={status}
                    isSelf={user.id === session.userId}
                    isLastAdmin={isLastAdmin}
                    isLocked={isLocked}
                  />
                );
              })}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
