import { AuthGuard } from '@/components/auth/AuthGuard';
import { AppHeader } from '@/components/layout/AppHeader';

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
        <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, overflowY: 'auto', overflowX: 'hidden' }}>{children}</main>
      </div>
    </AuthGuard>
  );
}
