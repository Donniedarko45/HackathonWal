import React, { useEffect, useState } from 'react';
import { MapPin, Search, Filter, Loader } from 'lucide-react';
import { deliveryApi } from '../services/api';

const getStatusChip = (status: string) => {
  switch (status) {
    case 'DELIVERED':
      return <span className="px-2 py-1 text-xs font-semibold text-green-800 bg-green-200 rounded-full">{status}</span>;
    case 'IN_TRANSIT':
      return <span className="px-2 py-1 text-xs font-semibold text-blue-800 bg-blue-200 rounded-full">IN TRANSIT</span>;
    case 'PENDING':
      return <span className="px-2 py-1 text-xs font-semibold text-yellow-800 bg-yellow-200 rounded-full">{status}</span>;
    default:
      return <span className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-200 rounded-full">{status}</span>;
  }
};

const Deliveries: React.FC = () => {
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDeliveries = async () => {
      try {
        const response = await deliveryApi.getAll();
        setDeliveries(response.data);
      } catch (err) {
        setError('Failed to fetch deliveries data.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchDeliveries();
  }, []);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Deliveries</h1>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-lg">
        <div className="flex justify-between items-center mb-4">
          <div className="relative">
            <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text"
              placeholder="Search deliveries..."
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <button className="flex items-center px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 focus:outline-none">
            <Filter size={20} className="mr-2" />
            Filter
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader size={48} className="animate-spin text-indigo-600" />
          </div>
        ) : error ? (
          <div className="flex justify-center items-center h-64">
            <p className="text-red-500">{error}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white">
              <thead className="bg-gray-50">
                <tr>
                  <th className="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Delivery ID</th>
                  <th className="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                  <th className="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Driver</th>
                  <th className="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Est. Delivery</th>
                  <th className="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {deliveries.map((delivery) => (
                  <tr key={delivery.id} className="hover:bg-gray-50">
                    <td className="py-4 px-6 text-sm font-medium text-gray-900">{delivery.id}</td>
                    <td className="py-4 px-6 text-sm text-gray-700">{delivery.orderId}</td>
                    <td className="py-4 px-6 text-sm text-gray-700">{delivery.driver?.name || 'N/A'}</td>
                    <td className="py-4 px-6 text-sm">{getStatusChip(delivery.status)}</td>
                    <td className="py-4 px-6 text-sm text-gray-700">{new Date(delivery.scheduledDate).toLocaleDateString()}</td>
                    <td className="py-4 px-6 text-sm">
                      <button className="text-indigo-600 hover:text-indigo-900">
                        <MapPin size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Deliveries;
