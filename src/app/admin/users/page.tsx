import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { InviteForm } from "./invite-form";
import { PendingInviteRow } from "./pending-invite-row";

export default async function AdminUsersPage() {
  await requireAdmin();

  const [users, unclaimedTeams] = await Promise.all([
    prisma.user.findMany({ orderBy: [{ role: "asc" }, { name: "asc" }] }),
    prisma.fantasyTeam.findMany({
      where: { userId: null },
      include: { season: true },
      orderBy: [{ season: { number: "desc" } }, { ownerName: "asc" }],
    }),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">Manage Users</h1>

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
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-200 text-left text-neutral-500">
                <th className="py-2 pr-2">Name</th>
                <th className="py-2 pr-2">Email</th>
                <th className="py-2 pr-2">Role</th>
                <th className="py-2 pr-2">Status</th>
                <th className="py-2 pr-2"></th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) =>
                user.passwordHash ? (
                  <tr key={user.id} className="border-b border-neutral-100">
                    <td className="py-2 pr-2">{user.name}</td>
                    <td className="py-2 pr-2 text-neutral-600">{user.email}</td>
                    <td className="py-2 pr-2">{user.role === "ADMIN" ? "Admin" : "Member"}</td>
                    <td className="py-2 pr-2">
                      <span className="text-green-700">Active</span>
                    </td>
                    <td className="py-2 pr-2"></td>
                  </tr>
                ) : (
                  <PendingInviteRow
                    key={user.id}
                    user={{ id: user.id, email: user.email, name: user.name, role: user.role }}
                  />
                ),
              )}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
