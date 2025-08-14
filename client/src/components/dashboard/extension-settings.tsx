import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Settings } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function ExtensionSettings() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: settings, isLoading } = useQuery<{
    autoExtractVin: boolean;
    autoPostFacebook: boolean;
    lazyLoadImages: boolean;
  }>({
    queryKey: ["/api/extension/settings"],
  });

  const handleToggleSetting = async (key: string, value: boolean) => {
    try {
      await apiRequest("PUT", "/api/extension/settings", {
        [key]: value,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/extension/settings"] });
      toast({ title: "Settings updated successfully" });
    } catch (error) {
      console.error("Failed to update settings:", error);
      toast({ title: "Failed to update settings", variant: "destructive" });
    }
  };

  const handleOpenAdvancedSettings = () => {
    alert("Advanced settings would open the Chrome extension options page. Make sure the AutoScrapePro extension is installed!");
  };

  if (isLoading) {
    return (
      <Card className="shadow-material">
        <CardHeader>
          <CardTitle className="text-lg">Extension Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center justify-between animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-24"></div>
              <div className="h-6 w-11 bg-gray-200 rounded-full"></div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-material dark:bg-gray-800 dark:border-gray-700" data-testid="extension-settings">
      <CardHeader>
        <CardTitle className="text-lg dark:text-gray-100">Extension Settings</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-material-grey-600 dark:text-gray-400">Auto-extract VIN</span>
          <Switch
            checked={settings?.autoExtractVin ?? true}
            onCheckedChange={(checked) => handleToggleSetting("autoExtractVin", checked)}
            data-testid="switch-auto-extract-vin"
          />
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-material-grey-600 dark:text-gray-400">Auto-post to Facebook</span>
          <Switch
            checked={settings?.autoPostFacebook ?? false}
            onCheckedChange={(checked) => handleToggleSetting("autoPostFacebook", checked)}
            data-testid="switch-auto-post-facebook"
          />
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-material-grey-600 dark:text-gray-400">Lazy-load images</span>
          <Switch
            checked={settings?.lazyLoadImages ?? true}
            onCheckedChange={(checked) => handleToggleSetting("lazyLoadImages", checked)}
            data-testid="switch-lazy-load-images"
          />
        </div>

        <Button
          onClick={handleOpenAdvancedSettings}
          variant="outline"
          className="w-full"
          data-testid="button-advanced-settings"
        >
          <Settings className="w-4 h-4 mr-2" />
          Advanced Settings
        </Button>
      </CardContent>
    </Card>
  );
}
