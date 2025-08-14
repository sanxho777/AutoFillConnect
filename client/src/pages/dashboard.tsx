import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import StatsCards from "@/components/dashboard/stats-cards";
import ScrapingProgress from "@/components/dashboard/scraping-progress";
import VehicleTable from "@/components/dashboard/vehicle-table";
import VehicleDetailsModal from "@/components/dashboard/vehicle-details-modal";
import FacebookIntegration from "@/components/dashboard/facebook-integration";
import ActivityFeed from "@/components/dashboard/activity-feed";
import ExtensionSettings from "@/components/dashboard/extension-settings";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Puzzle } from "lucide-react";

export default function Dashboard() {
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);

  const { data: extensionStatus } = useQuery({
    queryKey: ["/api/extension/status"],
    refetchInterval: 5000,
  });

  const { data: activeSession } = useQuery({
    queryKey: ["/api/scraping/active"],
    refetchInterval: 2000,
  });

  const handleNewScrape = () => {
    // In a real implementation, this would communicate with the Chrome extension
    console.log("Starting new scrape session...");
  };

  return (
    <div className="min-h-screen bg-material-grey-50">
      {/* Header */}
      <header className="bg-white shadow-md border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="flex-shrink-0">
                <h1 className="text-2xl font-bold text-material-blue-700" data-testid="app-title">
                  AutoScrapePro
                </h1>
              </div>
              <nav className="hidden md:flex space-x-8">
                <a
                  href="#"
                  className="text-material-blue-700 font-medium border-b-2 border-material-blue-700 pb-2"
                  data-testid="nav-dashboard"
                >
                  Dashboard
                </a>
                <a
                  href="#"
                  className="text-material-grey-600 hover:text-material-blue-700 font-medium pb-2"
                  data-testid="nav-vehicles"
                >
                  Vehicles
                </a>
                <a
                  href="#"
                  className="text-material-grey-600 hover:text-material-blue-700 font-medium pb-2"
                  data-testid="nav-facebook"
                >
                  Facebook Integration
                </a>
                <a
                  href="#"
                  className="text-material-grey-600 hover:text-material-blue-700 font-medium pb-2"
                  data-testid="nav-settings"
                >
                  Settings
                </a>
              </nav>
            </div>
            <div className="flex items-center space-x-4">
              <Badge
                variant={extensionStatus?.connected ? "default" : "destructive"}
                className={`${
                  extensionStatus?.connected
                    ? "bg-material-green-500 hover:bg-material-green-400"
                    : ""
                }`}
                data-testid="extension-status"
              >
                <Puzzle className="w-4 h-4 mr-2" />
                {extensionStatus?.connected ? "Extension Connected" : "Extension Disconnected"}
              </Badge>
              <Button
                onClick={handleNewScrape}
                className="bg-material-blue-700 hover:bg-material-blue-600"
                data-testid="button-new-scrape"
              >
                <Plus className="w-4 h-4 mr-2" />
                New Scrape
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <StatsCards />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Active Scraping Progress */}
            {activeSession && <ScrapingProgress session={activeSession} />}

            {/* Vehicle Table */}
            <VehicleTable onVehicleSelect={setSelectedVehicleId} />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <FacebookIntegration />
            <ActivityFeed />
            <ExtensionSettings />
          </div>
        </div>
      </div>

      {/* Vehicle Details Modal */}
      {selectedVehicleId && (
        <VehicleDetailsModal
          vehicleId={selectedVehicleId}
          onClose={() => setSelectedVehicleId(null)}
        />
      )}
    </div>
  );
}
