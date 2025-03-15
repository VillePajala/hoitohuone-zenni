import React from 'react';
import { Metadata } from 'next';
import { ServiceList } from '@/components/admin/services/ServiceList';

export const metadata: Metadata = {
  title: 'Service Management | Admin',
  description: 'Manage services for Hoitohuone Zenni',
};

export default function ServicesPage() {
  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Service Management</h1>
      </div>
      
      <ServiceList />
    </div>
  );
} 