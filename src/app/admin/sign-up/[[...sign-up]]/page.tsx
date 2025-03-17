'use client';

import { SignUp } from '@clerk/nextjs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function SignUpPage() {
  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Admin Sign Up</CardTitle>
          <CardDescription className="text-center">
            Create an admin account (restricted access)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SignUp 
            appearance={{
              elements: {
                formButtonPrimary: 'bg-primary hover:bg-primary/90 text-primary-foreground',
                card: 'bg-transparent shadow-none',
                headerTitle: 'hidden',
                headerSubtitle: 'hidden',
                socialButtonsBlockButton: 'bg-white border border-gray-300 hover:bg-gray-50'
              }
            }}
            routing="path"
            path="/admin/sign-up"
            redirectUrl="/admin/dashboard"
          />
          
          <div className="mt-6 text-center">
            <Link href="/">
              <Button variant="outline" className="w-full flex items-center justify-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Home
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 