import UserDetail from '@/views/Users/UserDetail';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function UserDetailPage({ params }: PageProps) {
  const { id } = await params;
  return <UserDetail userId={id} />;
}
