import React, { useEffect, useState, useCallback } from 'react';
import { PlusCircle, Eye, Search, Filter, Loader } from 'lucide-react';
import { ordersApi } from '../services/api';
import Pagination from '../components/common/Pagination';

const getStatusChip = (status: string) => {
  switch (status) {
    case 'DELIVERED':
      return <span className="px-2 py-1 text-xs font-semibold text-green-300 bg-green-900 rounded-full">{status}</span>;
    case 'SHIPPED':
      return <span className="px-2 py-1 text-xs font-semibold text-blue-300 bg-blue-900 rounded-full">{status}</span>;
    case 'PROCESSING':
      return <span className="px-2 py-1 text-xs font-semibold text-yellow-300 bg-yellow-900 rounded-full">{status}</span>;
    case 'CANCELLED':
        return <span className="px-2 py-1 text-xs font-semibold text-red-300 bg-red-900 rounded-full">{status}</span>;
    default:
      return <span className="px-2 py-1 text-xs font-semibold text-secondary-foreground bg-secondary rounded-full">{status}</span>;
  }
};

const Orders: React.FC = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchOrders = useCallback(async (page: number) => {
    setLoading(true);
    try {
      const response = await ordersApi.getAll({ page, limit: 10 });
      if (response.data && Array.isArray(response.data.orders)) {
        setOrders(response.data.orders);
        setTotalPages(response.data.pagination.pages);
        setCurrentPage(response.data.pagination.page);
      } else {
        setError('Failed to fetch orders: Invalid data format.');
        console.error('API response.data.orders is not an array:', response.data);
        setOrders([]);
      }
    } catch (err) {
      setError('Failed to fetch orders data.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders(currentPage);
  }, [fetchOrders, currentPage]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h1 className="text-3xl font-bold text-primary">Orders</h1>
        <button className="flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-lg shadow-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring w-full md:w-auto">
          <PlusCircle size={20} className="mr-2" />
          Create Order
        </button>
      </div>

      <div className="bg-card p-4 md:p-6 rounded-lg shadow-lg">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">
          <div className="relative w-full md:w-auto">
            <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary-foreground" />
            <input 
              type="text"
              placeholder="Search orders..."
              className="pl-10 pr-4 py-2 border border-border bg-input text-primary rounded-lg focus:outline-none focus:ring-2 focus:ring-ring w-full"
            />
          </div>
          <button className="flex items-center px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-accent focus:outline-none w-full md:w-auto">
            <Filter size={20} className="mr-2" />
            Filter
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader size={48} className="animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className="flex justify-center items-center h-64">
            <p className="text-red-500">{error}</p>
          </div>
        ) : (
          orders.length === 0 ? (
            <div className="flex justify-center items-center h-64">
              <p className="text-secondary-foreground">No orders data found.</p>
            </div>
          ) : (
            <>
              {/* Mobile Card View */}
              <div className="grid grid-cols-1 gap-4 md:hidden">
                {orders.map((order) => (
                  <div key={order.id} className="bg-card p-4 rounded-lg shadow border border-border">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-bold text-primary">#{order.orderNumber}</p>
                        <p className="text-sm text-secondary-foreground">{order.customer?.name || 'N/A'}</p>
                      </div>
                      {getStatusChip(order.status)}
                    </div>
                    <div className="mt-4 flex justify-between items-center">
                      <p className="text-lg font-bold text-primary">${order.totalAmount}</p>
                      <p className="text-sm text-secondary-foreground">{new Date(order.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div className="mt-4 flex justify-end">
                      <button className="text-accent hover:text-primary">
                        <Eye size={18} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="min-w-full bg-card">
                  <thead className="bg-secondary">
                    <tr>
                      <th className="py-3 px-6 text-left text-xs font-medium text-secondary-foreground uppercase tracking-wider">Order ID</th>
                      <th className="py-3 px-6 text-left text-xs font-medium text-secondary-foreground uppercase tracking-wider">Customer</th>
                      <th className="py-3 px-6 text-left text-xs font-medium text-secondary-foreground uppercase tracking-wider">Date</th>
                      <th className="py-3 px-6 text-left text-xs font-medium text-secondary-foreground uppercase tracking-wider">Status</th>
                      <th className="py-3 px-6 text-left text-xs font-medium text-secondary-foreground uppercase tracking-wider">Total</th>
                      <th className="py-3 px-6 text-left text-xs font-medium text-secondary-foreground uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {orders.map((order) => (
                      <tr key={order.id} className="hover:bg-accent">
                        <td className="py-4 px-6 text-sm font-medium text-primary">{order.orderNumber}</td>
                        <td className="py-4 px-6 text-sm text-secondary-foreground">{order.customer?.name || 'N/A'}</td>
                        <td className="py-4 px-6 text-sm text-secondary-foreground">{new Date(order.createdAt).toLocaleDateString()}</td>
                        <td className="py-4 px-6 text-sm">{getStatusChip(order.status)}</td>
                        <td className="py-4 px-6 text-sm text-secondary-foreground">${order.totalAmount}</td>
                        <td className="py-4 px-6 text-sm">
                          <button className="text-accent hover:text-primary">
                            <Eye size={18} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Pagination 
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
              />
            </>
          )
        )}
      </div>
    </div>
  );
};

export default Orders;
