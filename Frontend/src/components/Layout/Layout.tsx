import React from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  Truck, 
  Users, 
  MapPin, 
  BarChart3, 
  LogOut,
  Menu,
  X
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useState, useCallback } from 'react';

interface LayoutProps {
  children: React.ReactNode;
}



const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { logout } = useAuthStore();
  console.log('Layout rendered');

  const handleLogout = async () => {
    try {
      await logout();
      // Redirect to login page handled by ProtectedRoute/PublicRoute
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-md">
        <div className="p-4 border-b">
          <h1 className="text-2xl font-semibold text-gray-800">SCM Dashboard</h1>
        </div>
        <nav className="mt-4">
          <ul>
            <li>
              <Link to="/dashboard" className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-200">
                <LayoutDashboard className="mr-3" /> Dashboard
              </Link>
            </li>
            <li>
              <Link to="/inventory" className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-200">
                <Package className="mr-3" /> Inventory
              </Link>
            </li>
            <li>
              <Link to="/orders" className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-200">
                <ShoppingCart className="mr-3" /> Orders
              </Link>
            </li>
            <li>
              <Link to="/deliveries" className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-200">
                <Truck className="mr-3" /> Deliveries
              </Link>
            </li>
            <li>
              <Link to="/suppliers" className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-200">
                <Users className="mr-3" /> Suppliers
              </Link>
            </li>
            <li>
              <Link to="/locations" className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-200">
                <MapPin className="mr-3" /> Locations
              </Link>
            </li>
            <li>
              <Link to="/analytics" className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-200">
                <BarChart3 className="mr-3" /> Analytics
              </Link>
            </li>
          </ul>
        </nav>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="flex justify-between items-center p-4 bg-white shadow-md">
          <h2 className="text-xl font-semibold text-gray-800">Dashboard</h2>
          <div className="flex items-center">
            <span className="mr-4 text-gray-700">Welcome, Admin!</span>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50"
            >
              Logout
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-4">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
