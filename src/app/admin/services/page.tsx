'use client';

import React from 'react';
import ServiceList from '@/components/admin/services/ServiceList';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import Link from 'next/link';

// Remove the metadata export since this is a client component
// export const metadata: Metadata = {
//   title: 'Service Management | Admin',
//   description: 'Manage services for Hoitohuone Zenni',
// };

// Export the component as the default export
const ServicesPage = () => {
  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Service Management</h1>
        <Link href="/admin/services/new">
          <Button className="flex items-center gap-2">
            <Plus size={16} />
            Create Service
          </Button>
        </Link>
      </div>
      
      <div className="mb-6">
        <p className="text-gray-500">
          Manage your services, set prices, and control which services are active in the booking system.
        </p>
      </div>
      
      <ServiceList />
    </div>
  );
};

export default ServicesPage; 