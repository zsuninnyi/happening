import { Outlet } from '@tanstack/react-router';

export function RootLayout() {
  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', margin: '2rem' }}>
      <header style={{ marginBottom: '1.5rem' }}>
        <strong>happening</strong>
      </header>
      <Outlet />
    </div>
  );
}
