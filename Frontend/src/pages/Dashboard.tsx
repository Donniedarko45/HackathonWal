import React, { useEffect, useState } from 'react';
import { ShoppingCart, Package, Truck, Users, Loader } from 'lucide-react';
import { analyticsApi } from '../services/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const StatCard = ({ icon, title, value, change, changeType }: { icon: React.ReactNode, title: string, value: string, change?: string, changeType?: 'increase' | 'decrease' }) => (
  <div className="bg-card p-6 rounded-lg shadow-lg">
    <div className="flex items-center">
      <div className="bg-primary text-primary-foreground p-3 rounded-full">
        {icon}
      </div>
      <div className="ml-4">
        <p className="text-sm font-medium text-secondary-foreground">{title}</p>
        <p className="text-2xl font-bold text-primary">{value}</p>
      </div>
    </div>
    {change && changeType && (
      <div className="mt-4 flex items-center">
        <span className={`text-sm font-medium ${changeType === 'increase' ? 'text-green-500' : 'text-red-500'}`}>
          {change}
        </span>
        <span className="text-sm text-secondary-foreground ml-2">from last month</span>
      </div>
    )}
  </div>
);

const Dashboard: React.FC = () => {
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await analyticsApi.getDashboard();
        setDashboardData(response.data);
      } catch (err) {
        setError('Failed to fetch dashboard data.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <Loader size={48} className="animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-full">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  const stats = [
    { icon: <ShoppingCart size={24} />, title: 'Total Orders', value: dashboardData.totalOrders },
    { icon: <Package size={24} />, title: 'Total Inventory', value: dashboardData.totalInventory },
    { icon: <Truck size={24} />, title: 'Pending Deliveries', value: dashboardData.pendingDeliveries },
    { icon: <Users size={24} />, title: 'Active Suppliers', value: dashboardData.activeSuppliers },
  ];

  return (
    <div>
      <h1 className="text-3xl font-bold text-primary mb-6">Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <StatCard key={index} {...stat} />
        ))}
      </div>

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-card p-6 rounded-lg shadow-lg">
          <h2 className="text-xl font-bold text-primary mb-4">Recent Sales</h2>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={dashboardData?.recentSales || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
              <XAxis dataKey="date" tick={{ fill: '#a0aec0' }} />
              <YAxis tick={{ fill: '#a0aec0' }} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1F1E1D', 
                  borderColor: '#3a3a38' 
                }} 
                labelStyle={{ color: '#FFFFFF' }}
              />
              <Legend wrapperStyle={{ color: '#FFFFFF' }} />
              <Bar dataKey="amount" fill="#FFFFFF" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-card p-6 rounded-lg shadow-lg">
          <h2 className="text-xl font-bold text-primary mb-4">Recent Activity</h2>
          <ul className="space-y-4">
            {(dashboardData?.recentActivity || []).map((activity: any, index: number) => (
              <li key={index} className="flex items-center">
                <div className="bg-green-900 text-green-300 p-2 rounded-full">
                  <ShoppingCart size={18} />
                </div>
                <p className="ml-4 text-sm text-secondary-foreground">{activity.message}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
