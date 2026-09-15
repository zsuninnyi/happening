import { useQuery } from '@tanstack/react-query';
import { listAdminDeliveries } from '../../api/admin';
import { useAuth } from '../../auth/AuthContext';

export function AdminHistoryPage() {
  const { token } = useAuth();
  const deliveriesQuery = useQuery({
    queryKey: ['admin', 'deliveries'],
    queryFn: () => listAdminDeliveries(token!),
    enabled: Boolean(token),
  });

  return (
    <section className="panel">
      <h1>All deliveries</h1>
      <p className="muted">Notification history across all users.</p>
      {deliveriesQuery.isLoading && <p>Loading…</p>}
      {deliveriesQuery.isError && <p className="error">Could not load deliveries.</p>}
      {deliveriesQuery.data && deliveriesQuery.data.length === 0 && (
        <p className="muted">No deliveries yet.</p>
      )}
      {deliveriesQuery.data && deliveriesQuery.data.length > 0 && (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>When</th>
                <th>Status</th>
                <th>User</th>
                <th>Channel</th>
                <th>Destination</th>
                <th>Alert</th>
                <th>Event</th>
                <th>Error</th>
              </tr>
            </thead>
            <tbody>
              {deliveriesQuery.data.map((delivery) => (
                <tr key={delivery.id}>
                  <td>{new Date(delivery.createdAt).toLocaleString()}</td>
                  <td>{delivery.status}</td>
                  <td className="mono">{delivery.userId}</td>
                  <td>{delivery.channel}</td>
                  <td>{delivery.destination}</td>
                  <td className="mono">{delivery.alertId}</td>
                  <td className="mono">{delivery.eventId}</td>
                  <td>{delivery.error ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
