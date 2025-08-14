import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Car, CheckCircle, Facebook, AlertTriangle } from "lucide-react";

export default function StatsCards() {
  const { data: stats, isLoading } = useQuery<{
    totalVehicles: number;
    successfulScrapes: number;
    facebookPosts: number;
    failedExtractions: number;
  }>({
    queryKey: ["/api/dashboard/stats"],
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-gray-200 w-12 h-12"></div>
                <div className="ml-4 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-20"></div>
                  <div className="h-6 bg-gray-200 rounded w-16"></div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const statsData = [
    {
      title: "Total Vehicles",
      value: stats?.totalVehicles || 0,
      icon: Car,
      bgColor: "bg-material-blue-700 bg-opacity-10",
      iconColor: "text-material-blue-700",
      testId: "stat-total-vehicles",
    },
    {
      title: "Successfully Scraped",
      value: stats?.successfulScrapes || 0,
      icon: CheckCircle,
      bgColor: "bg-material-green-500 bg-opacity-10",
      iconColor: "text-material-green-500",
      testId: "stat-successful-scrapes",
    },
    {
      title: "FB Posts Created",
      value: stats?.facebookPosts || 0,
      icon: Facebook,
      bgColor: "bg-material-orange-700 bg-opacity-10",
      iconColor: "text-material-orange-700",
      testId: "stat-facebook-posts",
    },
    {
      title: "Failed Extractions",
      value: stats?.failedExtractions || 0,
      icon: AlertTriangle,
      bgColor: "bg-material-red-700 bg-opacity-10",
      iconColor: "text-material-red-700",
      testId: "stat-failed-extractions",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {statsData.map((stat) => (
        <Card key={stat.title} className="shadow-material">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className={`p-3 rounded-full ${stat.bgColor}`}>
                <stat.icon className={`${stat.iconColor} text-xl w-6 h-6`} />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-material-grey-600">{stat.title}</p>
                <p className="text-2xl font-bold text-gray-900" data-testid={stat.testId}>
                  {stat.value.toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
