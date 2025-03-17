'use client';

import { useState, useEffect, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import styles from './booking.module.css';

interface CustomerFormProps {
  onSubmit: (data: {
    name: string;
    email: string;
    phone?: string;
    notes?: string;
    privacyPolicy: boolean;
  }) => void;
  isSubmitting?: boolean;
}

export default function CustomerForm({ onSubmit, isSubmitting = false }: CustomerFormProps) {
  const pathname = usePathname();
  const isEnglish = pathname?.startsWith('/en') || false;
  
  // Form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [privacyPolicy, setPrivacyPolicy] = useState(false);
  
  // Validation state
  const [errors, setErrors] = useState<{
    name?: string;
    email?: string;
    privacyPolicy?: string;
  }>({});
  
  // Translation helper function
  const t = useCallback((en: string, fi: string): string => isEnglish ? en : fi, [isEnglish]);
  
  // Validate form
  const validateForm = useCallback(() => {
    const newErrors: {
      name?: string;
      email?: string;
      privacyPolicy?: string;
    } = {};
    
    // Validate name
    if (!name.trim()) {
      newErrors.name = t('Name is required', 'Nimi on pakollinen');
    }
    
    // Validate email
    if (!email.trim()) {
      newErrors.email = t('Email is required', 'Sähköposti on pakollinen');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = t('Please enter a valid email', 'Syötä kelvollinen sähköpostiosoite');
    }
    
    // Validate privacy policy
    if (!privacyPolicy) {
      newErrors.privacyPolicy = t(
        'You must accept the privacy policy',
        'Sinun on hyväksyttävä tietosuojakäytäntö'
      );
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [name, email, privacyPolicy, t]);
  
  // Handle form submission
  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSubmit({
        name,
        email,
        phone: phone || undefined,
        notes: notes || undefined,
        privacyPolicy
      });
    }
  }, [name, email, phone, notes, privacyPolicy, validateForm, onSubmit]);
  
  useEffect(() => {
    // Fix fade-in animations
    const fadeElements = document.querySelectorAll('.fade-in');
    fadeElements.forEach(el => {
      el.classList.add('animate-fade-in');
    });
  }, []);
  
  return (
    <div className={`max-w-2xl mx-auto py-8 fade-in animate-fade-in ${styles.bookingComponent}`}>
      <h2 className="text-2xl font-serif mb-4 text-center">
        {t('Your Information', 'Yhteystietosi')}
      </h2>
      
      <p className="text-center text-neutral-600 mb-8">
        {t(
          'Please provide your contact details to complete your booking.',
          'Anna yhteystietosi varauksen viimeistelemiseksi.'
        )}
      </p>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Name Field */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-neutral-700 mb-1">
            {t('Full Name', 'Koko nimi')} <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={`
              w-full px-4 py-3 rounded-md border
              ${errors.name ? 'border-red-300 bg-red-50' : 'border-neutral-300'}
              focus:outline-none focus:ring-2 focus:ring-neutral-400
            `}
            placeholder={t('Enter your full name', 'Syötä koko nimesi')}
            disabled={isSubmitting}
          />
          {errors.name && (
            <p className="mt-1 text-sm text-red-600">{errors.name}</p>
          )}
        </div>
        
        {/* Email Field */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-neutral-700 mb-1">
            {t('Email Address', 'Sähköpostiosoite')} <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={`
              w-full px-4 py-3 rounded-md border
              ${errors.email ? 'border-red-300 bg-red-50' : 'border-neutral-300'}
              focus:outline-none focus:ring-2 focus:ring-neutral-400
            `}
            placeholder={t('Enter your email address', 'Syötä sähköpostiosoitteesi')}
            disabled={isSubmitting}
          />
          {errors.email && (
            <p className="mt-1 text-sm text-red-600">{errors.email}</p>
          )}
        </div>
        
        {/* Phone Field (Optional) */}
        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-neutral-700 mb-1">
            {t('Phone Number (Optional)', 'Puhelinnumero (valinnainen)')}
          </label>
          <input
            type="tel"
            id="phone"
            name="phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="
              w-full px-4 py-3 rounded-md border border-neutral-300
              focus:outline-none focus:ring-2 focus:ring-neutral-400
            "
            placeholder={t('Enter your phone number', 'Syötä puhelinnumerosi')}
            disabled={isSubmitting}
          />
        </div>
        
        {/* Notes Field (Optional) */}
        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-neutral-700 mb-1">
            {t('Additional Notes (Optional)', 'Lisätiedot (valinnainen)')}
          </label>
          <textarea
            id="notes"
            name="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="
              w-full px-4 py-3 rounded-md border border-neutral-300
              focus:outline-none focus:ring-2 focus:ring-neutral-400
            "
            placeholder={t(
              'Any special requests or information you want to provide',
              'Erityistoiveita tai tietoja, jotka haluat kertoa'
            )}
            disabled={isSubmitting}
          />
        </div>
        
        {/* Privacy Policy Checkbox */}
        <div>
          <div className="flex items-start">
            <div className="flex items-center h-5">
              <input
                id="privacy"
                name="privacy"
                type="checkbox"
                checked={privacyPolicy}
                onChange={(e) => setPrivacyPolicy(e.target.checked)}
                className="
                  w-4 h-4 text-neutral-900 border-neutral-300 rounded
                  focus:ring-neutral-400
                "
                disabled={isSubmitting}
              />
            </div>
            <div className="ml-3 text-sm">
              <label htmlFor="privacy" className="font-medium text-neutral-700">
                {t(
                  'I accept the privacy policy',
                  'Hyväksyn tietosuojakäytännön'
                )} <span className="text-red-500">*</span>
              </label>
              <p className="text-neutral-500">
                {t(
                  'Your personal information will be processed according to our privacy policy.',
                  'Henkilötietojasi käsitellään tietosuojakäytäntömme mukaisesti.'
                )}
              </p>
              {errors.privacyPolicy && (
                <p className="mt-1 text-sm text-red-600">{errors.privacyPolicy}</p>
              )}
            </div>
          </div>
        </div>
        
        {/* Submit Button */}
        <div className="pt-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className="
              w-full bg-neutral-900 text-white font-medium py-3 px-6 rounded-md
              transition-colors duration-200 hover:bg-neutral-800
              disabled:bg-neutral-400 disabled:cursor-not-allowed
            "
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center">
                <svg 
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" 
                  xmlns="http://www.w3.org/2000/svg" 
                  fill="none" 
                  viewBox="0 0 24 24"
                >
                  <circle 
                    className="opacity-25" 
                    cx="12" 
                    cy="12" 
                    r="10" 
                    stroke="currentColor" 
                    strokeWidth="4"
                  />
                  <path 
                    className="opacity-75" 
                    fill="currentColor" 
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                {t('Processing...', 'Käsitellään...')}
              </span>
            ) : (
              t('Confirm Booking', 'Vahvista varaus')
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
