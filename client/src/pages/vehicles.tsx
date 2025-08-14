import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link } from "wouter";
import { ArrowLeft, Search, Filter, ExternalLink, Share } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

export default function Vehicles() {
  const [page, setPage] = useState(1);
  const [source, setSource] = useState<string>("all");
  const [status, setStatus] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");

  const { data: vehiclesData, isLoading } = useQuery({
    queryKey: ["/api/vehicles", { 
      page, 
      source: source === "all" ? undefined : source, 
      status: status === "all" ? undefined : status 
    }],
    enabled: true,
  });

  const vehicles = (vehiclesData as any)?.vehicles || [];
  const pagination = (vehiclesData as any)?.pagination || {};

  const filteredVehicles = vehicles.filter((vehicle: any) =>
    searchTerm === "" || 
    `${vehicle.year} ${vehicle.make} ${vehicle.model}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vehicle.vin?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    const statusColors: Record<string, string> = {
      'active': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100',
      'sold': 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100',
      'pending': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100',
      'error': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100'
    };
    
    return (
      <Badge className={statusColors[status] || statusColors['active']}>
        {status}
      </Badge>
    );
  };

  const getSourceBadge = (source: string) => {
    const sourceColors: Record<string, string> = {
      'autotrader.com': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100',
      'cars.com': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100',
      'cargurus.com': 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100',
      'dealer.com': 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-100'
    };
    
    return (
      <Badge variant="outline" className={sourceColors[source] || 'border-gray-300'}>
        {source}
      </Badge>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <Link href="/dashboard">
                <Button variant="ghost" size="sm" data-testid="button-back-dashboard">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Dashboard
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Vehicle Management</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Manage scraped vehicles and Facebook Marketplace listings
                </p>
              </div>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Filters & Search</CardTitle>
            <CardDescription>Filter vehicles by source, status, or search for specific vehicles</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search by make, model, year, or VIN..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                    data-testid="input-search-vehicles"
                  />
                </div>
              </div>
              <Select value={source} onValueChange={setSource}>
                <SelectTrigger className="w-48" data-testid="select-source">
                  <SelectValue placeholder="All Sources" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sources</SelectItem>
                  <SelectItem value="autotrader.com">AutoTrader</SelectItem>
                  <SelectItem value="cars.com">Cars.com</SelectItem>
                  <SelectItem value="cargurus.com">CarGurus</SelectItem>
                  <SelectItem value="dealer.com">Dealer.com</SelectItem>
                </SelectContent>
              </Select>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="w-48" data-testid="select-status">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="sold">Sold</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="error">Error</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Vehicles Table */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Scraped Vehicles ({filteredVehicles.length})</CardTitle>
                <CardDescription>Recently scraped vehicle listings from automotive websites</CardDescription>
              </div>
              <Button data-testid="button-export-vehicles" variant="outline">
                <ExternalLink className="h-4 w-4 mr-2" />
                Export Data
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Vehicle</TableHead>
                      <TableHead>VIN</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Mileage</TableHead>
                      <TableHead>Source</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Extracted</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredVehicles.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="h-24 text-center">
                          No vehicles found. Start scraping from automotive websites to see data here.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredVehicles.map((vehicle: any) => (
                        <TableRow key={vehicle.id} data-testid={`row-vehicle-${vehicle.id}`}>
                          <TableCell className="font-medium">
                            {vehicle.year} {vehicle.make} {vehicle.model}
                            {vehicle.trim && <span className="text-gray-500"> {vehicle.trim}</span>}
                          </TableCell>
                          <TableCell className="font-mono text-sm">
                            {vehicle.vin || <span className="text-gray-400">N/A</span>}
                          </TableCell>
                          <TableCell>
                            {vehicle.price ? `$${vehicle.price.toLocaleString()}` : <span className="text-gray-400">N/A</span>}
                          </TableCell>
                          <TableCell>
                            {vehicle.mileage ? `${vehicle.mileage.toLocaleString()} mi` : <span className="text-gray-400">N/A</span>}
                          </TableCell>
                          <TableCell>{getSourceBadge(vehicle.source)}</TableCell>
                          <TableCell>{getStatusBadge(vehicle.status)}</TableCell>
                          <TableCell className="text-sm text-gray-500">
                            {new Date(vehicle.extractedAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <Button size="sm" variant="outline" data-testid={`button-share-${vehicle.id}`}>
                                <Share className="h-3 w-3 mr-1" />
                                Share
                              </Button>
                              <Button size="sm" variant="outline" data-testid={`button-view-${vehicle.id}`}>
                                <ExternalLink className="h-3 w-3 mr-1" />
                                View
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            )}

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="flex items-center justify-between space-x-2 py-4">
                <div className="text-sm text-gray-500">
                  Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} vehicles
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(page - 1)}
                    disabled={page <= 1}
                    data-testid="button-prev-page"
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(page + 1)}
                    disabled={page >= pagination.pages}
                    data-testid="button-next-page"
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}