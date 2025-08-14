import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Facebook, AlertTriangle, Car } from "lucide-react";

export default function ActivityFeed() {
  const { data: activities, isLoading } = useQuery({
    queryKey: ["/api/activity", { limit: 10 }],
  });

  const getActivityIcon = (type: string) => {
    const iconClass = "text-sm w-4 h-4";
    switch (type) {
      case "scrape_success":
        return <CheckCircle className={`${iconClass} text-material-green-500`} />;
      case "facebook_post":
        return <Facebook className={`${iconClass} text-blue-600`} />;
      case "scrape_failed":
        return <AlertTriangle className={`${iconClass} text-material-red-700`} />;
      default:
        return <Car className={`${iconClass} text-material-blue-700`} />;
    }
  };

  const getActivityBgColor = (type: string) => {
    switch (type) {
      case "scrape_success":
        return "bg-material-green-500 bg-opacity-10";
      case "facebook_post":
        return "bg-blue-600 bg-opacity-10";
      case "scrape_failed":
        return "bg-material-red-700 bg-opacity-10";
      default:
        return "bg-material-blue-700 bg-opacity-10";
    }
  };

  const formatTimeAgo = (timestamp: string | Date) => {
    const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
    if (!date || isNaN(date.getTime())) return "Unknown time";
    
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes} minute${diffInMinutes > 1 ? "s" : ""} ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? "s" : ""} ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays} day${diffInDays > 1 ? "s" : ""} ago`;
  };

  if (isLoading) {
    return (
      <Card className="shadow-material">
        <CardHeader>
          <CardTitle className="text-lg">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-start space-x-3 animate-pulse">
              <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/4"></div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-material dark:bg-gray-800 dark:border-gray-700" data-testid="activity-feed">
      <CardHeader>
        <CardTitle className="text-lg dark:text-gray-100">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {activities && activities.length > 0 ? (
          activities.map((activity: any) => (
            <div key={activity.id} className="flex items-start space-x-3" data-testid={`activity-${activity.id}`}>
              <div className="flex-shrink-0">
                <div className={`w-8 h-8 ${getActivityBgColor(activity.type)} rounded-full flex items-center justify-center`}>
                  {getActivityIcon(activity.type)}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-900 dark:text-gray-100" data-testid={`activity-description-${activity.id}`}>
                  {activity.description}
                </p>
                <p className="text-xs text-material-grey-600 dark:text-gray-400" data-testid={`activity-time-${activity.id}`}>
                  {formatTimeAgo(activity.createdAt)}
                </p>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8">
            <p className="text-material-grey-600 dark:text-gray-400 text-sm">No recent activity</p>
          </div>
        )}

        <Button
          variant="ghost"
          className="w-full mt-4 text-sm text-material-blue-700 hover:text-material-blue-600"
          data-testid="button-view-all-activity"
        >
          View All Activity
        </Button>
      </CardContent>
    </Card>
  );
}
