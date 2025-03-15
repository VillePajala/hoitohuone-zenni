'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Loader2 } from 'lucide-react';

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

type ServiceFormProps = {
  service: Service | null;
  onSubmit: (service: Service) => void;
  onCancel: () => void;
};

export default function ServiceForm({ service, onSubmit, onCancel }: ServiceFormProps) {
  const [formData, setFormData] = useState<Omit<Service, 'id'> & { id?: string }>({
    name: '',
    nameEn: '',
    nameFi: '',
    description: '',
    descriptionEn: '',
    descriptionFi: '',
    duration: 60,
    price: 0,
    currency: 'EUR',
    active: true,
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState<boolean>(false);
  const [apiError, setApiError] = useState<string | null>(null);
  
  useEffect(() => {
    if (service) {
      setFormData({
        id: service.id,
        name: service.name,
        nameEn: service.nameEn,
        nameFi: service.nameFi,
        description: service.description,
        descriptionEn: service.descriptionEn,
        descriptionFi: service.descriptionFi,
        duration: service.duration,
        price: service.price,
        currency: service.currency,
        active: service.active,
      });
    }
  }, [service]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (!formData.nameEn.trim()) {
      newErrors.nameEn = 'English name is required';
    }
    
    if (!formData.nameFi.trim()) {
      newErrors.nameFi = 'Finnish name is required';
    }
    
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }
    
    if (!formData.descriptionEn.trim()) {
      newErrors.descriptionEn = 'English description is required';
    }
    
    if (!formData.descriptionFi.trim()) {
      newErrors.descriptionFi = 'Finnish description is required';
    }
    
    if (formData.duration <= 0) {
      newErrors.duration = 'Duration must be greater than 0';
    }
    
    if (formData.price < 0) {
      newErrors.price = 'Price cannot be negative';
    }
    
    if (!formData.currency.trim()) {
      newErrors.currency = 'Currency is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) : value,
    }));
    
    // Clear the error for this field if it exists
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleSwitchChange = (checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      active: checked,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    setApiError(null);
    
    try {
      const isEditing = !!service;
      const url = isEditing 
        ? `/api/admin/services/${service.id}` 
        : '/api/admin/services';
      
      const response = await fetch(url, {
        method: isEditing ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save service');
      }
      
      const savedService = await response.json();
      onSubmit(savedService);
    } catch (err) {
      const error = err as Error;
      setApiError(error.message || 'An error occurred. Please try again.');
      console.error('Error saving service:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-xl font-semibold">
          {service ? 'Edit Service' : 'Create New Service'}
        </h2>
        <p className="text-gray-500 text-sm">
          {service
            ? 'Update the details of this service'
            : 'Add a new service to your booking system'}
        </p>
      </div>

      {apiError && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {apiError}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className={errors.name ? 'border-red-500' : ''}
            />
            {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
          </div>
          
          <div>
            <Label htmlFor="nameEn">English Name</Label>
            <Input
              id="nameEn"
              name="nameEn"
              value={formData.nameEn}
              onChange={handleChange}
              className={errors.nameEn ? 'border-red-500' : ''}
            />
            {errors.nameEn && <p className="text-red-500 text-sm mt-1">{errors.nameEn}</p>}
          </div>
          
          <div>
            <Label htmlFor="nameFi">Finnish Name</Label>
            <Input
              id="nameFi"
              name="nameFi"
              value={formData.nameFi}
              onChange={handleChange}
              className={errors.nameFi ? 'border-red-500' : ''}
            />
            {errors.nameFi && <p className="text-red-500 text-sm mt-1">{errors.nameFi}</p>}
          </div>
          
          <div>
            <Label htmlFor="description">Description</Label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-md ${
                errors.description ? 'border-red-500' : 'border-gray-300'
              }`}
              rows={3}
            />
            {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
          </div>
        </div>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="descriptionEn">English Description</Label>
            <textarea
              id="descriptionEn"
              name="descriptionEn"
              value={formData.descriptionEn}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-md ${
                errors.descriptionEn ? 'border-red-500' : 'border-gray-300'
              }`}
              rows={3}
            />
            {errors.descriptionEn && <p className="text-red-500 text-sm mt-1">{errors.descriptionEn}</p>}
          </div>
          
          <div>
            <Label htmlFor="descriptionFi">Finnish Description</Label>
            <textarea
              id="descriptionFi"
              name="descriptionFi"
              value={formData.descriptionFi}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-md ${
                errors.descriptionFi ? 'border-red-500' : 'border-gray-300'
              }`}
              rows={3}
            />
            {errors.descriptionFi && <p className="text-red-500 text-sm mt-1">{errors.descriptionFi}</p>}
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="duration">Duration (minutes)</Label>
              <Input
                id="duration"
                name="duration"
                type="number"
                value={formData.duration}
                onChange={handleChange}
                min="1"
                className={errors.duration ? 'border-red-500' : ''}
              />
              {errors.duration && <p className="text-red-500 text-sm mt-1">{errors.duration}</p>}
            </div>
            
            <div>
              <Label htmlFor="price">Price</Label>
              <Input
                id="price"
                name="price"
                type="number"
                step="0.01"
                value={formData.price}
                onChange={handleChange}
                min="0"
                className={errors.price ? 'border-red-500' : ''}
              />
              {errors.price && <p className="text-red-500 text-sm mt-1">{errors.price}</p>}
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="currency">Currency</Label>
              <Input
                id="currency"
                name="currency"
                value={formData.currency}
                onChange={handleChange}
                className={errors.currency ? 'border-red-500' : ''}
              />
              {errors.currency && <p className="text-red-500 text-sm mt-1">{errors.currency}</p>}
            </div>
            
            <div className="flex items-center space-x-2 pt-6">
              <Switch 
                id="active" 
                checked={formData.active} 
                onCheckedChange={handleSwitchChange} 
              />
              <Label htmlFor="active">Active</Label>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end space-x-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {service ? 'Update' : 'Create'} Service
        </Button>
      </div>
    </form>
  );
} 