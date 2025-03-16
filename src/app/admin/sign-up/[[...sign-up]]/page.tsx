'use client';

import { SignUp } from '@clerk/nextjs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

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
        </CardContent>
      </Card>
    </div>
  );
} 