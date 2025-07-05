import React from 'react';
import { BarChart2, LineChart, PieChart, Calendar, Filter } from 'lucide-react';

const ChartCard = ({ title, icon, children }: { title: string, icon: React.ReactNode, children: React.ReactNode }) => (
  <div className="bg-card p-6 rounded-lg shadow-lg">
    <div className="flex items-center mb-4">
      <div className="bg-primary text-primary-foreground p-2 rounded-full">
        {icon}
      </div>
      <h2 className="text-xl font-bold text-primary ml-3">{title}</h2>
    </div>
    <div>
      {children}
    </div>
  </div>
);

const Analytics: React.FC = () => {
  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h1 className="text-3xl font-bold text-primary">Analytics</h1>
        <div className="flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-4 w-full md:w-auto">
          <div className="relative w-full">
            <Calendar size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary-foreground" />
            <input 
              type="text"
              placeholder="Date Range"
              className="pl-10 pr-4 py-2 border border-border bg-input text-primary rounded-lg focus:outline-none focus:ring-2 focus:ring-ring w-full"
            />
          </div>
          <button className="flex items-center px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-accent focus:outline-none w-full md:w-auto">
            <Filter size={20} className="mr-2" />
            Filter
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Sales Trends" icon={<LineChart size={24} />}>
          <div className="h-80 bg-secondary rounded-md flex items-center justify-center">
            <p className="text-secondary-foreground">Line chart placeholder</p>
          </div>
        </ChartCard>
        
        <ChartCard title="Inventory by Category" icon={<PieChart size={24} />}>
          <div className="h-80 bg-secondary rounded-md flex items-center justify-center">
            <p className="text-secondary-foreground">Pie chart placeholder</p>
          </div>
        </ChartCard>

        <ChartCard title="Orders by Status" icon={<BarChart2 size={24} />}>
          <div className="h-80 bg-secondary rounded-md flex items-center justify-center">
            <p className="text-secondary-foreground">Bar chart placeholder</p>
          </div>
        </ChartCard>

        <ChartCard title="Supplier Performance" icon={<BarChart2 size={24} />}>
          <div className="h-80 bg-secondary rounded-md flex items-center justify-center">
            <p className="text-secondary-foreground">Bar chart placeholder</p>
          </div>
        </ChartCard>
      </div>
    </div>
  );
};

export default Analytics;
