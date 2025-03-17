import React from 'react';
import { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import EditServiceClient from './EditServiceClient';

export const metadata: Metadata = {
  title: 'Edit Service - Admin Dashboard',
};

// Use React.cache to memoize the fetch function
const getService = React.cache(async (id: string) => {
  try {
    const service = await prisma.service.findUnique({
      where: { id }
    });
    
    return service;
  } catch (error) {
    console.error('Error fetching service:', error);
    return null;
  }
});

export default async function EditServicePage({ params }: { params: { id: string } }) {
  // Get the service data on the server side
  const service = await getService(params.id);
  
  // Pass the data to the client component
  return <EditServiceClient initialService={service} serviceId={params.id} />;
} 