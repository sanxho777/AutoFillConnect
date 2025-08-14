import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Link } from "wouter";
import { ArrowLeft, Settings as SettingsIcon, Chrome, Server, Download, Upload, RefreshCw } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

export default function Settings() {
  const { toast } = useToast();
  const [scrapingDelay, setScrapingDelay] = useState([2000]);
  const [maxRetries, setMaxRetries] = useState([3]);

  const { data: extensionSettings } = useQuery({
    queryKey: ["/api/extension/settings"],
  });

  const { data: extensionStatus } = useQuery({
    queryKey: ["/api/extension/status"],
    refetchInterval: 5000, // Check every 5 seconds
  });

  const updateSettingsMutation = useMutation({
    mutationFn: async (settings: any) => {
      const response = await fetch(`/api/extension/settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings)
      });
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Settings updated successfully!" });
      queryClient.invalidateQueries({ queryKey: ["/api/extension/settings"] });
    },
  });

  const settings = (extensionSettings as any) || {
    autoExtractVin: true,
    autoPostFacebook: false,
    lazyLoadImages: true,
    scrapingDelay: 2000,
    maxRetries: 3,
  };

  const isExtensionConnected = (extensionStatus as any)?.connected || false;

  const handleToggleSetting = (key: string, value: boolean) => {
    updateSettingsMutation.mutate({ [key]: value });
  };

  const handleUpdateScrapingSettings = () => {
    updateSettingsMutation.mutate({
      scrapingDelay: scrapingDelay[0],
      maxRetries: maxRetries[0],
    });
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
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Configure scraping preferences and system settings
                </p>
              </div>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Extension Status */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Chrome className="h-5 w-5 mr-2" />
              Chrome Extension Status
            </CardTitle>
            <CardDescription>Connection status between the browser extension and web application</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={`w-3 h-3 rounded-full ${isExtensionConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <div>
                  <p className={`font-medium ${isExtensionConnected ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`}>
                    {isExtensionConnected ? 'Connected' : 'Disconnected'}
                  </p>
                  <p className="text-sm text-gray-500">
                    {isExtensionConnected 
                      ? 'Extension is connected and ready for scraping'
                      : 'Extension is not communicating with the server'
                    }
                  </p>
                </div>
              </div>
              <Badge variant={isExtensionConnected ? 'default' : 'destructive'}>
                {isExtensionConnected ? 'Online' : 'Offline'}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="scraping" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="scraping" data-testid="tab-scraping">Scraping</TabsTrigger>
            <TabsTrigger value="automation" data-testid="tab-automation">Automation</TabsTrigger>
            <TabsTrigger value="data" data-testid="tab-data">Data & Export</TabsTrigger>
            <TabsTrigger value="system" data-testid="tab-system">System</TabsTrigger>
          </TabsList>

          {/* Scraping Settings */}
          <TabsContent value="scraping">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Scraping Preferences</CardTitle>
                  <CardDescription>Configure how the extension extracts vehicle data</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label>Auto-extract VIN numbers</Label>
                      <p className="text-sm text-gray-500">
                        Automatically extract VIN numbers when available
                      </p>
                    </div>
                    <Switch
                      checked={settings.autoExtractVin}
                      onCheckedChange={(checked) => handleToggleSetting('autoExtractVin', checked)}
                      data-testid="switch-auto-extract-vin"
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label>Lazy-load images</Label>
                      <p className="text-sm text-gray-500">
                        Load images gradually to improve performance
                      </p>
                    </div>
                    <Switch
                      checked={settings.lazyLoadImages}
                      onCheckedChange={(checked) => handleToggleSetting('lazyLoadImages', checked)}
                      data-testid="switch-lazy-load-images"
                    />
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <div>
                      <Label>Scraping Delay (milliseconds)</Label>
                      <p className="text-sm text-gray-500 mb-4">
                        Delay between scraping requests to avoid rate limiting
                      </p>
                      <Slider
                        value={scrapingDelay}
                        onValueChange={setScrapingDelay}
                        max={10000}
                        min={1000}
                        step={500}
                        className="w-full"
                        data-testid="slider-scraping-delay"
                      />
                      <div className="flex justify-between text-sm text-gray-500 mt-2">
                        <span>1s</span>
                        <span>Current: {scrapingDelay[0]}ms</span>
                        <span>10s</span>
                      </div>
                    </div>

                    <div>
                      <Label>Maximum Retries</Label>
                      <p className="text-sm text-gray-500 mb-4">
                        Number of retry attempts for failed requests
                      </p>
                      <Slider
                        value={maxRetries}
                        onValueChange={setMaxRetries}
                        max={10}
                        min={1}
                        step={1}
                        className="w-full"
                        data-testid="slider-max-retries"
                      />
                      <div className="flex justify-between text-sm text-gray-500 mt-2">
                        <span>1</span>
                        <span>Current: {maxRetries[0]} retries</span>
                        <span>10</span>
                      </div>
                    </div>

                    <Button 
                      onClick={handleUpdateScrapingSettings}
                      disabled={updateSettingsMutation.isPending}
                      data-testid="button-save-scraping-settings"
                    >
                      <SettingsIcon className="h-4 w-4 mr-2" />
                      Save Scraping Settings
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Automation Settings */}
          <TabsContent value="automation">
            <Card>
              <CardHeader>
                <CardTitle>Automation Settings</CardTitle>
                <CardDescription>Configure automatic behaviors and integrations</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Auto-post to Facebook</Label>
                    <p className="text-sm text-gray-500">
                      Automatically create Facebook Marketplace posts for scraped vehicles
                    </p>
                  </div>
                  <Switch
                    checked={settings.autoPostFacebook}
                    onCheckedChange={(checked) => handleToggleSetting('autoPostFacebook', checked)}
                    data-testid="switch-auto-post-facebook"
                  />
                </div>

                <Separator />

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="batch-size">Batch Processing Size</Label>
                    <Select defaultValue="10">
                      <SelectTrigger data-testid="select-batch-size">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="5">5 vehicles</SelectItem>
                        <SelectItem value="10">10 vehicles</SelectItem>
                        <SelectItem value="25">25 vehicles</SelectItem>
                        <SelectItem value="50">50 vehicles</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="auto-refresh">Auto-refresh Interval</Label>
                    <Select defaultValue="30">
                      <SelectTrigger data-testid="select-auto-refresh">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="15">15 seconds</SelectItem>
                        <SelectItem value="30">30 seconds</SelectItem>
                        <SelectItem value="60">1 minute</SelectItem>
                        <SelectItem value="0">Disabled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Data & Export Settings */}
          <TabsContent value="data">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Data Management</CardTitle>
                  <CardDescription>Import, export, and manage your vehicle data</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Button variant="outline" data-testid="button-export-csv">
                      <Download className="h-4 w-4 mr-2" />
                      Export to CSV
                    </Button>
                    <Button variant="outline" data-testid="button-export-json">
                      <Download className="h-4 w-4 mr-2" />
                      Export to JSON
                    </Button>
                    <Button variant="outline" data-testid="button-import-data">
                      <Upload className="h-4 w-4 mr-2" />
                      Import Data
                    </Button>
                    <Button variant="outline" data-testid="button-backup-data">
                      <Server className="h-4 w-4 mr-2" />
                      Create Backup
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Data Retention</CardTitle>
                  <CardDescription>Configure how long data is kept in the system</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="retention-period">Data Retention Period</Label>
                    <Select defaultValue="90">
                      <SelectTrigger data-testid="select-retention-period">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="30">30 days</SelectItem>
                        <SelectItem value="90">90 days</SelectItem>
                        <SelectItem value="180">6 months</SelectItem>
                        <SelectItem value="365">1 year</SelectItem>
                        <SelectItem value="0">Never delete</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Button variant="destructive" data-testid="button-clear-old-data">
                    Clear Old Data
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* System Settings */}
          <TabsContent value="system">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>System Information</CardTitle>
                  <CardDescription>View system status and perform maintenance tasks</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label className="text-sm font-medium">Extension Version</Label>
                      <p className="text-sm text-gray-600">v1.0.0</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Server Status</Label>
                      <Badge variant="default" className="ml-2">Running</Badge>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Database</Label>
                      <Badge variant="default" className="ml-2">Connected</Badge>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Last Sync</Label>
                      <p className="text-sm text-gray-600">2 minutes ago</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Maintenance</CardTitle>
                  <CardDescription>Perform system maintenance and troubleshooting</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Button variant="outline" data-testid="button-clear-cache">
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Clear Cache
                    </Button>
                    <Button variant="outline" data-testid="button-reset-settings">
                      <SettingsIcon className="h-4 w-4 mr-2" />
                      Reset Settings
                    </Button>
                    <Button variant="outline" data-testid="button-check-updates">
                      <Download className="h-4 w-4 mr-2" />
                      Check for Updates
                    </Button>
                    <Button variant="outline" data-testid="button-run-diagnostics">
                      <Chrome className="h-4 w-4 mr-2" />
                      Run Diagnostics
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}