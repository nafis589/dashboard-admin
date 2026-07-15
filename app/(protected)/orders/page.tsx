import { Suspense } from 'react';
import OrderList from '@/views/Orders/OrderList';

export default function OrdersPage() {
  return (
    <Suspense fallback={<div className="text-sm text-muted-foreground">Chargement…</div>}>
      <OrderList />
    </Suspense>
  );
}
