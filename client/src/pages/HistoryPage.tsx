import { useQuery } from '@tanstack/react-query';
import { listDeliveries } from '../api/deliveries';
import { useAuth } from '../auth/AuthContext';

export function HistoryPage() {
  const { token } = useAuth();
  const deliveriesQuery = useQuery({
    queryKey: ['deliveries'],
    queryFn: () => listDeliveries(token!),
    enabled: Boolean(token),
  });

  return (
    <section className="panel">
      <h1>My history</h1>
      <p className="muted">Deliveries for your alerts.</p>
      {deliveriesQuery.isLoading && <p>Loading…</p>}
      {deliveriesQuery.isError && <p className="error">Could not load history.</p>}
      {deliveriesQuery.data && deliveriesQuery.data.length === 0 && (
        <p className="muted">No deliveries yet. Ask an admin to fire a matching event.</p>
      )}
      {deliveriesQuery.data && deliveriesQuery.data.length > 0 && (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>When</th>
                <th>Status</th>
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
