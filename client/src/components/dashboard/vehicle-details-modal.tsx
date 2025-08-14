import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, Edit, Facebook } from "lucide-react";

interface VehicleDetailsModalProps {
  vehicleId: string;
  onClose: () => void;
}

export default function VehicleDetailsModal({ vehicleId, onClose }: VehicleDetailsModalProps) {
  const { data: vehicle, isLoading } = useQuery({
    queryKey: ["/api/vehicles", vehicleId],
  });

  if (isLoading) {
    return (
      <Dialog open={true} onOpenChange={() => onClose()}>
        <DialogContent className="max-w-4xl max-h-screen overflow-y-auto">
          <div className="animate-pulse space-y-6 p-6">
            <div className="h-6 bg-gray-200 rounded w-1/3"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="h-64 bg-gray-200 rounded"></div>
              <div className="space-y-4">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-4 bg-gray-200 rounded"></div>
                ))}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!vehicle) {
    return (
      <Dialog open={true} onOpenChange={() => onClose()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Vehicle Not Found</DialogTitle>
          </DialogHeader>
          <p>The requested vehicle could not be found.</p>
          <Button onClick={onClose}>Close</Button>
        </DialogContent>
      </Dialog>
    );
  }

  const handlePostToFacebook = () => {
    // In a real implementation, this would generate a Facebook description and open Marketplace
    window.open("https://www.facebook.com/marketplace/create/vehicle", "_blank");
  };

  return (
    <Dialog open={true} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-4xl max-h-screen overflow-y-auto" data-testid="vehicle-details-modal">
        <DialogHeader className="border-b border-gray-200 pb-4">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-semibold text-gray-900" data-testid="modal-title">
              {vehicle.year} {vehicle.make} {vehicle.model} Details
            </DialogTitle>
            <Button variant="ghost" size="sm" onClick={onClose} data-testid="button-close-modal">
              <X className="w-5 h-5" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6 p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Image Gallery */}
            <div>
              {vehicle.images && vehicle.images.length > 0 ? (
                <>
                  <img
                    src={vehicle.images[0]}
                    alt={`${vehicle.year} ${vehicle.make} ${vehicle.model} - Main View`}
                    className="w-full h-64 object-cover rounded-lg"
                    data-testid="main-vehicle-image"
                  />
                  {vehicle.images.length > 1 && (
                    <div className="grid grid-cols-3 gap-2 mt-4">
                      {vehicle.images.slice(1, 4).map((image: string, index: number) => (
                        <img
                          key={index}
                          src={image}
                          alt={`${vehicle.year} ${vehicle.make} ${vehicle.model} - View ${index + 2}`}
                          className="w-full h-20 object-cover rounded cursor-pointer"
                          data-testid={`thumbnail-${index}`}
                        />
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div className="w-full h-64 bg-gray-200 rounded-lg flex items-center justify-center">
                  <span className="text-gray-500">No images available</span>
                </div>
              )}
            </div>

            {/* Vehicle Details */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-material-grey-600">Year</label>
                  <p className="text-lg font-semibold" data-testid="vehicle-year">{vehicle.year || "N/A"}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-material-grey-600">Make</label>
                  <p className="text-lg font-semibold" data-testid="vehicle-make">{vehicle.make || "N/A"}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-material-grey-600">Model</label>
                  <p className="text-lg font-semibold" data-testid="vehicle-model">{vehicle.model || "N/A"}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-material-grey-600">Trim</label>
                  <p className="text-lg font-semibold" data-testid="vehicle-trim">{vehicle.trim || "N/A"}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-material-grey-600">Price</label>
                  <p className="text-xl font-bold text-material-green-500" data-testid="vehicle-price">
                    {vehicle.price ? `$${Number(vehicle.price).toLocaleString()}` : "N/A"}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-material-grey-600">Mileage</label>
                  <p className="text-lg font-semibold" data-testid="vehicle-mileage">
                    {vehicle.mileage ? `${vehicle.mileage.toLocaleString()} mi` : "N/A"}
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-material-grey-600">VIN</label>
                <p className="text-lg font-mono font-semibold" data-testid="vehicle-vin">
                  {vehicle.vin || "N/A"}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-material-grey-600">Location</label>
                <p className="text-lg font-semibold" data-testid="vehicle-location">
                  {vehicle.location || "N/A"}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-material-grey-600">Source</label>
                <p className="text-lg font-semibold" data-testid="vehicle-source">
                  {vehicle.source}
                </p>
              </div>
            </div>
          </div>

          {/* Description */}
          {vehicle.description && (
            <div>
              <label className="block text-sm font-medium text-material-grey-600 mb-2">Description</label>
              <p className="text-gray-900 leading-relaxed" data-testid="vehicle-description">
                {vehicle.description}
              </p>
            </div>
          )}

          {/* Features */}
          {vehicle.features && vehicle.features.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-material-grey-600 mb-2">Features</label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2" data-testid="vehicle-features">
                {vehicle.features.map((feature: string, index: number) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="bg-material-grey-100 text-material-grey-700"
                  >
                    {feature}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end space-x-4 pt-4 border-t border-gray-200">
            <Button variant="outline" onClick={onClose} data-testid="button-close">
              Close
            </Button>
            <Button
              className="bg-material-blue-700 hover:bg-material-blue-600"
              data-testid="button-edit"
            >
              <Edit className="w-4 h-4 mr-2" />
              Edit Details
            </Button>
            <Button
              onClick={handlePostToFacebook}
              className="bg-material-green-500 hover:bg-material-green-400"
              disabled={vehicle.status === "failed"}
              data-testid="button-post-facebook"
            >
              <Facebook className="w-4 h-4 mr-2" />
              Post to Facebook
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
