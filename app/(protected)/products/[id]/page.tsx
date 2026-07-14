import ProductDetail from '@/views/Products/ProductDetail';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminProductDetailPage({ params }: PageProps) {
  const { id } = await params;
  return <ProductDetail productId={id} />;
}
