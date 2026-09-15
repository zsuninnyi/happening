import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, type FormEvent } from 'react';
import { createAdminEvent, listAdminEvents } from '../../api/admin';
import { ApiError } from '../../api/client';
import { useAuth } from '../../auth/AuthContext';

export function AdminEventsPage() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [category, setCategory] = useState('news');
  const [severity, setSeverity] = useState('medium');
  const [externalId, setExternalId] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const eventsQuery = useQuery({
    queryKey: ['admin', 'events'],
    queryFn: () => listAdminEvents(token!),
    enabled: Boolean(token),
  });

  const createMutation = useMutation({
    mutationFn: () =>
      createAdminEvent(token!, {
        title,
        summary: summary || undefined,
        category,
        severity,
        externalId: externalId || undefined,
      }),
    onSuccess: async (result) => {
      setMessage(
        `Event created. matched=${result.counts.matched}, sent=${result.counts.sent}, failed=${result.counts.failed}, skipped=${result.counts.skipped}`,
      );
      setError(null);
      setTitle('');
      setSummary('');
      setExternalId('');
      await queryClient.invalidateQueries({ queryKey: ['admin'] });
    },
    onError: (err: unknown) => {
      setMessage(null);
      setError(err instanceof ApiError ? err.message : 'Could not create event');
    },
  });

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    createMutation.mutate();
  }

  return (
    <section className="stack">
      <section className="panel">
        <h1>Fire test event</h1>
        <p className="muted">Simulated event source for the MVP.</p>
        <form className="form" onSubmit={onSubmit}>
          <label>
            Title
            <input value={title} onChange={(e) => setTitle(e.target.value)} required />
          </label>
          <label>
            Summary
            <input value={summary} onChange={(e) => setSummary(e.target.value)} />
          </label>
          <label>
            Category
            <select value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="news">news</option>
              <option value="markets">markets</option>
              <option value="disasters">disasters</option>
            </select>
          </label>
          <label>
            Severity
            <select value={severity} onChange={(e) => setSeverity(e.target.value)}>
              <option value="low">low</option>
              <option value="medium">medium</option>
              <option value="high">high</option>
            </select>
          </label>
          <label>
            External id (optional, used for dedupe)
            <input value={externalId} onChange={(e) => setExternalId(e.target.value)} />
          </label>
          {message && <p className="success">{message}</p>}
          {error && <p className="error">{error}</p>}
          <button className="button" type="submit" disabled={createMutation.isPending}>
            Fire event
          </button>
        </form>
      </section>

      <section className="panel">
        <h2>Events</h2>
        {eventsQuery.isLoading && <p>Loading…</p>}
        {eventsQuery.data && (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>When</th>
                  <th>Title</th>
                  <th>Category</th>
                  <th>Severity</th>
                  <th>External id</th>
                </tr>
              </thead>
              <tbody>
                {eventsQuery.data.map((event) => (
                  <tr key={event.id}>
                    <td>{new Date(event.createdAt).toLocaleString()}</td>
                    <td>{event.title}</td>
                    <td>{event.category}</td>
                    <td>{event.severity}</td>
                    <td>{event.externalId ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </section>
  );
}
