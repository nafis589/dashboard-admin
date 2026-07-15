import { Suspense } from 'react';
import UserList from '@/views/Users/UserList';

export default function UsersPage() {
  return (
    <Suspense fallback={<div className="text-sm text-muted-foreground">Chargement…</div>}>
      <UserList />
    </Suspense>
  );
}
