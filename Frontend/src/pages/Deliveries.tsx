import React, { useEffect, useState, useCallback } from "react";
import { MapPin, Search, Filter, Loader } from "lucide-react";
import { deliveryApi } from "../services/api";
import Pagination from "../components/common/Pagination";

const getStatusChip = (status: string) => {
  switch (status) {
    case "DELIVERED":
      return (
        <span className="px-2 py-1 text-xs font-semibold text-green-300 bg-green-900 rounded-full">
          {status}
        </span>
      );
    case "IN_TRANSIT":
      return (
        <span className="px-2 py-1 text-xs font-semibold text-blue-300 bg-blue-900 rounded-full">
          IN TRANSIT
        </span>
      );
    case "PENDING":
      return (
        <span className="px-2 py-1 text-xs font-semibold text-yellow-300 bg-yellow-900 rounded-full">
          {status}
        </span>
      );
    default:
      return (
        <span className="px-2 py-1 text-xs font-semibold text-secondary-foreground bg-secondary rounded-full">
          {status}
        </span>
      );
  }
};

const Deliveries: React.FC = () => {
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchDeliveries = useCallback(async (page: number) => {
    setLoading(true);
    try {
      const response = await deliveryApi.getAll({ page, limit: 10 });
      if (response.data && Array.isArray(response.data.deliveries)) {
        setDeliveries(response.data.deliveries);
        setTotalPages(response.data.pagination.pages);
        setCurrentPage(response.data.pagination.page);
      } else {
        setError("Failed to fetch deliveries: Invalid data format.");
        console.error(
          "API response.data.deliveries is not an array:",
          response.data,
        );
        setDeliveries([]);
      }
    } catch (err) {
      setError("Failed to fetch deliveries data.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDeliveries(currentPage);
  }, [fetchDeliveries, currentPage]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h1 className="text-3xl font-bold text-primary">Deliveries</h1>
      </div>

      <div className="bg-card p-4 md:p-6 rounded-lg shadow-lg">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">
          <div className="relative w-full md:w-auto">
            <Search
              size={20}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary-foreground"
            />
            <input
              type="text"
              placeholder="Search deliveries..."
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
        ) : deliveries.length === 0 ? (
          <div className="flex justify-center items-center h-64">
            <p className="text-secondary-foreground">
              No deliveries data found.
            </p>
          </div>
        ) : (
          <>
            {/* Mobile Card View */}
            <div className="grid grid-cols-1 gap-4 md:hidden">
              {deliveries.map((delivery) => (
                <div
                  key={delivery.id}
                  className="bg-card p-4 rounded-lg shadow border border-border"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-bold text-primary">
                        ID: {delivery.id.substring(0, 8)}
                      </p>
                      <p className="text-sm text-secondary-foreground">
                        Order: {delivery.orderId.substring(0, 8)}
                      </p>
                    </div>
                    {getStatusChip(delivery.status)}
                  </div>
                  <div className="mt-4">
                    <p className="text-sm text-secondary-foreground">
                      <span className="font-semibold text-primary">
                        Driver:
                      </span>{" "}
                      {delivery.driver?.name || "N/A"}
                    </p>
                    <p className="text-sm text-secondary-foreground">
                      <span className="font-semibold text-primary">
                        Est. Delivery:
                      </span>{" "}
                      {new Date(delivery.scheduledDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="mt-4 flex justify-end">
                    <button className="text-accent hover:text-primary">
                      <MapPin size={18} />
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
                    <th className="py-3 px-6 text-left text-xs font-medium text-secondary-foreground uppercase tracking-wider">
                      Delivery ID
                    </th>
                    <th className="py-3 px-6 text-left text-xs font-medium text-secondary-foreground uppercase tracking-wider">
                      Order ID
                    </th>
                    <th className="py-3 px-6 text-left text-xs font-medium text-secondary-foreground uppercase tracking-wider">
                      Driver
                    </th>
                    <th className="py-3 px-6 text-left text-xs font-medium text-secondary-foreground uppercase tracking-wider">
                      Status
                    </th>
                    <th className="py-3 px-6 text-left text-xs font-medium text-secondary-foreground uppercase tracking-wider">
                      Est. Delivery
                    </th>
                    <th className="py-3 px-6 text-left text-xs font-medium text-secondary-foreground uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {deliveries.map((delivery) => (
                    <tr key={delivery.id} className="hover:bg-accent">
                      <td className="py-4 px-6 text-sm font-medium text-primary">
                        {delivery.id}
                      </td>
                      <td className="py-4 px-6 text-sm text-secondary-foreground">
                        {delivery.orderId}
                      </td>
                      <td className="py-4 px-6 text-sm text-secondary-foreground">
                        {delivery.driver?.name || "N/A"}
                      </td>
                      <td className="py-4 px-6 text-sm">
                        {getStatusChip(delivery.status)}
                      </td>
                      <td className="py-4 px-6 text-sm text-secondary-foreground">
                        {new Date(delivery.scheduledDate).toLocaleDateString()}
                      </td>
                      <td className="py-4 px-6 text-sm">
                        <button className="text-accent hover:text-primary">
                          <MapPin size={18} />
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
        )}
      </div>
    </div>
  );
};

export default Deliveries;
("");
