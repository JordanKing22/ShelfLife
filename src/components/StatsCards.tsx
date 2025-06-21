
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Package } from "lucide-react";
import { PantryItem } from "@/pages/Index";

interface StatsCardsProps {
  items: PantryItem[];
}

const StatsCards = ({ items }: StatsCardsProps) => {
  const freshItems = items.filter(item => item.status === 'fresh').length;
  const expiringItems = items.filter(item => item.status === 'expiring').length;
  const expiredItems = items.filter(item => item.status === 'expired').length;
  const totalItems = items.length;

  const savedPercentage = totalItems > 0 ? Math.round((freshItems / totalItems) * 100) : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
      <Card className="bg-white/80 backdrop-blur-sm border-none shadow-lg hover:shadow-xl transition-all duration-200">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">
            Total Items
          </CardTitle>
          <Package className="h-4 w-4 text-blue-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-gray-800">{totalItems}</div>
          <p className="text-xs text-gray-600 mt-1">
            in your pantry
          </p>
        </CardContent>
      </Card>

      <Card className="bg-white/80 backdrop-blur-sm border-none shadow-lg hover:shadow-xl transition-all duration-200">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">
            Food Saved
          </CardTitle>
          <TrendingUp className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">{savedPercentage}%</div>
          <p className="text-xs text-gray-600 mt-1">
            {freshItems} fresh items
          </p>
        </CardContent>
      </Card>

      <Card className="bg-white/80 backdrop-blur-sm border-none shadow-lg hover:shadow-xl transition-all duration-200">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">
            Needs Attention
          </CardTitle>
          <TrendingDown className="h-4 w-4 text-yellow-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-yellow-600">{expiringItems + expiredItems}</div>
          <p className="text-xs text-gray-600 mt-1">
            expiring or expired
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default StatsCards;
