import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { StopCircle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface ScrapingProgressProps {
  session: {
    id: string;
    status: string;
    currentSite?: string;
    progress?: number;
    totalItems?: number;
    completedItems?: number;
    currentAction?: string;
  };
}

export default function ScrapingProgress({ session }: ScrapingProgressProps) {
  const queryClient = useQueryClient();

  const { data: progressData } = useQuery({
    queryKey: ["/api/scraping/progress", session.id],
    refetchInterval: session.status === "active" ? 2000 : false,
  });

  const currentSession = progressData || session;
  const progressPercent = currentSession.totalItems
    ? Math.round((currentSession.completedItems! / currentSession.totalItems) * 100)
    : currentSession.progress || 0;

  const estimatedTimeRemaining = calculateTimeRemaining(
    currentSession.completedItems || 0,
    currentSession.totalItems || 0
  );

  const handleStopScraping = async () => {
    try {
      await apiRequest("PUT", `/api/scraping/${session.id}`, {
        status: "stopped",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/scraping/active"] });
    } catch (error) {
      console.error("Failed to stop scraping:", error);
    }
  };

  useEffect(() => {
    if (currentSession.status !== "active") {
      queryClient.invalidateQueries({ queryKey: ["/api/scraping/active"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
    }
  }, [currentSession.status, queryClient]);

  if (currentSession.status !== "active") {
    return null;
  }

  return (
    <Card className="shadow-material" data-testid="scraping-progress">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Active Scraping Session</CardTitle>
          <Badge className="bg-material-blue-700 hover:bg-material-blue-600" data-testid="scraping-status">
            In Progress
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-between text-sm">
          <span className="text-material-grey-600">Current Site:</span>
          <span className="font-medium" data-testid="current-site">
            {currentSession.currentSite || "Unknown"}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-material-grey-600">Progress:</span>
          <span className="font-medium" data-testid="progress-text">
            {progressPercent}% ({currentSession.completedItems || 0}/{currentSession.totalItems || 0})
          </span>
        </div>
        <Progress value={progressPercent} className="w-full" data-testid="progress-bar" />
        <div className="flex justify-between text-sm">
          <span className="text-material-grey-600">Estimated Time Remaining:</span>
          <span className="font-medium" data-testid="time-remaining">
            {estimatedTimeRemaining}
          </span>
        </div>
        {currentSession.currentAction && (
          <div className="flex justify-between text-sm">
            <span className="text-material-grey-600">Current Action:</span>
            <span className="font-medium" data-testid="current-action">
              {currentSession.currentAction}
            </span>
          </div>
        )}
        <Button
          onClick={handleStopScraping}
          variant="destructive"
          className="w-full bg-material-red-700 hover:bg-red-800"
          data-testid="button-stop-scraping"
        >
          <StopCircle className="w-4 h-4 mr-2" />
          Stop Scraping
        </Button>
      </CardContent>
    </Card>
  );
}

function calculateTimeRemaining(completed: number, total: number): string {
  if (total === 0 || completed >= total) return "0m 0s";
  
  const itemsRemaining = total - completed;
  const avgTimePerItem = 3; // seconds per item (estimate)
  const totalSeconds = itemsRemaining * avgTimePerItem;
  
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  
  return `${minutes}m ${seconds}s`;
}
