import "./../styles/adminUsersManager.css";
import { useMemo, useState } from "react";
import { supabase } from "../supabaseClient";

function AdminUsersManager({
  adminUsers = [],
  fetchAdminUsers,
  profiles = [],
  setMessage,
}) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    role: "sales_admin",
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [saving, setSaving] = useState(false);

  const filteredAdmins = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();

    if (!search) return adminUsers;

    return adminUsers.filter((admin) => {
      const value =
        `${admin.name || ""} ${admin.email || ""} ${admin.role || ""}`.toLowerCase();

      return value.includes(search);
    });
  }, [adminUsers, searchTerm]);

  const roleLabel = (role) =>
    role === "super_admin" ? "Super Admin" : "Sales Admin";

  const createAdmin = async (e) => {
    e.preventDefault();
    setMessage("");

    const name = form.name.trim();
    const email = form.email.trim().toLowerCase();

    if (!name || !email) {
      setMessage("Please complete all fields.");
      return;
    }

    setSaving(true);

    const { error } = await supabase.from("admin_users").insert({
      name,
      email,
      role: form.role,
      is_active: true,
    });

    setSaving(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    setForm({
      name: "",
      email: "",
      role: "sales_admin",
    });

    setMessage("Admin created successfully.");

    fetchAdminUsers();
  };

  const updateAdmin = async (id, field, value) => {
    const { error } = await supabase
      .from("admin_users")
      .update({ [field]: value })
      .eq("id", id);

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage("Admin updated.");

    fetchAdminUsers();
  };

  const deleteAdmin = async (admin) => {
    if (
      !window.confirm(`Delete ${admin.name || admin.email}?`)
    )
      return;

    const { error } = await supabase
      .from("admin_users")
      .delete()
      .eq("id", admin.id);

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage("Admin deleted.");

    fetchAdminUsers();
  };
    return (
    <div className="admin-users-manager">

      <div className="admin-users-header">
        <div>
          <h2>👥 Admin Management</h2>
          <p>Create and manage administrator accounts.</p>
        </div>
      </div>

      <div className="admin-create-card">

        <form onSubmit={createAdmin}>

          <div className="admin-create-grid">

            <input
              type="text"
              placeholder="Full Name"
              value={form.name}
              onChange={(e) =>
                setForm({ ...form, name: e.target.value })
              }
              required
            />

            <input
              type="email"
              placeholder="Email Address"
              value={form.email}
              onChange={(e) =>
                setForm({ ...form, email: e.target.value })
              }
              required
            />

            <select
              value={form.role}
              onChange={(e) =>
                setForm({ ...form, role: e.target.value })
              }
            >
              <option value="sales_admin">
                Sales Admin
              </option>

              <option value="super_admin">
                Super Admin
              </option>
            </select>

            <button
              className="admin-create-btn"
              type="submit"
              disabled={saving}
            >
              {saving ? "Creating..." : "+ Create Admin"}
            </button>

          </div>

        </form>

      </div>

      <div className="admin-search">

        <input
          type="text"
          placeholder="Search administrators..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />

        <span className="stock-badge in">
          {filteredAdmins.length} Admin
          {filteredAdmins.length !== 1 ? "s" : ""}
        </span>

      </div>

      <div className="admin-table-card">

        <table>

          <thead>

            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>

          </thead>

          <tbody>

            {filteredAdmins.length === 0 ? (

              <tr>
                <td colSpan="5">
                  No administrators found.
                </td>
              </tr>

            ) : (

              filteredAdmins.map((admin) => (

                <tr key={admin.id}>

                  <td>{admin.name}</td>

                  <td>{admin.email}</td>

                  <td>

                    <span
                      className={
                        admin.role === "super_admin"
                          ? "role-badge role-super"
                          : "role-badge role-sales"
                      }
                    >
                      {roleLabel(admin.role)}
                    </span>

                  </td>

                  <td>

                    <span
                      className={
                        admin.is_active
                          ? "status-active"
                          : "status-disabled"
                      }
                    >
                      {admin.is_active
                        ? "● Active"
                        : "● Disabled"}
                    </span>

                  </td>

                  <td>

                    <div className="action-buttons">

                      <button
                        type="button"
                        className="btn-role"
                        onClick={() =>
                          updateAdmin(
                            admin.id,
                            "role",
                            admin.role === "super_admin"
                              ? "sales_admin"
                              : "super_admin"
                          )
                        }
                      >
                        Change Role
                      </button>

                      <button
                        type="button"
                        className="btn-disable"
                        onClick={() =>
                          updateAdmin(
                            admin.id,
                            "is_active",
                            !admin.is_active
                          )
                        }
                      >
                        {admin.is_active
                          ? "Disable"
                          : "Activate"}
                      </button>

                      <button
                        type="button"
                        className="btn-delete"
                        onClick={() => deleteAdmin(admin)}
                      >
                        Delete
                      </button>

                    </div>

                  </td>

                </tr>

              ))

            )}

          </tbody>

        </table>

      </div>

      <div className="admin-table-card" style={{ marginTop: "35px" }}>

        <div style={{ padding: "22px" }}>
          <h2>👥 Registered Customers</h2>
          <p>Total Customers: {profiles.length}</p>
        </div>

        <table>

          <thead>

            <tr>
              <th>Full Name</th>
              <th>Email</th>
              <th>Registered Date</th>
            </tr>

          </thead>

          <tbody>

            {profiles.length === 0 ? (

              <tr>
                <td colSpan="3">
                  No registered customers.
                </td>
              </tr>

            ) : (

              profiles.map((profile) => (

                <tr key={profile.id}>

                  <td>
                    {profile.full_name || "Not provided"}
                  </td>

                  <td>{profile.email}</td>

                  <td>
                    {profile.created_at
                      ? new Date(
                          profile.created_at
                        ).toLocaleString()
                      : "N/A"}
                  </td>

                </tr>

              ))

            )}

          </tbody>

        </table>

      </div>

    </div>
  );
}

export default AdminUsersManager;