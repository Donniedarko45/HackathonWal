import React from 'react';
import { Truck } from 'lucide-react';

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: React.ReactNode;
}

const AuthLayout: React.FC<AuthLayoutProps> = ({ children, title, subtitle }) => {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="flex flex-col md:flex-row w-full max-w-4xl mx-auto shadow-lg rounded-lg overflow-hidden">
        {/* Left Side - Visual */}
        <div className="hidden md:flex flex-col justify-center items-center w-1/2 bg-sidebar p-12 text-center">
            <Truck className="h-16 w-auto text-primary" />
            <h1 className="mt-4 text-3xl font-bold text-primary">SupplyChain</h1>
            <p className="mt-2 text-secondary-foreground">Streamlining Your Supply Chain Operations.</p>
        </div>

        {/* Right Side - Form */}
        <div className="w-full md:w-1/2 bg-card p-8 sm:p-12">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <h2 className="text-center text-2xl font-bold text-primary">
                {title}
                </h2>
                {subtitle && (
                <p className="mt-2 text-center text-sm text-secondary-foreground">
                    {subtitle}
                </p>
                )}
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                {children}
            </div>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
