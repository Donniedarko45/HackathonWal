import React, { useEffect, useState } from 'react';
import { PlusCircle, Edit, Trash2, Search, Loader } from 'lucide-react';
import { inventoryApi } from '../services/api';

const getStatusChip = (quantity: number, reorderPoint: number) => {
  if (quantity === 0) {
    return <span className="px-2 py-1 text-xs font-semibold text-red-800 bg-red-200 rounded-full">Out of Stock</span>;
  }
  if (quantity <= reorderPoint) {
    return <span className="px-2 py-1 text-xs font-semibold text-yellow-800 bg-yellow-200 rounded-full">Low Stock</span>;
  }
  return <span className="px-2 py-1 text-xs font-semibold text-green-800 bg-green-200 rounded-full">In Stock</span>;
};

const Inventory: React.FC = () => {
  const [inventory, setInventory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchInventory = async () => {
      try {
        const response = await inventoryApi.getAll();
        setInventory(response.data);
      } catch (err) {
        setError('Failed to fetch inventory data.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchInventory();
  }, []);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Inventory</h1>
        <button className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500">
          <PlusCircle size={20} className="mr-2" />
          Add Product
        </button>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-lg">
        <div className="flex justify-between items-center mb-4">
          <div className="relative">
            <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text"
              placeholder="Search products..."
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
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
                  <th className="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SKU</th>
                  <th className="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product Name</th>
                  <th className="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                  <th className="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                  <th className="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                  <th className="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                  <th className="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {inventory.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="py-4 px-6 text-sm font-medium text-gray-900">{item.product.sku}</td>
                    <td className="py-4 px-6 text-sm text-gray-700">{item.product.name}</td>
                    <td className="py-4 px-6 text-sm text-gray-700">{item.product.category.name}</td>
                    <td className="py-4 px-6 text-sm text-gray-700">{item.location.name}</td>
                    <td className="py-4 px-6 text-sm text-gray-700">{item.quantity}</td>
                    <td className="py-4 px-6 text-sm">{getStatusChip(item.quantity, item.reorderPoint)}</td>
                    <td className="py-4 px-6 text-sm text-gray-700">${item.product.unitPrice}</td>
                    <td className="py-4 px-6 text-sm">
                      <div className="flex items-center space-x-4">
                        <button className="text-indigo-600 hover:text-indigo-900">
                          <Edit size={18} />
                        </button>
                        <button className="text-red-600 hover:text-red-900">
                          <Trash2 size={18} />
                        </button>
                      </div>
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

export default Inventory;
