'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { 
  Loader2,
  CheckCircle, 
  XCircle,
  Edit,
  Trash,
  Plus,
  GripVertical,
  Save
} from 'lucide-react';
import { SkeletonLoader } from '@/components/admin/SkeletonLoader';
import { ErrorDisplay } from '@/components/ui/ErrorDisplay';
import { withErrorBoundary } from '@/components/ErrorBoundary';
import { ErrorType, createError, logError } from '@/lib/errorHandling';
import { useAuthContext } from '@/contexts/AuthContext';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useClerkAdminAuth } from '@/hooks/useClerkAdminAuth';

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
  order: number;
};

// Sortable service row component
const SortableServiceRow = ({ service, onToggleStatus, onDeleteService }: { 
  service: Service; 
  onToggleStatus: (service: Service) => void; 
  onDeleteService: (serviceId: string) => void;
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: service.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <tr ref={setNodeRef} style={style} className="border-t hover:bg-gray-50">
      <td className="px-2 py-3">
        <div className="flex items-center">
          <button
            className="cursor-grab p-1 mr-2 text-gray-400 hover:text-gray-600 focus:outline-none"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="h-5 w-5" />
          </button>
        </div>
      </td>
      <td className="px-2 py-3">{service.name}</td>
      <td className="px-2 py-3">{service.duration} min</td>
      <td className="px-2 py-3">{service.price} {service.currency}</td>
      <td className="px-2 py-3">
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
      <td className="px-2 py-3 text-right space-x-2">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => onToggleStatus(service)}
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
          onClick={() => onDeleteService(service.id)}
          title="Delete service"
        >
          <Trash className="h-4 w-4" />
        </Button>
      </td>
    </tr>
  );
};

function ServiceListComponent() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [reorderMode, setReorderMode] = useState(false);
  const [hasReordered, setHasReordered] = useState(false);
  const router = useRouter();
  const { authFetch } = useClerkAdminAuth(true); // Auto-redirect if not authenticated
  
  // Initialize sensors for drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Fetch services
  useEffect(() => {
    async function fetchServices() {
      try {
        setLoading(true);
        
        const response = await authFetch('/api/admin/services');
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          const errorMessage = errorData.message && typeof errorData.message === 'string'
            ? errorData.message
            : 'Failed to fetch services';
          
          throw createError(
            ErrorType.VALIDATION,
            errorMessage,
            errorData
          );
        }
        
        const data = await response.json();
        setServices(data);
        setError(null);
      } catch (err) {
        logError('Error fetching services:', err);
        setError(err instanceof Error ? err : new Error('Failed to load services'));
      } finally {
        setLoading(false);
      }
    }
    
    fetchServices();
  }, [authFetch]);

  // Handle drag end event
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      setServices((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        
        // Create new array with updated order
        const newItems = arrayMove(items, oldIndex, newIndex);
        
        // Update the order property of each service
        return newItems.map((service, index) => ({
          ...service,
          order: index
        }));
      });
      
      setHasReordered(true);
    }
  };

  // Save the new service order
  const saveServiceOrder = async () => {
    try {
      setLoading(true);
      
      const response = await authFetch('/api/admin/services/reorder', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          services: services.map((service, index) => ({
            id: service.id,
            order: index
          }))
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.message && typeof errorData.message === 'string'
          ? errorData.message
          : 'Failed to save service order';
        
        throw createError(
          ErrorType.VALIDATION,
          errorMessage,
          errorData
        );
      }
      
      setHasReordered(false);
      setReorderMode(false);
    } catch (err) {
      logError('Error saving service order:', err);
      setError(err instanceof Error ? err : new Error('Failed to save service order'));
    } finally {
      setLoading(false);
    }
  };

  const toggleServiceStatus = async (service: Service) => {
    try {
      const response = await authFetch(`/api/admin/services/${service.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ active: !service.active }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.message && typeof errorData.message === 'string'
          ? errorData.message
          : 'Failed to update service status';
        
        throw createError(
          ErrorType.VALIDATION,
          errorMessage,
          errorData
        );
      }

      // Update local state on success
      setServices(
        services.map((s) =>
          s.id === service.id ? { ...s, active: !service.active } : s
        )
      );
    } catch (err) {
      logError('Error updating service status:', err);
      setError(err instanceof Error ? err : new Error('Failed to update service status'));
    }
  };

  const deleteService = async (serviceId: string) => {
    if (!window.confirm('Are you sure you want to delete this service? This cannot be undone.')) {
      return;
    }

    try {
      const response = await authFetch(`/api/admin/services/${serviceId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.message && typeof errorData.message === 'string'
          ? errorData.message
          : 'Failed to delete service';
        
        throw createError(
          ErrorType.VALIDATION,
          errorMessage,
          errorData
        );
      }

      // Remove from local state on success
      setServices(services.filter((s) => s.id !== serviceId));
    } catch (err) {
      logError('Error deleting service:', err);
      setError(err instanceof Error ? err : new Error('Failed to delete service'));
    }
  };

  if (loading && !services.length) {
    return <SkeletonLoader type="services" />;
  }

  if (error) {
    return (
      <ErrorDisplay 
        message={error.message} 
        onRetry={() => {
          setError(null);
          setLoading(true);
          router.refresh();
        }} 
      />
    );
  }

  return (
    <div>
      {/* Top controls */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Services ({services.length})</h2>
        <div className="space-x-2">
          {reorderMode ? (
            <>
              <Button
                onClick={saveServiceOrder}
                disabled={loading || !hasReordered}
                variant="default"
                className="flex items-center gap-2"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {loading ? 'Saving...' : 'Save Order'}
              </Button>
              <Button
                onClick={() => setReorderMode(false)}
                variant="outline"
                className="flex items-center gap-2"
                disabled={loading}
              >
                Cancel
              </Button>
            </>
          ) : (
            <>
              <Button
                onClick={() => setReorderMode(true)}
                variant="outline"
                className="flex items-center gap-2"
              >
                <GripVertical className="h-4 w-4" />
                Reorder Services
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Services table */}
      <div className="bg-white rounded-md shadow-sm overflow-x-auto">
        {reorderMode ? (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Order
                  </th>
                  <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Duration
                  </th>
                  <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-2 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                <SortableContext
                  items={services.map((service) => service.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {services.map((service) => (
                    <SortableServiceRow
                      key={service.id}
                      service={service}
                      onToggleStatus={toggleServiceStatus}
                      onDeleteService={deleteService}
                    />
                  ))}
                </SortableContext>
              </tbody>
            </table>
          </DndContext>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Order
                </th>
                <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Duration
                </th>
                <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Price
                </th>
                <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-2 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {services.map((service) => (
                <tr key={service.id} className="border-t hover:bg-gray-50">
                  <td className="px-2 py-3 text-gray-500">{service.order + 1}</td>
                  <td className="px-2 py-3">{service.name}</td>
                  <td className="px-2 py-3">{service.duration} min</td>
                  <td className="px-2 py-3">{service.price} {service.currency}</td>
                  <td className="px-2 py-3">
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
                  <td className="px-2 py-3 text-right space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => toggleServiceStatus(service)}
                      disabled={loading}
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
                      disabled={loading}
                      title="Delete service"
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
              {services.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-2 py-10 text-center text-gray-500">
                    No services found. Create your first service to get started.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
      
      {/* Loading indicator */}
      {loading && services.length > 0 && (
        <div className="flex justify-center mt-4">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        </div>
      )}
    </div>
  );
}

// Export the component wrapped in error boundary
export default withErrorBoundary(ServiceListComponent); 