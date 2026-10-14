import { useEffect, useState } from "react";
import { createUser, fetchUsers, type ManagedUser, type UserRole } from "../../lib/api";

export function UsersPage({ token }: { token: string }) {
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("user");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadUsers() {
      try {
        const response = await fetchUsers(token);
        if (isMounted) {
          setUsers(response);
          setError(null);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : "Unable to load users");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadUsers();

    return () => {
      isMounted = false;
    };
  }, [token]);

  async function handleCreateUser(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    setIsSubmitting(true);

    try {
      const newUser = await createUser(token, { email, password, role });
      setUsers((currentUsers) => [newUser, ...currentUsers]);
      setEmail("");
      setPassword("");
      setRole("user");
      setSuccess(`Created ${newUser.email}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create user");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <section className="dashboard-panel">
        <p className="status-message">Loading users...</p>
      </section>
    );
  }

  return (
    <section className="users-layout">
      <form className="dashboard-panel user-form" onSubmit={handleCreateUser}>
        <div>
          <p className="eyebrow">New user</p>
          <h2>Add user</h2>
        </div>

        <label>
          Email
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="name@dealer.com"
            required
          />
        </label>
        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Temporary password"
            required
          />
        </label>
        <label>
          Role
          <select value={role} onChange={(event) => setRole(event.target.value as UserRole)}>
            <option value="user">Regular user</option>
            <option value="admin">Admin</option>
          </select>
        </label>

        {error ? <p className="form-error">{error}</p> : null}
        {success ? <p className="form-success">{success}</p> : null}

        <button
          className="button button-primary full-width"
          type="submit"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Creating..." : "Create user"}
        </button>
      </form>

      <section className="dashboard-panel users-panel">
        <div>
          <p className="eyebrow">Directory</p>
          <h2>All users</h2>
        </div>

        <div className="users-list">
          {users.map((managedUser) => (
            <div className="user-row" key={managedUser.id}>
              <div>
                <strong>{managedUser.email}</strong>
                <span>
                  Created {new Date(managedUser.createdAt).toLocaleDateString()}
                </span>
              </div>
              <span className="role-pill">{managedUser.role}</span>
            </div>
          ))}
        </div>
      </section>
    </section>
  );
}
