import React from 'react';
import { Truck } from 'lucide-react';

interface AuthLayoutProps {
  children: React.ReactNode;
}

const AuthLayout: React.FC<AuthLayoutProps> = ({ children }) => {
  console.log('AuthLayout rendered');
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Logo */}
        <div className="flex justify-center">
          <div className="flex items-center">
            <Truck className="h-12 w-12 text-primary-600" />
            <span className="ml-2 text-2xl font-bold text-gray-900">SupplyChain</span>
          </div>
        </div>
        
        {/* Subtitle */}
        <h2 className="mt-6 text-center text-xl text-gray-600">
          Modern Supply Chain Management System
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {children}
        </div>
        
        {/* Footer text */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            Built for hackathons and real-world supply chain optimization
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
