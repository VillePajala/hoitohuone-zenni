'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import styles from './booking.module.css';

// Define Service type based on our Prisma schema
interface Service {
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
}

interface ServiceSelectionProps {
  onServiceSelect: (service: Service) => void;
  selectedServiceId?: string;
}

export default function ServiceSelection({ onServiceSelect, selectedServiceId }: ServiceSelectionProps) {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const router = useRouter();
  const pathname = usePathname();
  const isEnglish = pathname.startsWith('/en');
  
  // Get the appropriate name and description fields based on language
  const getLocalizedField = (service: Service, fieldName: 'name' | 'description') => {
    if (isEnglish) {
      return service[`${fieldName}En`];
    } else {
      return service[`${fieldName}Fi`];
    }
  };

  // Format duration as hours and minutes
  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    
    if (hours === 0) {
      return `${minutes} ${isEnglish ? 'min' : 'min'}`;
    } else if (remainingMinutes === 0) {
      return `${hours} ${isEnglish ? 'hour' : 'tunti'}${hours > 1 ? (isEnglish ? 's' : 'a') : ''}`;
    } else {
      return `${hours} ${isEnglish ? 'hour' : 'tunti'}${hours > 1 ? (isEnglish ? 's' : 'a') : ''} ${remainingMinutes} ${isEnglish ? 'min' : 'min'}`;
    }
  };

  // Fetch services from API
  useEffect(() => {
    const fetchServices = async () => {
      try {
        setLoading(true);
        
        // Fetch services from API
        const response = await fetch('/api/services');
        
        if (!response.ok) {
          throw new Error('Failed to fetch services');
        }
        
        const data = await response.json();
        
        // Set services state if data is valid
        if (Array.isArray(data) && data.length > 0) {
          setServices(data);
        } else {
          // Use mock data if API returns empty array or invalid data
          console.warn('Using mock data for services');
          setServices([
            {
              id: 'service-1',
              name: 'Classic Massage',
              nameEn: 'Classic Massage',
              nameFi: 'Klassinen hieronta',
              description: 'Relaxing full body massage',
              descriptionEn: 'Relaxing full body massage that helps to reduce tension and improve circulation.',
              descriptionFi: 'Rentouttava koko kehon hieronta, joka auttaa vähentämään jännitystä ja parantamaan verenkiertoa.',
              duration: 60,
              price: 75,
              currency: 'EUR',
              active: true
            },
            {
              id: 'service-2',
              name: 'Deep Tissue Massage',
              nameEn: 'Deep Tissue Massage',
              nameFi: 'Syvähieronta',
              description: 'Therapeutic massage focusing on deeper layers of muscle',
              descriptionEn: 'Therapeutic massage targeting the deeper layers of muscle and connective tissue.',
              descriptionFi: 'Terapeuttinen hieronta, joka kohdistuu lihaksen ja sidekudoksen syvempiin kerroksiin.',
              duration: 60,
              price: 85,
              currency: 'EUR',
              active: true
            },
            {
              id: 'service-3',
              name: 'Hot Stone Massage',
              nameEn: 'Hot Stone Massage',
              nameFi: 'Kuumakivihieronta',
              description: 'Massage using smooth heated stones',
              descriptionEn: 'Relaxing massage therapy using smooth, heated stones placed on specific parts of your body.',
              descriptionFi: 'Rentouttava hierontahoito käyttäen pehmeitä, lämmitettyjä kiviä, jotka asetetaan kehon eri osiin.',
              duration: 75,
              price: 95,
              currency: 'EUR',
              active: true
            }
          ]);
        }
      } catch (error) {
        console.error('Error fetching services:', error);
        setError(isEnglish 
          ? 'Failed to load services. Please try again later.' 
          : 'Palvelujen lataaminen epäonnistui. Yritä myöhemmin uudelleen.');
        
        // Set mock data in case of error
        setServices([
          {
            id: 'service-1',
            name: 'Classic Massage',
            nameEn: 'Classic Massage',
            nameFi: 'Klassinen hieronta',
            description: 'Relaxing full body massage',
            descriptionEn: 'Relaxing full body massage that helps to reduce tension and improve circulation.',
            descriptionFi: 'Rentouttava koko kehon hieronta, joka auttaa vähentämään jännitystä ja parantamaan verenkiertoa.',
            duration: 60,
            price: 75,
            currency: 'EUR',
            active: true
          },
          {
            id: 'service-2',
            name: 'Deep Tissue Massage',
            nameEn: 'Deep Tissue Massage',
            nameFi: 'Syvähieronta',
            description: 'Therapeutic massage focusing on deeper layers of muscle',
            descriptionEn: 'Therapeutic massage targeting the deeper layers of muscle and connective tissue.',
            descriptionFi: 'Terapeuttinen hieronta, joka kohdistuu lihaksen ja sidekudoksen syvempiin kerroksiin.',
            duration: 60,
            price: 85,
            currency: 'EUR',
            active: true
          },
          {
            id: 'service-3',
            name: 'Hot Stone Massage',
            nameEn: 'Hot Stone Massage',
            nameFi: 'Kuumakivihieronta',
            description: 'Massage using smooth heated stones',
            descriptionEn: 'Relaxing massage therapy using smooth, heated stones placed on specific parts of your body.',
            descriptionFi: 'Rentouttava hierontahoito käyttäen pehmeitä, lämmitettyjä kiviä, jotka asetetaan kehon eri osiin.',
            duration: 75,
            price: 95,
            currency: 'EUR',
            active: true
          }
        ]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchServices();
  }, [isEnglish]);

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto py-8 booking-component-wrapper" style={{opacity: 1, visibility: 'visible', display: 'block'}}>
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-neutral-400 border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
          <p className="mt-4 text-neutral-600">
            {isEnglish ? 'Loading services...' : 'Ladataan palveluita...'}
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-5xl mx-auto py-8 booking-component-wrapper" style={{opacity: 1, visibility: 'visible', display: 'block'}}>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <svg className="h-12 w-12 text-red-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="text-lg font-medium mb-2 text-red-800">
            {isEnglish ? 'Error Loading Services' : 'Virhe palveluiden lataamisessa'}
          </h3>
          <p className="text-red-600">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-4 py-2 bg-red-100 text-red-800 rounded-md hover:bg-red-200 transition-colors"
          >
            {isEnglish ? 'Try Again' : 'Yritä uudelleen'}
          </button>
        </div>
      </div>
    );
  }

  if (services.length === 0) {
    return (
      <div className="max-w-5xl mx-auto py-8 booking-component-wrapper" style={{opacity: 1, visibility: 'visible', display: 'block'}}>
        <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-6 text-center">
          <svg className="h-12 w-12 text-neutral-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
          <h3 className="text-lg font-medium mb-2">
            {isEnglish ? 'No Services Available' : 'Ei saatavilla olevia palveluita'}
          </h3>
          <p className="text-neutral-600">
            {isEnglish 
              ? 'There are currently no services available for booking.' 
              : 'Tällä hetkellä ei ole varattavissa olevia palveluita.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto py-8 booking-component-wrapper" style={{opacity: 1, visibility: 'visible', display: 'block'}} data-component="service-selection">
      <h2 className="text-2xl font-serif mb-6 text-center">
        {isEnglish ? 'Select a Service' : 'Valitse palvelu'}
      </h2>
      
      <div className="grid md:grid-cols-3 gap-6">
        {services.map((service) => (
          <div 
            key={service.id}
            className={`
              bg-white rounded-lg shadow-sm border p-6 cursor-pointer transition-all duration-200
              ${selectedServiceId === service.id 
                ? 'border-2 border-neutral-900 shadow-md transform scale-[1.02]' 
                : 'border-neutral-200 hover:border-neutral-300 hover:shadow'}
            `}
            onClick={() => onServiceSelect(service)}
          >
            <h3 className="text-xl font-medium mb-2">{getLocalizedField(service, 'name')}</h3>
            
            <div className="flex gap-3 text-sm mb-4">
              <span className="bg-neutral-100 px-3 py-1 rounded-full">
                {formatDuration(service.duration)}
              </span>
              <span className="bg-neutral-100 px-3 py-1 rounded-full">
                {service.price} {service.currency}
              </span>
            </div>
            
            <p className="text-neutral-600 mb-4 line-clamp-3">
              {getLocalizedField(service, 'description')}
            </p>
            
            <button 
              className={`
                w-full py-2 rounded-md transition-colors
                ${selectedServiceId === service.id
                  ? 'bg-neutral-900 text-white'
                  : 'bg-neutral-100 text-neutral-800 hover:bg-neutral-200'}
              `}
            >
              {selectedServiceId === service.id
                ? (isEnglish ? 'Selected' : 'Valittu')
                : (isEnglish ? 'Select' : 'Valitse')}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
} 