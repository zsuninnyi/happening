import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, type FormEvent } from 'react';
import { createAlert, listAlerts, toggleAlert } from '../api/alerts';
import { ApiError } from '../api/client';
import type { Alert } from '../api/types';
import { useAuth } from '../auth/AuthContext';

const CATEGORIES = ['news', 'markets', 'disasters'] as const;

export function AlertsPage() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [categories, setCategories] = useState<string[]>(['news']);
  const [minSeverity, setMinSeverity] = useState('low');
  const [channel, setChannel] = useState('email');
  const [destination, setDestination] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const alertsQuery = useQuery({
    queryKey: ['alerts'],
    queryFn: () => listAlerts(token!),
    enabled: Boolean(token),
  });

  const createMutation = useMutation({
    mutationFn: () =>
      createAlert(token!, {
        name,
        categories,
        minSeverity,
        channel,
        destination,
      }),
    onSuccess: async () => {
      setName('');
      setDestination('');
      setFormError(null);
      await queryClient.invalidateQueries({ queryKey: ['alerts'] });
    },
    onError: (err: unknown) => {
      setFormError(err instanceof ApiError ? err.message : 'Could not create alert');
    },
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, enabled }: { id: string; enabled: boolean }) =>
      toggleAlert(token!, id, enabled),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['alerts'] });
    },
  });

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (categories.length === 0) {
      setFormError('Pick at least one category');
      return;
    }
    createMutation.mutate();
  }

  function toggleCategory(category: string) {
    setCategories((current) =>
      current.includes(category)
        ? current.filter((item) => item !== category)
        : [...current, category],
    );
  }

  return (
    <section className="stack">
      <section className="panel">
        <h1>My alerts</h1>
        <p className="muted">Create and enable/disable alerts for categories you care about.</p>
        <form className="form" onSubmit={onSubmit}>
          <label>
            Name
            <input value={name} onChange={(e) => setName(e.target.value)} required />
          </label>
          <fieldset>
            <legend>Categories</legend>
            <div className="checkbox-row">
              {CATEGORIES.map((category) => (
                <label key={category} className="inline">
                  <input
                    type="checkbox"
                    checked={categories.includes(category)}
                    onChange={() => toggleCategory(category)}
                  />
                  {category}
                </label>
              ))}
            </div>
          </fieldset>
          <label>
            Min severity
            <select value={minSeverity} onChange={(e) => setMinSeverity(e.target.value)}>
              <option value="low">low</option>
              <option value="medium">medium</option>
              <option value="high">high</option>
            </select>
          </label>
          <label>
            Channel
            <select value={channel} onChange={(e) => setChannel(e.target.value)}>
              <option value="email">email</option>
              <option value="slack">slack</option>
            </select>
          </label>
          <label>
            Destination
            <input
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              placeholder="you@example.com or #channel"
              required
            />
          </label>
          {formError && <p className="error">{formError}</p>}
          <button className="button" type="submit" disabled={createMutation.isPending}>
            Create alert
          </button>
        </form>
      </section>

      <section className="panel">
        <h2>Existing alerts</h2>
        {alertsQuery.isLoading && <p>Loading…</p>}
        {alertsQuery.isError && <p className="error">Could not load alerts.</p>}
        {alertsQuery.data && alertsQuery.data.length === 0 && (
          <p className="muted">No alerts yet.</p>
        )}
        {alertsQuery.data && alertsQuery.data.length > 0 && (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Categories</th>
                  <th>Min severity</th>
                  <th>Channel</th>
                  <th>Destination</th>
                  <th>Status</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {alertsQuery.data.map((alert: Alert) => (
                  <tr key={alert.id}>
                    <td>{alert.name}</td>
                    <td>{alert.categories.join(', ')}</td>
                    <td>{alert.minSeverity}</td>
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
    </section>
  );
}
