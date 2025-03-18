import React from 'react';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Service Management | Admin',
  description: 'Manage services for Hoitohuone Zenni',
};

export default function ServicesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
