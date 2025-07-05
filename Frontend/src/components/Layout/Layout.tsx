import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
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

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { logout } = useAuthStore();
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const toggleSidebar = () => {
    setSidebarOpen(!isSidebarOpen);
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-sidebar text-primary">
      <div className="p-4 border-b border-border flex justify-between items-center">
        <h1 className="text-2xl font-semibold">SCM</h1>
        <button onClick={toggleSidebar} className="md:hidden text-secondary-foreground hover:text-primary">
          <X size={24} />
        </button>
      </div>
      <nav className="mt-4 flex-1">
        <ul>
          <li>
            <NavLink to="/dashboard" className={({ isActive }) => `flex items-center px-4 py-2 text-secondary-foreground hover:text-primary hover:bg-accent ${isActive ? 'bg-accent text-primary' : ''}`}>
              <LayoutDashboard className="mr-3" /> Dashboard
            </NavLink>
          </li>
          <li>
            <NavLink to="/inventory" className={({ isActive }) => `flex items-center px-4 py-2 text-secondary-foreground hover:text-primary hover:bg-accent ${isActive ? 'bg-accent text-primary' : ''}`}>
              <Package className="mr-3" /> Inventory
            </NavLink>
          </li>
          <li>
            <NavLink to="/orders" className={({ isActive }) => `flex items-center px-4 py-2 text-secondary-foreground hover:text-primary hover:bg-accent ${isActive ? 'bg-accent text-primary' : ''}`}>
              <ShoppingCart className="mr-3" /> Orders
            </NavLink>
          </li>
          <li>
            <NavLink to="/deliveries" className={({ isActive }) => `flex items-center px-4 py-2 text-secondary-foreground hover:text-primary hover:bg-accent ${isActive ? 'bg-accent text-primary' : ''}`}>
              <Truck className="mr-3" /> Deliveries
            </NavLink>
          </li>
          <li>
            <NavLink to="/suppliers" className={({ isActive }) => `flex items-center px-4 py-2 text-secondary-foreground hover:text-primary hover:bg-accent ${isActive ? 'bg-accent text-primary' : ''}`}>
              <Users className="mr-3" /> Suppliers
            </NavLink>
          </li>
          <li>
            <NavLink to="/locations" className={({ isActive }) => `flex items-center px-4 py-2 text-secondary-foreground hover:text-primary hover:bg-accent ${isActive ? 'bg-accent text-primary' : ''}`}>
              <MapPin className="mr-3" /> Locations
            </NavLink>
          </li>
          <li>
            <NavLink to="/analytics" className={({ isActive }) => `flex items-center px-4 py-2 text-secondary-foreground hover:text-primary hover:bg-accent ${isActive ? 'bg-accent text-primary' : ''}`}>
              <BarChart3 className="mr-3" /> Analytics
            </NavLink>
          </li>
        </ul>
      </nav>
    </div>
  );

  return (
    <div className="flex h-screen bg-background text-primary">
      {/* Static Sidebar for Desktop */}
      <aside className="w-64 hidden md:block border-r border-border">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar */}
      <div className={`fixed inset-0 z-30 transition-transform transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:hidden`}>
        <div className="w-64 h-full shadow-lg bg-sidebar">
          <SidebarContent />
        </div>
        <div onClick={toggleSidebar} className="fixed inset-0 bg-background/50"></div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="flex justify-between items-center p-4 border-b border-border">
          <button onClick={toggleSidebar} className="md:hidden text-secondary-foreground hover:text-primary">
            <Menu size={24} />
          </button>
          <h2 className="text-xl font-semibold hidden md:block">Dashboard</h2>
          <div className="flex items-center gap-4">
            <span className="text-sm text-secondary-foreground hidden sm:block">Welcome, Admin!</span>
            <button
              onClick={handleLogout}
              className="flex items-center px-3 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-opacity-50"
            >
              <LogOut size={18} className="sm:mr-2" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
