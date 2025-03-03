'use client';

import { useState } from 'react';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In prototyping mode, just log the form data
    console.log('Form submitted:', formData);
    // Reset form
    setFormData({
      name: '',
      email: '',
      phone: '',
      message: '',
    });
    alert('Kiitos viestistäsi! Otamme sinuun yhteyttä pian.');
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl font-serif mb-8 text-center">Yhteystiedot</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-12">
          {/* Contact Information */}
          <div>
            <h2 className="text-2xl font-serif mb-4">Ota yhteyttä</h2>
            <div className="space-y-4">
              <p className="flex items-center text-neutral-600">
                <svg
                  className="h-5 w-5 mr-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                Osoite tulossa pian
              </p>
              <p className="flex items-center text-neutral-600">
                <svg
                  className="h-5 w-5 mr-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                  />
                </svg>
                Puhelin tulossa pian
              </p>
              <p className="flex items-center text-neutral-600">
                <svg
                  className="h-5 w-5 mr-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
                info@hoitohuonezenni.fi
              </p>
            </div>

            <div className="mt-8">
              <h3 className="text-lg font-medium mb-2">Aukioloajat</h3>
              <ul className="space-y-2 text-neutral-600">
                <li>Maanantai - Perjantai: 10:00 - 18:00</li>
                <li>Lauantai: Sopimuksen mukaan</li>
                <li>Sunnuntai: Suljettu</li>
              </ul>
            </div>
          </div>

          {/* Contact Form */}
          <div>
            <h2 className="text-2xl font-serif mb-4">Lähetä viesti</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-neutral-700"
                >
                  Nimi
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full rounded-md border-neutral-300 shadow-sm focus:border-neutral-500 focus:ring-neutral-500"
                />
              </div>
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-neutral-700"
                >
                  Sähköposti
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full rounded-md border-neutral-300 shadow-sm focus:border-neutral-500 focus:ring-neutral-500"
                />
              </div>
              <div>
                <label
                  htmlFor="phone"
                  className="block text-sm font-medium text-neutral-700"
                >
                  Puhelin
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-neutral-300 shadow-sm focus:border-neutral-500 focus:ring-neutral-500"
                />
              </div>
              <div>
                <label
                  htmlFor="message"
                  className="block text-sm font-medium text-neutral-700"
                >
                  Viesti
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  rows={4}
                  className="mt-1 block w-full rounded-md border-neutral-300 shadow-sm focus:border-neutral-500 focus:ring-neutral-500"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-neutral-900 text-white px-6 py-3 rounded-md hover:bg-neutral-800 transition-colors"
              >
                Lähetä viesti
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
} 