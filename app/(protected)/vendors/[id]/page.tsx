import VendorDetail from '@/views/VendorDetail';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function VendorDetailPage({ params }: PageProps) {
  const { id } = await params;
  return <VendorDetail vendorId={id} />;
}
