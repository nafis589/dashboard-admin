import OrderDetail from '@/views/Orders/OrderDetail';

interface OrderDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function OrderDetailPage({ params }: OrderDetailPageProps) {
  const { id } = await params;
  return <OrderDetail orderId={id} />;
}
