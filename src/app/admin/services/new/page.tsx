'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import ServiceForm from '@/components/admin/services/ServiceForm';
import { useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';

type Service = {
  id: string;
  name: string;
  nameEn: string;
  nameFi: string;
  description: string;
  descriptionEn: string;
  descriptionFi: string;
  duration: number;
  price: number;
  currency: string;
  active: boolean;
};

export default function NewServicePage() {
  const router = useRouter();
  const { getToken } = useAuth();
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  const handleSubmit = async (serviceData: Service) => {
    try {
      setLoading(true);
      setError(null);
      
      const token = await getToken();
      
      const response = await fetch('/api/admin/services', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token || ''}`,
        },
        body: JSON.stringify(serviceData),
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create service');
      }
      
      router.push('/admin/services');
      router.refresh();
    } catch (err) {
      console.error('Error creating service:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <Link href="/admin/services">
            <Button variant="outline" size="icon" className="mr-2">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-3xl font-bold tracking-tight">Create New Service</h1>
        </div>
      </div>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
          {error}
        </div>
      )}
      
      <Card className="mb-6">
        <CardContent className="pt-6">
          <ServiceForm 
            service={null} 
            onSubmit={handleSubmit} 
            onCancel={() => router.push('/admin/services')}
          />
        </CardContent>
      </Card>
    </div>
  );
} 