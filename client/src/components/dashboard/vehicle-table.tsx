import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Eye, Facebook, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface VehicleTableProps {
  onVehicleSelect: (vehicleId: string) => void;
}

export default function VehicleTable({ onVehicleSelect }: VehicleTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: vehicleData, isLoading } = useQuery<{
    vehicles: any[];
    pagination: { page: number; pages: number; total: number };
  }>({
    queryKey: ["/api/vehicles", { page: currentPage, source: sourceFilter === "all" ? undefined : sourceFilter }],
  });

  const handleDeleteVehicle = async (vehicleId: string) => {
    if (!confirm("Are you sure you want to delete this vehicle?")) return;

    try {
      await apiRequest("DELETE", `/api/vehicles/${vehicleId}`);
      queryClient.invalidateQueries({ queryKey: ["/api/vehicles"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({ title: "Vehicle deleted successfully" });
    } catch (error) {
      console.error("Failed to delete vehicle:", error);
      toast({ title: "Failed to delete vehicle", variant: "destructive" });
    }
  };

  const handlePostToFacebook = async (vehicleId: string) => {
    try {
      await apiRequest("POST", "/api/facebook/generate-description", { vehicleId });
      toast({ title: "Facebook description generated", description: "Opening Facebook Marketplace..." });
      // In a real implementation, this would open Facebook Marketplace with pre-filled data
      window.open("https://www.facebook.com/marketplace/create/vehicle", "_blank");
    } catch (error) {
      console.error("Failed to generate Facebook description:", error);
      toast({ title: "Failed to generate Facebook description", variant: "destructive" });
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      extracted: { variant: "default" as const, className: "bg-material-green-500 bg-opacity-10 text-material-green-500" },
      posted: { variant: "secondary" as const, className: "bg-material-orange-700 bg-opacity-10 text-material-orange-700" },
      failed: { variant: "destructive" as const, className: "bg-material-red-700 bg-opacity-10 text-material-red-700" },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.extracted;
    
    return (
      <Badge variant={config.variant} className={config.className}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <Card className="shadow-material">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const vehicles = vehicleData?.vehicles || [];
  const pagination = vehicleData?.pagination || { page: 1, pages: 1, total: 0 };

  return (
    <Card className="shadow-material dark:bg-gray-800 dark:border-gray-700">
      <CardHeader className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Recent Vehicle Data</h2>
          <div className="mt-4 sm:mt-0 flex space-x-3">
            <Select value={sourceFilter} onValueChange={setSourceFilter}>
              <SelectTrigger className="w-48" data-testid="source-filter">
                <SelectValue placeholder="All Sources" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sources</SelectItem>
                <SelectItem value="AutoTrader">AutoTrader</SelectItem>
                <SelectItem value="Cars.com">Cars.com</SelectItem>
                <SelectItem value="CarGurus">CarGurus</SelectItem>
                <SelectItem value="Dealer.com">Dealer.com</SelectItem>
              </SelectContent>
            </Select>
            <Button
              onClick={() => window.open("https://www.facebook.com/marketplace/create/vehicle", "_blank")}
              className="bg-material-green-500 hover:bg-material-green-400"
              data-testid="button-quick-post"
            >
              <Facebook className="w-4 h-4 mr-2" />
              Quick Post
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-material-grey-100">
                <TableHead className="text-material-grey-600 font-medium">Vehicle</TableHead>
                <TableHead className="text-material-grey-600 font-medium">VIN</TableHead>
                <TableHead className="text-material-grey-600 font-medium">Price</TableHead>
                <TableHead className="text-material-grey-600 font-medium">Mileage</TableHead>
                <TableHead className="text-material-grey-600 font-medium">Source</TableHead>
                <TableHead className="text-material-grey-600 font-medium">Status</TableHead>
                <TableHead className="text-material-grey-600 font-medium">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {vehicles.map((vehicle: any) => (
                <TableRow key={vehicle.id} className="hover:bg-material-grey-50" data-testid={`vehicle-row-${vehicle.id}`}>
                  <TableCell>
                    <div className="flex items-center">
                      {vehicle.images && vehicle.images[0] && (
                        <img
                          src={vehicle.images[0]}
                          alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
                          className="h-12 w-16 rounded-lg object-cover mr-3"
                          data-testid={`vehicle-image-${vehicle.id}`}
                        />
                      )}
                      <div>
                        <div className="text-sm font-medium text-gray-900" data-testid={`vehicle-name-${vehicle.id}`}>
                          {vehicle.year} {vehicle.make} {vehicle.model}
                        </div>
                        <div className="text-sm text-material-grey-600" data-testid={`vehicle-location-${vehicle.id}`}>
                          {vehicle.location}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-gray-900 font-mono" data-testid={`vehicle-vin-${vehicle.id}`}>
                      {vehicle.vin || "N/A"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm font-semibold text-gray-900" data-testid={`vehicle-price-${vehicle.id}`}>
                      ${vehicle.price ? Number(vehicle.price).toLocaleString() : "N/A"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-gray-900" data-testid={`vehicle-mileage-${vehicle.id}`}>
                      {vehicle.mileage ? `${vehicle.mileage.toLocaleString()} mi` : "N/A"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-gray-900" data-testid={`vehicle-source-${vehicle.id}`}>
                      {vehicle.source}
                    </span>
                  </TableCell>
                  <TableCell data-testid={`vehicle-status-${vehicle.id}`}>
                    {getStatusBadge(vehicle.status)}
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onVehicleSelect(vehicle.id)}
                        className="text-material-blue-700 hover:text-material-blue-600"
                        data-testid={`button-view-${vehicle.id}`}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handlePostToFacebook(vehicle.id)}
                        disabled={vehicle.status === "failed"}
                        className="text-material-green-500 hover:text-material-green-400 disabled:text-material-grey-600"
                        data-testid={`button-facebook-${vehicle.id}`}
                      >
                        <Facebook className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteVehicle(vehicle.id)}
                        className="text-material-red-700 hover:text-red-600"
                        data-testid={`button-delete-${vehicle.id}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        
        {/* Pagination */}
        <div className="bg-white px-6 py-3 flex items-center justify-between border-t border-gray-200">
          <div className="flex-1 flex justify-between sm:hidden">
            <Button
              variant="outline"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              data-testid="pagination-prev-mobile"
            >
              Previous
            </Button>
            <Button
              variant="outline"
              onClick={() => setCurrentPage(prev => Math.min(pagination.pages, prev + 1))}
              disabled={currentPage === pagination.pages}
              data-testid="pagination-next-mobile"
            >
              Next
            </Button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-material-grey-600" data-testid="pagination-info">
                Showing <span className="font-medium">{(currentPage - 1) * 10 + 1}</span> to{" "}
                <span className="font-medium">{Math.min(currentPage * 10, pagination.total)}</span> of{" "}
                <span className="font-medium">{pagination.total}</span> results
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="rounded-l-md"
                  data-testid="pagination-prev"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                {[...Array(Math.min(3, pagination.pages))].map((_, i) => {
                  const page = i + 1;
                  return (
                    <Button
                      key={page}
                      variant={currentPage === page ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(page)}
                      className={currentPage === page ? "bg-material-blue-700 border-material-blue-700" : ""}
                      data-testid={`pagination-page-${page}`}
                    >
                      {page}
                    </Button>
                  );
                })}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(pagination.pages, prev + 1))}
                  disabled={currentPage === pagination.pages}
                  className="rounded-r-md"
                  data-testid="pagination-next"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </nav>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
