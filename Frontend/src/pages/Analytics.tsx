import React from 'react';
import { BarChart2, LineChart, PieChart, Calendar, Filter } from 'lucide-react';

const ChartCard = ({ title, icon, children }: { title: string, icon: React.ReactNode, children: React.ReactNode }) => (
  <div className="bg-white p-6 rounded-lg shadow-lg">
    <div className="flex items-center mb-4">
      <div className="bg-indigo-500 text-white p-2 rounded-full">
        {icon}
      </div>
      <h2 className="text-xl font-bold text-gray-800 ml-3">{title}</h2>
    </div>
    <div>
      {children}
    </div>
  </div>
);

const Analytics: React.FC = () => {
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Analytics</h1>
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Calendar size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text"
              placeholder="Date Range"
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <button className="flex items-center px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 focus:outline-none">
            <Filter size={20} className="mr-2" />
            Filter
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Sales Trends" icon={<LineChart size={24} />}>
          <div className="h-80 bg-gray-100 rounded-md flex items-center justify-center">
            <p className="text-gray-500">Line chart placeholder</p>
          </div>
        </ChartCard>
        
        <ChartCard title="Inventory by Category" icon={<PieChart size={24} />}>
          <div className="h-80 bg-gray-100 rounded-md flex items-center justify-center">
            <p className="text-gray-500">Pie chart placeholder</p>
          </div>
        </ChartCard>

        <ChartCard title="Orders by Status" icon={<BarChart2 size={24} />}>
          <div className="h-80 bg-gray-100 rounded-md flex items-center justify-center">
            <p className="text-gray-500">Bar chart placeholder</p>
          </div>
        </ChartCard>

        <ChartCard title="Supplier Performance" icon={<BarChart2 size={24} />}>
          <div className="h-80 bg-gray-100 rounded-md flex items-center justify-center">
            <p className="text-gray-500">Bar chart placeholder</p>
          </div>
        </ChartCard>
      </div>
    </div>
  );
};

export default Analytics;
