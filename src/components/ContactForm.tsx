import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { motion, AnimatePresence } from 'framer-motion';

export type ContactFormData = {
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
};

type ContactFormProps = {
  onSubmit: (data: ContactFormData) => Promise<void>;
  translations: {
    name: string;
    email: string;
    phone: string;
    subject: string;
    message: string;
    submit: string;
    required: string;
    validEmail: string;
    success: string;
    error: string;
    phoneOptional: string;
  };
};

export default function ContactForm({ onSubmit, translations }: ContactFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'success' | 'error' | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ContactFormData>();

  const handleFormSubmit = async (data: ContactFormData) => {
    setIsSubmitting(true);
    setSubmitStatus(null);

    try {
      await onSubmit(data);
      setSubmitStatus('success');
      reset();
    } catch (error) {
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.form
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      onSubmit={handleSubmit(handleFormSubmit)}
      className="space-y-6"
    >
      <div>
        <label
          htmlFor="name"
          className="block text-sm font-medium text-neutral-900 mb-1"
        >
          {translations.name}
        </label>
        <input
          type="text"
          id="name"
          disabled={isSubmitting}
          {...register('name', { required: true })}
          className={`w-full px-4 py-2 rounded-md border ${
            errors.name
              ? 'border-red-500 focus:ring-red-500'
              : 'border-neutral-200 focus:ring-neutral-500'
          } focus:outline-none focus:ring-2 disabled:bg-neutral-50 disabled:text-neutral-500 transition-colors`}
          aria-invalid={errors.name ? 'true' : 'false'}
        />
        {errors.name && (
          <p className="mt-1 text-sm text-red-500" role="alert">
            {translations.required}
          </p>
        )}
      </div>

      <div>
        <label
          htmlFor="email"
          className="block text-sm font-medium text-neutral-900 mb-1"
        >
          {translations.email}
        </label>
        <input
          type="email"
          id="email"
          disabled={isSubmitting}
          {...register('email', {
            required: true,
            pattern: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
          })}
          className={`w-full px-4 py-2 rounded-md border ${
            errors.email
              ? 'border-red-500 focus:ring-red-500'
              : 'border-neutral-200 focus:ring-neutral-500'
          } focus:outline-none focus:ring-2 disabled:bg-neutral-50 disabled:text-neutral-500 transition-colors`}
          aria-invalid={errors.email ? 'true' : 'false'}
        />
        {errors.email && (
          <p className="mt-1 text-sm text-red-500" role="alert">
            {translations.validEmail}
          </p>
        )}
      </div>

      <div>
        <label
          htmlFor="phone"
          className="block text-sm font-medium text-neutral-900 mb-1"
        >
          {translations.phoneOptional}
        </label>
        <input
          type="tel"
          id="phone"
          disabled={isSubmitting}
          {...register('phone')}
          className="w-full px-4 py-2 rounded-md border border-neutral-200 focus:ring-neutral-500 focus:outline-none focus:ring-2 disabled:bg-neutral-50 disabled:text-neutral-500 transition-colors"
        />
      </div>

      <div>
        <label
          htmlFor="subject"
          className="block text-sm font-medium text-neutral-900 mb-1"
        >
          {translations.subject}
        </label>
        <input
          type="text"
          id="subject"
          disabled={isSubmitting}
          {...register('subject', { required: true })}
          className={`w-full px-4 py-2 rounded-md border ${
            errors.subject
              ? 'border-red-500 focus:ring-red-500'
              : 'border-neutral-200 focus:ring-neutral-500'
          } focus:outline-none focus:ring-2 disabled:bg-neutral-50 disabled:text-neutral-500 transition-colors`}
          aria-invalid={errors.subject ? 'true' : 'false'}
        />
        {errors.subject && (
          <p className="mt-1 text-sm text-red-500" role="alert">
            {translations.required}
          </p>
        )}
      </div>

      <div>
        <label
          htmlFor="message"
          className="block text-sm font-medium text-neutral-900 mb-1"
        >
          {translations.message}
        </label>
        <textarea
          id="message"
          rows={5}
          disabled={isSubmitting}
          {...register('message', { required: true })}
          className={`w-full px-4 py-2 rounded-md border ${
            errors.message
              ? 'border-red-500 focus:ring-red-500'
              : 'border-neutral-200 focus:ring-neutral-500'
          } focus:outline-none focus:ring-2 disabled:bg-neutral-50 disabled:text-neutral-500 transition-colors`}
          aria-invalid={errors.message ? 'true' : 'false'}
        />
        {errors.message && (
          <p className="mt-1 text-sm text-red-500" role="alert">
            {translations.required}
          </p>
        )}
      </div>

      <AnimatePresence>
        {submitStatus && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className={`p-4 rounded-md ${
              submitStatus === 'success'
                ? 'bg-green-50 text-green-800'
                : 'bg-red-50 text-red-800'
            }`}
            role="alert"
          >
            {submitStatus === 'success' ? translations.success : translations.error}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        type="submit"
        disabled={isSubmitting}
        className="w-full px-6 py-3 bg-neutral-900 text-white rounded-md hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-neutral-500 disabled:bg-neutral-400 disabled:cursor-not-allowed transition-colors"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
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
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            {translations.submit}
          </span>
        ) : (
          translations.submit
        )}
      </motion.button>
    </motion.form>
  );
} 