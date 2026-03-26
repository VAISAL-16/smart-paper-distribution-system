import { useEffect, useMemo, useState } from "react";
import { Shield, UserCheck, UserX } from "lucide-react";
import { toast } from "sonner";
import { fetchUsers, updateUserStatus } from "../services/api";

function UserAccessManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState("ALL");

  useEffect(() => {
    const loadUsers = async () => {
      try {
        const rows = await fetchUsers();
        setUsers(Array.isArray(rows) ? rows : []);
      } catch (error) {
        toast.error(error.message || "Failed to load users");
      } finally {
        setLoading(false);
      }
    };
    loadUsers();
  }, []);

  const filteredUsers = useMemo(
    () => users.filter((user) => roleFilter === "ALL" || user.role === roleFilter),
    [users, roleFilter]
  );

  const toggleStatus = async (user) => {
    try {
      const result = await updateUserStatus(user.role, user.id, !user.active);
      setUsers((prev) =>
        prev.map((item) => (item.id === user.id ? { ...item, active: result.user.active } : item))
      );
      toast.success(`User ${result.user.active ? "enabled" : "disabled"}.`);
    } catch (error) {
      toast.error(error.message || "Failed to update user");
    }
  };

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-500">
        Loading users...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-gradient-to-r from-slate-900 via-slate-800 to-cyan-900 text-white p-6 md:p-8">
        <p className="text-xs uppercase tracking-[0.2em] text-cyan-200 font-bold">Admin Control</p>
        <h2 className="mt-2 text-2xl md:text-4xl font-black">User Access Management</h2>
        <p className="mt-2 text-sm text-slate-300">Enable or disable operator accounts by role without touching the database manually.</p>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 flex-1">
            <StatCard label="Total Users" value={users.length} />
            <StatCard label="Admins" value={users.filter((user) => user.role === "ADMIN").length} />
            <StatCard label="Setters" value={users.filter((user) => user.role === "PAPER_SETTER").length} />
            <StatCard label="Invigilators" value={users.filter((user) => user.role === "INVIGILATOR").length} />
          </div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="h-11 rounded-xl border border-slate-300 px-3 text-sm outline-none bg-white"
          >
            <option value="ALL">All Roles</option>
            <option value="ADMIN">Admin</option>
            <option value="PAPER_SETTER">Paper Setter</option>
            <option value="INVIGILATOR">Invigilator</option>
          </select>
        </div>
      </section>

      <section className="grid gap-3">
        {filteredUsers.map((user) => (
          <article key={user.id} className="rounded-2xl border border-slate-200 bg-white p-4 md:p-5">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-lg font-black text-slate-900">{user.name}</p>
                <p className="text-sm text-slate-500">{user.email}</p>
                <p className="text-xs text-slate-500 mt-1">{user.role} • {user.provider}</p>
              </div>
              <div className="flex items-center gap-3">
                <span
                  className={`rounded-full px-3 py-1 text-xs font-bold ${
                    user.active ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
                  }`}
                >
                  {user.active ? "ACTIVE" : "DISABLED"}
                </span>
                <button
                  onClick={() => toggleStatus(user)}
                  className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 font-bold text-sm ${
                    user.active
                      ? "bg-rose-600 text-white hover:bg-rose-700"
                      : "bg-emerald-600 text-white hover:bg-emerald-700"
                  }`}
                >
                  {user.active ? <UserX size={15} /> : <UserCheck size={15} />}
                  {user.active ? "Disable" : "Enable"}
                </button>
              </div>
            </div>
          </article>
        ))}
        {filteredUsers.length === 0 && (
          <div className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
            No users found for this filter.
          </div>
        )}
      </section>
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-slate-500">{label}</p>
        <Shield size={15} className="text-slate-400" />
      </div>
      <p className="mt-2 text-2xl font-black text-slate-900">{value}</p>
    </div>
  );
}

export default UserAccessManagement;
