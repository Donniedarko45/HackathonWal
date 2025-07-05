import React, { useEffect, useState, useCallback } from 'react';
import { PlusCircle, Edit, Trash2, Search, Loader } from 'lucide-react';
import { suppliersApi } from '../services/api';
import Pagination from '../components/common/Pagination';

const Suppliers: React.FC = () => {
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchSuppliers = useCallback(async (page: number) => {
    setLoading(true);
    try {
      const response = await suppliersApi.getAll({ page, limit: 10 });
      if (response.data && Array.isArray(response.data.suppliers)) {
        setSuppliers(response.data.suppliers);
        setTotalPages(response.data.pagination.pages);
        setCurrentPage(response.data.pagination.page);
      } else {
        setError('Failed to fetch suppliers: Invalid data format.');
        console.error('API response.data.suppliers is not an array:', response.data);
        setSuppliers([]);
      }
    } catch (err) {
      setError('Failed to fetch suppliers data.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSuppliers(currentPage);
  }, [fetchSuppliers, currentPage]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h1 className="text-3xl font-bold text-primary">Suppliers</h1>
        <button className="flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-lg shadow-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring w-full md:w-auto">
          <PlusCircle size={20} className="mr-2" />
          Add Supplier
        </button>
      </div>

      <div className="bg-card p-4 md:p-6 rounded-lg shadow-lg">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">
          <div className="relative w-full md:w-auto">
            <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary-foreground" />
            <input 
              type="text"
              placeholder="Search suppliers..."
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
          suppliers.length === 0 ? (
            <div className="flex justify-center items-center h-64">
              <p className="text-secondary-foreground">No suppliers data found.</p>
            </div>
          ) : (
            <>
              {/* Mobile Card View */}
              <div className="grid grid-cols-1 gap-4 md:hidden">
                {suppliers.map((supplier) => (
                  <div key={supplier.id} className="bg-card p-4 rounded-lg shadow border border-border">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-bold text-primary">{supplier.name}</p>
                        <p className="text-sm text-secondary-foreground">{supplier.contactName}</p>
                      </div>
                      <p className="text-sm font-bold text-yellow-500">{supplier.rating}/5</p>
                    </div>
                    <div className="mt-4">
                      <p className="text-sm text-secondary-foreground">{supplier.email}</p>
                      <p className="text-sm text-secondary-foreground">{supplier.phone}</p>
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
                      <th className="py-3 px-6 text-left text-xs font-medium text-secondary-foreground uppercase tracking-wider">Supplier ID</th>
                      <th className="py-3 px-6 text-left text-xs font-medium text-secondary-foreground uppercase tracking-wider">Name</th>
                      <th className="py-3 px-6 text-left text-xs font-medium text-secondary-foreground uppercase tracking-wider">Contact Person</th>
                      <th className="py-3 px-6 text-left text-xs font-medium text-secondary-foreground uppercase tracking-wider">Email</th>
                      <th className="py-3 px-6 text-left text-xs font-medium text-secondary-foreground uppercase tracking-wider">Phone</th>
                      <th className="py-3 px-6 text-left text-xs font-medium text-secondary-foreground uppercase tracking-wider">Rating</th>
                      <th className="py-3 px-6 text-left text-xs font-medium text-secondary-foreground uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {suppliers.map((supplier) => (
                      <tr key={supplier.id} className="hover:bg-accent">
                        <td className="py-4 px-6 text-sm font-medium text-primary">{supplier.id}</td>
                        <td className="py-4 px-6 text-sm text-secondary-foreground">{supplier.name}</td>
                        <td className="py-4 px-6 text-sm text-secondary-foreground">{supplier.contactName}</td>
                        <td className="py-4 px-6 text-sm text-secondary-foreground">{supplier.email}</td>
                        <td className="py-4 px-6 text-sm text-secondary-foreground">{supplier.phone}</td>
                        <td className="py-4 px-6 text-sm text-secondary-foreground">{supplier.rating}/5</td>
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

export default Suppliers;
