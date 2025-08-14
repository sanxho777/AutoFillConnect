import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link } from "wouter";
import { ArrowLeft, Facebook, Share, CheckCircle, AlertCircle, ExternalLink } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

export default function FacebookIntegration() {
  const { toast } = useToast();
  const [selectedVehicles, setSelectedVehicles] = useState<string[]>([]);
  const [customDescription, setCustomDescription] = useState("");

  const { data: facebookStatus } = useQuery({
    queryKey: ["/api/facebook/status"],
  });

  const { data: vehiclesData } = useQuery({
    queryKey: ["/api/vehicles", { status: "active", limit: 50 }],
  });

  const generateDescriptionMutation = useMutation({
    mutationFn: async (vehicleId: string) => {
      const response = await fetch(`/api/facebook/generate-description`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vehicleId })
      });
      return response.json();
    },
  });

  const quickPostMutation = useMutation({
    mutationFn: async (data: { vehicleIds: string[]; groupIds: string[] }) => {
      const response = await fetch(`/api/facebook/quick-post`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Facebook posts prepared successfully!" });
      queryClient.invalidateQueries({ queryKey: ["/api/vehicles"] });
    },
  });

  const vehicles = (vehiclesData as any)?.vehicles || [];
  const isConnected = (facebookStatus as any)?.isConnected || false;

  const handleVehicleSelect = (vehicleId: string, selected: boolean) => {
    if (selected) {
      setSelectedVehicles([...selectedVehicles, vehicleId]);
    } else {
      setSelectedVehicles(selectedVehicles.filter(id => id !== vehicleId));
    }
  };

  const handleGenerateDescription = async (vehicleId: string) => {
    try {
      const result = await generateDescriptionMutation.mutateAsync(vehicleId);
      setCustomDescription((result as any).description);
      toast({ title: "Generated", description: "Facebook description generated successfully!" });
    } catch (error) {
      toast({ title: "Error", description: "Failed to generate description", variant: "destructive" });
    }
  };

  const handleQuickPost = async () => {
    if (selectedVehicles.length === 0) {
      toast({ title: "Error", description: "Please select at least one vehicle", variant: "destructive" });
      return;
    }

    try {
      await quickPostMutation.mutateAsync({
        vehicleIds: selectedVehicles,
        groupIds: ["marketplace"] // Default to marketplace
      });
    } catch (error) {
      toast({ title: "Error", description: "Failed to prepare Facebook posts", variant: "destructive" });
    }
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
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Facebook Integration</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Auto-generate and post vehicle listings to Facebook Marketplace
                </p>
              </div>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Connection Status */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Facebook className="h-5 w-5 mr-2 text-blue-600" />
              Facebook Connection Status
            </CardTitle>
            <CardDescription>Connect your Facebook account to enable automatic posting</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {isConnected ? (
                  <>
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <div>
                      <p className="font-medium text-green-700 dark:text-green-400">Connected</p>
                      <p className="text-sm text-gray-500">Facebook account is connected and ready</p>
                    </div>
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-5 w-5 text-red-500" />
                    <div>
                      <p className="font-medium text-red-700 dark:text-red-400">Disconnected</p>
                      <p className="text-sm text-gray-500">Connect Facebook to enable posting features</p>
                    </div>
                  </>
                )}
              </div>
              <Button data-testid="button-connect-facebook" disabled={isConnected}>
                {isConnected ? "Connected" : "Connect Facebook"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="quick-post" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="quick-post" data-testid="tab-quick-post">Quick Post</TabsTrigger>
            <TabsTrigger value="custom-post" data-testid="tab-custom-post">Custom Post</TabsTrigger>
            <TabsTrigger value="settings" data-testid="tab-settings">Settings</TabsTrigger>
          </TabsList>

          {/* Quick Post Tab */}
          <TabsContent value="quick-post">
            <Card>
              <CardHeader>
                <CardTitle>Quick Post to Marketplace</CardTitle>
                <CardDescription>
                  Select vehicles and automatically generate Facebook Marketplace listings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Selected Vehicles: {selectedVehicles.length}</p>
                    <p className="text-sm text-gray-500">Choose vehicles to post to Facebook Marketplace</p>
                  </div>
                  <Button 
                    onClick={handleQuickPost}
                    disabled={selectedVehicles.length === 0 || quickPostMutation.isPending}
                    data-testid="button-quick-post"
                  >
                    <Share className="h-4 w-4 mr-2" />
                    {quickPostMutation.isPending ? "Posting..." : "Quick Post Selected"}
                  </Button>
                </div>

                <div className="grid gap-4">
                  {vehicles.map((vehicle: any) => (
                    <div
                      key={vehicle.id}
                      className="flex items-center space-x-4 p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
                      data-testid={`vehicle-card-${vehicle.id}`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedVehicles.includes(vehicle.id)}
                        onChange={(e) => handleVehicleSelect(vehicle.id, e.target.checked)}
                        className="h-4 w-4 text-blue-600 rounded"
                        data-testid={`checkbox-vehicle-${vehicle.id}`}
                      />
                      <div className="flex-1">
                        <h3 className="font-medium">
                          {vehicle.year} {vehicle.make} {vehicle.model} {vehicle.trim}
                        </h3>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span>${vehicle.price?.toLocaleString()}</span>
                          <span>{vehicle.mileage?.toLocaleString()} mi</span>
                          <Badge variant="outline">{vehicle.source}</Badge>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleGenerateDescription(vehicle.id)}
                        disabled={generateDescriptionMutation.isPending}
                        data-testid={`button-generate-${vehicle.id}`}
                      >
                        Generate Description
                      </Button>
                    </div>
                  ))}

                  {vehicles.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      No active vehicles found. Start scraping to see vehicles here.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Custom Post Tab */}
          <TabsContent value="custom-post">
            <Card>
              <CardHeader>
                <CardTitle>Custom Facebook Post</CardTitle>
                <CardDescription>
                  Create custom Facebook Marketplace listings with personalized descriptions
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="vehicle-select">Select Vehicle</Label>
                    <Select>
                      <SelectTrigger data-testid="select-custom-vehicle">
                        <SelectValue placeholder="Choose a vehicle" />
                      </SelectTrigger>
                      <SelectContent>
                        {vehicles.map((vehicle: any) => (
                          <SelectItem key={vehicle.id} value={vehicle.id}>
                            {vehicle.year} {vehicle.make} {vehicle.model}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="description">Custom Description</Label>
                    <Textarea
                      id="description"
                      placeholder="Write a custom description for your Facebook post..."
                      value={customDescription}
                      onChange={(e) => setCustomDescription(e.target.value)}
                      rows={8}
                      data-testid="textarea-custom-description"
                    />
                  </div>

                  <div className="flex space-x-4">
                    <Button variant="outline" data-testid="button-preview">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Preview
                    </Button>
                    <Button data-testid="button-post-custom">
                      <Share className="h-4 w-4 mr-2" />
                      Post to Facebook
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>Facebook Integration Settings</CardTitle>
                <CardDescription>
                  Configure automatic posting behavior and preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label>Auto-post new vehicles</Label>
                      <p className="text-sm text-gray-500">
                        Automatically create Facebook posts when new vehicles are scraped
                      </p>
                    </div>
                    <Switch data-testid="switch-auto-post" />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label>Include VIN in posts</Label>
                      <p className="text-sm text-gray-500">
                        Show vehicle VIN numbers in Facebook Marketplace listings
                      </p>
                    </div>
                    <Switch data-testid="switch-include-vin" />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label>Use custom hashtags</Label>
                      <p className="text-sm text-gray-500">
                        Add custom hashtags to improve post visibility
                      </p>
                    </div>
                    <Switch data-testid="switch-custom-hashtags" />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="default-location">Default Location</Label>
                    <Input
                      id="default-location"
                      placeholder="City, State"
                      data-testid="input-default-location"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="contact-info">Contact Information</Label>
                    <Input
                      id="contact-info"
                      placeholder="Phone number or contact details"
                      data-testid="input-contact-info"
                    />
                  </div>

                  <Button data-testid="button-save-settings">
                    Save Settings
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}