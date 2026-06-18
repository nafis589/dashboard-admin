'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { admin, isLoading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !admin) router.replace('/login');
  }, [isLoading, admin, router]);

  if (isLoading || !admin) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <Loader2 className="size-6 animate-spin" />
      </div>
    );
  }

  if (!['ADMIN', 'SUPER_ADMIN'].includes(admin.role)) {
    logout();
    return null;
  }

  return <>{children}</>;
}
