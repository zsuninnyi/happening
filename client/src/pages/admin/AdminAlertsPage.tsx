import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { listAdminAlerts, toggleAdminAlert } from '../../api/admin';
import { useAuth } from '../../auth/AuthContext';

export function AdminAlertsPage() {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  const alertsQuery = useQuery({
    queryKey: ['admin', 'alerts'],
    queryFn: () => listAdminAlerts(token!),
    enabled: Boolean(token),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, enabled }: { id: string; enabled: boolean }) =>
      toggleAdminAlert(token!, id, enabled),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'alerts'] });
    },
  });

  return (
    <section className="panel">
      <h1>All alerts</h1>
      <p className="muted">Enable or disable any user’s alert.</p>
      {alertsQuery.isLoading && <p>Loading…</p>}
      {alertsQuery.isError && <p className="error">Could not load alerts.</p>}
      {alertsQuery.data && (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>User</th>
                <th>Categories</th>
                <th>Channel</th>
                <th>Destination</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {alertsQuery.data.map((alert) => (
                <tr key={alert.id}>
                  <td>{alert.name}</td>
                  <td className="mono">{alert.userId}</td>
                  <td>{alert.categories.join(', ')}</td>
                  <td>{alert.channel}</td>
                  <td>{alert.destination}</td>
                  <td>{alert.enabled ? 'on' : 'off'}</td>
                  <td>
                    <button
                      type="button"
                      className="button button-secondary"
                      disabled={toggleMutation.isPending}
                      onClick={() =>
                        toggleMutation.mutate({ id: alert.id, enabled: !alert.enabled })
                      }
                    >
                      {alert.enabled ? 'Disable' : 'Enable'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
