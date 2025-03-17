'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import PageLoading from '@/components/PageLoading';

export default function CancellationRedirect() {
  const params = useParams();
  const router = useRouter();
  const cancellationId = params.id as string;
  
  useEffect(() => {
    // Redirect to the correct Finnish cancellation path
    router.replace(`/fi/peruuta-varaus/${cancellationId}`);
  }, [cancellationId, router]);
  
  return <PageLoading />;
} 