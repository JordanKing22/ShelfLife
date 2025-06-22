import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Package, CheckCircle } from "lucide-react";
import { PantryItem } from "@/pages/Index";

interface StatsCardsProps {
  items: PantryItem[];
  savedItemsCount?: number; // Track items that were marked as used while expiring/critical
}

const StatsCards = ({ items, savedItemsCount = 0 }: StatsCardsProps) => {
  const freshItems = items.filter(item => item.status === 'fresh').length;
  const expiringItems = items.filter(item => item.status === 'expiring').length;
  const criticalItems = items.filter(item => item.status === 'critical').length;
  const expiredItems = items.filter(item => item.status === 'expired').length;
  const totalItems = items.length;

  // Use the actual saved items count passed from parent component
  // This tracks items that were marked as used while in expiring/critical status
  const foodSavedCount = savedItemsCount;
  const needsAttention = expiringItems + criticalItems + expiredItems;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
      <Card className="bg-white/80 backdrop-blur-sm border-none shadow-lg hover:shadow-xl transition-all duration-200">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">
            Total Items
          </CardTitle>
          <Package className="h-4 w-4 text-blue-700" />
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
          <CheckCircle className="h-4 w-4 text-green-700" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-700">{foodSavedCount}</div>
          <p className="text-xs text-gray-600 mt-1">
            {foodSavedCount === 1 ? 'item saved' : 'items saved'} from waste
          </p>
        </CardContent>
      </Card>

      <Card className="bg-white/80 backdrop-blur-sm border-none shadow-lg hover:shadow-xl transition-all duration-200">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">
            Needs Attention
          </CardTitle>
          <TrendingDown className={`h-4 w-4 ${criticalItems > 0 ? 'text-red-700' : 'text-amber-700'}`} />
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${criticalItems > 0 ? 'text-red-700' : 'text-amber-700'}`}>{needsAttention}</div>
          <p className="text-xs text-gray-600 mt-1">
            {criticalItems > 0 ? `${criticalItems} critical, ` : ''}{expiringItems + expiredItems > 0 ? `${expiringItems + expiredItems} expiring/expired` : 'none expiring'}
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default StatsCards;
