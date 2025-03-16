'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Plus, Edit, Trash, Check, X, Loader2 } from 'lucide-react';
import Link from 'next/link';
import ServiceForm from '@/components/admin/services/ServiceForm';
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

export function ServiceList() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const router = useRouter();
  const { getToken } = useAuth();

  // Fetch services
  useEffect(() => {
    async function fetchServices() {
      try {
        setLoading(true);
        const response = await fetch('/api/admin/services', {
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch services');
        }
        
        const data = await response.json();
        setServices(data);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Error loading services. Please try again.';
        setError(errorMessage);
        console.error('Error fetching services:', err);
      } finally {
        setLoading(false);
      }
    }
    
    fetchServices();
  }, []);

  const handleCreateService = () => {
    setEditingService(null);
    setIsFormOpen(true);
  };

  const handleEditService = (service: Service) => {
    setEditingService(service);
    setIsFormOpen(true);
  };

  const handleToggleStatus = async (service: Service) => {
    try {
      const response = await fetch(`/api/admin/services/${service.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ active: !service.active }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update service status');
      }

      // Update local state
      setServices(services.map(s => 
        s.id === service.id ? { ...s, active: !s.active } : s
      ));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error updating service status. Please try again.';
      setError(errorMessage);
      console.error('Error updating service status:', err);
    }
  };

  const handleDeleteService = async (id: string) => {
    if (!confirm('Are you sure you want to delete this service? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/services/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete service');
      }

      // Remove from local state
      setServices(services.filter(service => service.id !== id));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error deleting service. Please try again.';
      setError(errorMessage);
      console.error('Error deleting service:', err);
    }
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingService(null);
  };

  const handleFormSubmit = (newOrUpdatedService: Service) => {
    if (editingService) {
      // Update existing service in the list
      setServices(services.map(service => 
        service.id === newOrUpdatedService.id ? newOrUpdatedService : service
      ));
    } else {
      // Add new service to the list
      setServices([...services, newOrUpdatedService]);
    }
    
    setIsFormOpen(false);
    setEditingService(null);
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
          {error}
        </div>
      )}

      <div className="flex justify-end">
        <Button 
          onClick={handleCreateService}
          className="flex items-center gap-2"
        >
          <Plus size={16} />
          Add New Service
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="animate-spin h-8 w-8 text-gray-500" />
        </div>
      ) : services.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">No services found. Create your first service to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service) => (
            <Card key={service.id} className="overflow-hidden">
              <div className={`p-4 border-l-4 ${service.active ? 'border-green-500' : 'border-gray-300'}`}>
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-lg">{service.name}</h3>
                  <div className="flex space-x-1">
                    <button
                      onClick={() => handleToggleStatus(service)}
                      className={`p-1 rounded-full ${service.active ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'}`}
                      aria-label={service.active ? 'Deactivate service' : 'Activate service'}
                    >
                      {service.active ? <Check size={16} /> : <X size={16} />}
                    </button>
                    <button
                      onClick={() => handleEditService(service)}
                      className="p-1 bg-blue-100 text-blue-600 rounded-full"
                      aria-label="Edit service"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => handleDeleteService(service.id)}
                      className="p-1 bg-red-100 text-red-600 rounded-full"
                      aria-label="Delete service"
                    >
                      <Trash size={16} />
                    </button>
                  </div>
                </div>
                
                <div className="mb-2 text-sm space-y-1">
                  <p className="text-gray-600">Duration: {service.duration} minutes</p>
                  <p className="text-gray-600">Price: {service.price} {service.currency}</p>
                  <p className="text-gray-600">Status: {service.active ? 'Active' : 'Inactive'}</p>
                </div>
                
                <p className="text-gray-700 text-sm line-clamp-2">
                  {service.description}
                </p>
              </div>
            </Card>
          ))}
        </div>
      )}

      {isFormOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-3xl max-h-[90vh] overflow-auto">
            <ServiceForm 
              service={editingService}
              onSubmit={handleFormSubmit}
              onCancel={handleFormClose}
            />
          </div>
        </div>
      )}
    </div>
  );
} 