'use client';

import Link from 'next/link';
import { useState } from 'react';

export default function TestBookingEmailPage() {
  const [emailConfig, setEmailConfig] = useState({
    email: '',
    adminEmail: '',
  });
  const [configStatus, setConfigStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEmailConfig((prev) => ({ ...prev, [name]: value }));
  };

  const saveConfig = async () => {
    try {
      setMessage('');
      if (!emailConfig.email || !emailConfig.adminEmail) {
        setMessage('Please fill in all fields');
        return;
      }

      // Test API endpoint that sets session variables for email testing
      const response = await fetch('/api/test-email-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(emailConfig),
      });

      const data = await response.json();

      if (response.ok) {
        setConfigStatus('success');
        setMessage('Email configuration saved for this session. You can now test the booking system.');
      } else {
        setConfigStatus('error');
        setMessage(`Error: ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      setConfigStatus('error');
      setMessage(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  return (
    <div className="container mx-auto py-10 px-4">
      <h1 className="text-3xl font-bold mb-8">Test Booking System with Real Email</h1>
      
      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-8">
        <p className="text-yellow-700">
          <strong>Important:</strong> This page is for testing purposes only. It allows you to test the booking system
          with real email addresses without modifying your .env files.
        </p>
      </div>

      <div className="max-w-2xl mx-auto bg-white p-6 rounded-lg shadow-md mb-8">
        <h2 className="text-xl font-semibold mb-4">Step 1: Configure Test Emails</h2>
        <div className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Your Email (for customer confirmation)
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={emailConfig.email}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="your.email@example.com"
            />
          </div>
          
          <div>
            <label htmlFor="adminEmail" className="block text-sm font-medium text-gray-700 mb-1">
              Admin Email (for admin notifications)
            </label>
            <input
              type="email"
              id="adminEmail"
              name="adminEmail"
              value={emailConfig.adminEmail}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="admin@example.com"
            />
            <p className="text-sm text-gray-500 mt-1">
              This can be the same as your email if you want to receive both types of notifications.
            </p>
          </div>

          <button
            onClick={saveConfig}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Save Configuration
          </button>

          {message && (
            <div
              className={`p-3 rounded ${
                configStatus === 'success'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
              }`}
            >
              {message}
            </div>
          )}
        </div>
      </div>

      {configStatus === 'success' && (
        <div className="max-w-2xl mx-auto bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Step 2: Test the Booking System</h2>
          
          <div className="mb-6 space-y-4">
            <p>
              You're all set! Now you can make a test booking using the normal booking flow.
              The confirmation emails will be sent as follows:
            </p>
            <ul className="list-disc ml-6 space-y-2">
              <li>
                <strong>Customer confirmation:</strong> Will be sent to {emailConfig.email}
              </li>
              <li>
                <strong>Admin notification:</strong> Will be sent to {emailConfig.adminEmail}
              </li>
            </ul>
            
            <div className="bg-blue-50 p-4 rounded">
              <h3 className="font-medium text-blue-800 mb-2">Test Instructions</h3>
              <ol className="list-decimal ml-6 space-y-1 text-blue-900">
                <li>Click the "Go to Booking Page" button below</li>
                <li>Complete the booking process by selecting a service, date, time</li>
                <li>Fill in the customer form with your information</li>
                <li>Submit the booking</li>
                <li>Check your email for both customer confirmation and admin notification</li>
              </ol>
            </div>
          </div>
          
          <Link
            href="/fi/ajanvaraus"
            className="inline-block px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            Go to Booking Page
          </Link>
        </div>
      )}
    </div>
  );
} 