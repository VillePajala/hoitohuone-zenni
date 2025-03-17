'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useAuth } from '@clerk/nextjs';
import { 
  Loader2,
  CheckCircle, 
  XCircle,
  Edit,
  Trash,
  Plus
} from 'lucide-react';
import { SkeletonLoader } from '@/components/admin/SkeletonLoader';

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

export default function ServiceList() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { getToken } = useAuth();

  useEffect(() => {
    async function fetchServices() {
      try {
        setLoading(true);
        const token = await getToken();
        
        const response = await fetch('/api/admin/services', {
          headers: {
            'Authorization': `Bearer ${token || ''}`,
          },
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch services');
        }
        
        const data = await response.json();
        setServices(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching services:', err);
        setError('Failed to load services. Please try again.');
        
        // Fallback to empty array in case of error
        setServices([]);
      } finally {
        setLoading(false);
      }
    }
    
    fetchServices();
  }, [getToken]);

  const toggleServiceStatus = async (service: Service) => {
    try {
      const token = await getToken();
      const response = await fetch(`/api/admin/services/${service.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token || ''}`,
        },
        body: JSON.stringify({ active: !service.active }),
      });

      if (!response.ok) {
        throw new Error('Failed to update service status');
      }

      const updatedService = await response.json();
      setServices(services.map(s => s.id === service.id ? updatedService : s));
    } catch (error) {
      console.error('Error toggling service status:', error);
      setError('Failed to update service status. Please try again.');
    }
  };

  const deleteService = async (serviceId: string) => {
    if (!confirm('Are you sure you want to delete this service?')) {
      return;
    }

    try {
      const token = await getToken();
      const response = await fetch(`/api/admin/services/${serviceId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token || ''}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete service');
      }

      setServices(services.filter(service => service.id !== serviceId));
    } catch (error) {
      console.error('Error deleting service:', error);
      setError('Failed to delete service. Please try again.');
    }
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : services.length === 0 ? (
        <div className="text-center py-12 border rounded-lg">
          <p className="text-gray-500 mb-4">No services found.</p>
          <Link href="/admin/services/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Your First Service
            </Button>
          </Link>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="px-4 py-2 text-left">Name</th>
                <th className="px-4 py-2 text-left">Duration</th>
                <th className="px-4 py-2 text-left">Price</th>
                <th className="px-4 py-2 text-left">Status</th>
                <th className="px-4 py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {services.map(service => (
                <tr key={service.id} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-3">{service.name}</td>
                  <td className="px-4 py-3">{service.duration} min</td>
                  <td className="px-4 py-3">{service.price} {service.currency}</td>
                  <td className="px-4 py-3">
                    {service.active ? (
                      <span className="inline-flex items-center text-green-700">
                        <CheckCircle className="mr-1 h-4 w-4" />
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center text-red-700">
                        <XCircle className="mr-1 h-4 w-4" />
                        Inactive
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => toggleServiceStatus(service)}
                      title={service.active ? "Deactivate service" : "Activate service"}
                    >
                      {service.active ? <XCircle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                    </Button>
                    <Link href={`/admin/services/${service.id}`}>
                      <Button variant="outline" size="sm" title="Edit service">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => deleteService(service.id)}
                      title="Delete service"
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
} 