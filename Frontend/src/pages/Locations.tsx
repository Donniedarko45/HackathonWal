import React, { useEffect, useState, useCallback } from 'react';
import { PlusCircle, Edit, Trash2, Search, Loader } from 'lucide-react';
import { locationsApi } from '../services/api';
import Pagination from '../components/common/Pagination';

const Locations: React.FC = () => {
  const [locations, setLocations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchLocations = useCallback(async (page: number) => {
    setLoading(true);
    try {
      const response = await locationsApi.getAll({ page, limit: 10 });
      if (response.data && Array.isArray(response.data.locations)) {
        setLocations(response.data.locations);
        setTotalPages(response.data.pagination.pages);
        setCurrentPage(response.data.pagination.page);
      } else {
        setError('Failed to fetch locations: Invalid data format.');
        console.error('API response.data.locations is not an array:', response.data);
        setLocations([]);
      }
    } catch (err) {
      setError('Failed to fetch locations data.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLocations(currentPage);
  }, [fetchLocations, currentPage]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h1 className="text-3xl font-bold text-primary">Locations</h1>
        <button className="flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-lg shadow-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring w-full md:w-auto">
          <PlusCircle size={20} className="mr-2" />
          Add Location
        </button>
      </div>

      <div className="bg-card p-4 md:p-6 rounded-lg shadow-lg">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">
          <div className="relative w-full md:w-auto">
            <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary-foreground" />
            <input 
              type="text"
              placeholder="Search locations..."
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
          locations.length === 0 ? (
            <div className="flex justify-center items-center h-64">
              <p className="text-secondary-foreground">No locations data found.</p>
            </div>
          ) : (
            <>
              {/* Mobile Card View */}
              <div className="grid grid-cols-1 gap-4 md:hidden">
                {locations.map((location) => (
                  <div key={location.id} className="bg-card p-4 rounded-lg shadow border border-border">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-bold text-primary">{location.name}</p>
                        <p className="text-sm text-secondary-foreground">{location.address}</p>
                      </div>
                      <span className="px-2 py-1 text-xs font-semibold text-purple-300 bg-purple-900 rounded-full">{location.type}</span>
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
                      <th className="py-3 px-6 text-left text-xs font-medium text-secondary-foreground uppercase tracking-wider">Location ID</th>
                      <th className="py-3 px-6 text-left text-xs font-medium text-secondary-foreground uppercase tracking-wider">Name</th>
                      <th className="py-3 px-6 text-left text-xs font-medium text-secondary-foreground uppercase tracking-wider">Address</th>
                      <th className="py-3 px-6 text-left text-xs font-medium text-secondary-foreground uppercase tracking-wider">Type</th>
                      <th className="py-3 px-6 text-left text-xs font-medium text-secondary-foreground uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {locations.map((location) => (
                      <tr key={location.id} className="hover:bg-accent">
                        <td className="py-4 px-6 text-sm font-medium text-primary">{location.id}</td>
                        <td className="py-4 px-6 text-sm text-secondary-foreground">{location.name}</td>
                        <td className="py-4 px-6 text-sm text-secondary-foreground">{location.address}</td>
                        <td className="py-4 px-6 text-sm text-secondary-foreground">{location.type}</td>
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

export default Locations;
