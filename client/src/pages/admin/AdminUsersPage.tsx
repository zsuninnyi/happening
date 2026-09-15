import { useQuery } from '@tanstack/react-query';
import { listAdminUsers } from '../../api/admin';
import { useAuth } from '../../auth/AuthContext';

export function AdminUsersPage() {
  const { token } = useAuth();
  const usersQuery = useQuery({
    queryKey: ['admin', 'users'],
    queryFn: () => listAdminUsers(token!),
    enabled: Boolean(token),
  });

  return (
    <section className="panel">
      <h1>Users</h1>
      <p className="muted">Seeded demo accounts (passwords never returned).</p>
      {usersQuery.isLoading && <p>Loading…</p>}
      {usersQuery.isError && <p className="error">Could not load users.</p>}
      {usersQuery.data && (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
              </tr>
            </thead>
            <tbody>
              {usersQuery.data.map((user) => (
                <tr key={user.id}>
                  <td>{user.name}</td>
                  <td>{user.email}</td>
                  <td>{user.role}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
