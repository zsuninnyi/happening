import { useQuery } from '@tanstack/react-query';
import { fetchHealth } from '../api/health';

export function HomePage() {
  const healthQuery = useQuery({
    queryKey: ['health'],
    queryFn: fetchHealth,
  });

  return (
    <main>
      <h1>Scaffold</h1>
      <p>Step 0 — project structure only. Business features come next.</p>
      <section>
        <h2>API health</h2>
        {healthQuery.isLoading && <p>Checking API…</p>}
        {healthQuery.isError && <p>API unreachable (start the server).</p>}
        {healthQuery.data && (
          <pre style={{ background: '#f4f4f4', padding: '1rem' }}>
            {JSON.stringify(healthQuery.data, null, 2)}
          </pre>
        )}
      </section>
    </main>
  );
}
