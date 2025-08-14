import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Facebook, Wand2 } from "lucide-react";

export default function FacebookIntegration() {
  const { data: facebookStatus } = useQuery<{
    isConnected: boolean;
    userName?: string;
  }>({
    queryKey: ["/api/facebook/status"],
  });

  const handleOpenMarketplace = () => {
    window.open("https://www.facebook.com/marketplace", "_blank");
  };

  const handleGenerateDescription = async () => {
    try {
      console.log("Generating Facebook description...");
      const response = await fetch('/api/facebook/generate-description', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vehicleId: 'sample-id' })
      });
      if (response.ok) {
        const data = await response.json();
        alert(`Generated description: ${data.description.substring(0, 100)}...`);
      }
    } catch (error) {
      console.error("Failed to generate description:", error);
      alert("Failed to generate description. Please try again.");
    }
  };

  return (
    <Card className="shadow-material" data-testid="facebook-integration">
      <CardHeader>
        <CardTitle className="text-lg">Facebook Integration</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-material-grey-600">Facebook Account</span>
          <Badge
            variant={facebookStatus?.isConnected ? "default" : "destructive"}
            className={
              facebookStatus?.isConnected
                ? "bg-material-green-500 bg-opacity-10 text-material-green-500"
                : ""
            }
            data-testid="facebook-status"
          >
            {facebookStatus?.isConnected ? "Connected" : "Disconnected"}
          </Badge>
        </div>

        <div className="border-t border-gray-200 pt-4">
          <p className="text-sm text-material-grey-600 mb-3">Quick Actions</p>
          <div className="space-y-2">
            <Button
              onClick={handleOpenMarketplace}
              className="w-full bg-blue-600 hover:bg-blue-700"
              data-testid="button-open-marketplace"
            >
              <Facebook className="w-4 h-4 mr-2" />
              Open Marketplace
            </Button>
            <Button
              onClick={handleGenerateDescription}
              variant="outline"
              className="w-full"
              data-testid="button-generate-description"
            >
              <Wand2 className="w-4 h-4 mr-2" />
              Generate Description
            </Button>
          </div>
        </div>

        {facebookStatus?.userName && (
          <div className="border-t border-gray-200 pt-4">
            <div className="text-sm">
              <span className="text-material-grey-600">Connected as: </span>
              <span className="font-medium" data-testid="facebook-username">
                {facebookStatus.userName}
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
