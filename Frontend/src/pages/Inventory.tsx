import React, { useEffect, useState, useCallback } from 'react';
import { PlusCircle, Edit, Trash2, Search, Loader } from 'lucide-react';
import { inventoryApi } from '../services/api';
import Pagination from '../components/common/Pagination';

const getStatusChip = (quantity: number, reorderPoint: number) => {
  if (quantity === 0) {
    return <span className="px-2 py-1 text-xs font-semibold text-red-300 bg-red-900 rounded-full">Out of Stock</span>;
  }
  if (quantity <= reorderPoint) {
    return <span className="px-2 py-1 text-xs font-semibold text-yellow-300 bg-yellow-900 rounded-full">Low Stock</span>;
  }
  return <span className="px-2 py-1 text-xs font-semibold text-green-300 bg-green-900 rounded-full">In Stock</span>;
};

const Inventory: React.FC = () => {
  const [inventory, setInventory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchInventory = useCallback(async (page: number) => {
    setLoading(true);
    try {
      const response = await inventoryApi.getAll({ page, limit: 10 });
      if (response.data && Array.isArray(response.data.inventory)) {
        setInventory(response.data.inventory);
        setTotalPages(response.data.pagination.pages);
        setCurrentPage(response.data.pagination.page);
      } else {
        setError('Failed to fetch inventory: Invalid data format.');
        console.error('API response.data.inventory is not an array:', response.data);
        setInventory([]);
      }
    } catch (err) {
      setError('Failed to fetch inventory data.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInventory(currentPage);
  }, [fetchInventory, currentPage]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h1 className="text-3xl font-bold text-primary">Inventory</h1>
        <button className="flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-lg shadow-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring w-full md:w-auto">
          <PlusCircle size={20} className="mr-2" />
          Add Product
        </button>
      </div>

      <div className="bg-card p-4 md:p-6 rounded-lg shadow-lg">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">
          <div className="relative w-full md:w-auto">
            <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary-foreground" />
            <input 
              type="text"
              placeholder="Search products..."
              className="pl-10 pr-4 py-2 border border-border bg-input text-primary rounded-lg focus:outline-none focus:ring-2 focus:ring-ring w-full"
            />
          </div>
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
          inventory.length === 0 ? (
            <div className="flex justify-center items-center h-64">
              <p className="text-secondary-foreground">No inventory data found.</p>
            </div>
          ) : (
            <>
              {/* Mobile Card View */}
              <div className="grid grid-cols-1 gap-4 md:hidden">
                {inventory.map((item) => (
                  <div key={item.id} className="bg-card p-4 rounded-lg shadow border border-border">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-bold text-primary">{item.product?.name}</p>
                        <p className="text-sm text-secondary-foreground">SKU: {item.product?.sku}</p>
                      </div>
                      {getStatusChip(item.quantity, item.reorderPoint)}
                    </div>
                    <div className="mt-4">
                      <p className="text-sm text-secondary-foreground">
                        <span className="font-semibold text-primary">Location:</span> {item.location?.name}
                      </p>
                      <p className="text-sm text-secondary-foreground">
                        <span className="font-semibold text-primary">Stock:</span> {item.quantity}
                      </p>
                      <p className="text-lg font-bold text-primary mt-2">${item.product?.unitPrice}</p>
                    </div>
                    <div className="mt-4 flex justify-end space-x-4">
                      <button className="text-accent hover:text-primary">
                        <Edit size={18} />
                      </button>
                      <button className="text-red-500 hover:text-red-400">
                        <Trash2 size={18} />
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
                      <th className="py-3 px-6 text-left text-xs font-medium text-secondary-foreground uppercase tracking-wider">SKU</th>
                      <th className="py-3 px-6 text-left text-xs font-medium text-secondary-foreground uppercase tracking-wider">Product Name</th>
                      <th className="py-3 px-6 text-left text-xs font-medium text-secondary-foreground uppercase tracking-wider">Category</th>
                      <th className="py-3 px-6 text-left text-xs font-medium text-secondary-foreground uppercase tracking-wider">Location</th>
                      <th className="py-3 px-6 text-left text-xs font-medium text-secondary-foreground uppercase tracking-wider">Stock</th>
                      <th className="py-3 px-6 text-left text-xs font-medium text-secondary-foreground uppercase tracking-wider">Status</th>
                      <th className="py-3 px-6 text-left text-xs font-medium text-secondary-foreground uppercase tracking-wider">Price</th>
                      <th className="py-3 px-6 text-left text-xs font-medium text-secondary-foreground uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {inventory.map((item) => (
                      <tr key={item.id} className="hover:bg-accent">
                        <td className="py-4 px-6 text-sm font-medium text-primary">{item.product?.sku}</td>
                        <td className="py-4 px-6 text-sm text-secondary-foreground">{item.product?.name}</td>
                        <td className="py-4 px-6 text-sm text-secondary-foreground">{item.product?.category?.name}</td>
                        <td className="py-4 px-6 text-sm text-secondary-foreground">{item.location?.name}</td>
                        <td className="py-4 px-6 text-sm text-secondary-foreground">{item.quantity}</td>
                        <td className="py-4 px-6 text-sm">{getStatusChip(item.quantity, item.reorderPoint)}</td>
                        <td className="py-4 px-6 text-sm text-secondary-foreground">${item.product?.unitPrice}</td>
                        <td className="py-4 px-6 text-sm">
                          <div className="flex items-center space-x-4">
                            <button className="text-accent hover:text-primary">
                              <Edit size={18} />
                            </button>
                            <button className="text-red-500 hover:text-red-400">
                              <Trash2 size={18} />
                            </button>
                          </div>
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

export default Inventory;
