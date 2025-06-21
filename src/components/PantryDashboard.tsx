
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle, Clock, AlertTriangle } from "lucide-react";
import { PantryItem } from "@/pages/Index";

interface PantryDashboardProps {
  items: PantryItem[];
  onMarkAsUsed: (itemId: string) => void;
}

const PantryDashboard = ({ items, onMarkAsUsed }: PantryDashboardProps) => {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'fresh':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'expiring':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'expired':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'fresh':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'expiring':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'expired':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getDaysUntilExpiry = (expiryDate: string) => {
    const today = new Date();
    const expiry = new Date(expiryDate);
    const daysUntilExpiry = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry;
  };

  const getExpiryText = (expiryDate: string, status: string) => {
    const days = getDaysUntilExpiry(expiryDate);
    
    if (status === 'expired') {
      return `Expired ${Math.abs(days)} day${Math.abs(days) !== 1 ? 's' : ''} ago`;
    } else if (days === 0) {
      return 'Expires today!';
    } else if (days === 1) {
      return 'Expires tomorrow';
    } else {
      return `Expires in ${days} days`;
    }
  };

  const sortedItems = [...items].sort((a, b) => {
    const statusOrder = { expired: 0, expiring: 1, fresh: 2 };
    return statusOrder[a.status] - statusOrder[b.status];
  });

  if (items.length === 0) {
    return (
      <Card className="max-w-md mx-auto bg-white/80 backdrop-blur-sm border-none shadow-lg">
        <CardContent className="p-8 text-center">
          <div className="text-6xl mb-4">🥪</div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">
            Your pantry is empty!
          </h3>
          <p className="text-gray-600">
            Start by adding your first ingredient to begin tracking expiry dates.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-2xl font-semibold text-gray-800 mb-6 text-center">
        Your Pantry Dashboard
      </h2>
      
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sortedItems.map((item) => (
          <Card 
            key={item.id} 
            className={`border-2 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 bg-white/90 backdrop-blur-sm ${
              item.status === 'expired' ? 'border-red-200' : 
              item.status === 'expiring' ? 'border-yellow-200' : 
              'border-green-200'
            }`}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold text-gray-800">
                  {item.name}
                </CardTitle>
                {getStatusIcon(item.status)}
              </div>
              <Badge 
                variant="outline" 
                className={`w-fit text-xs ${getStatusColor(item.status)}`}
              >
                {item.category}
              </Badge>
            </CardHeader>
            
            <CardContent className="pt-0">
              <div className="space-y-3">
                <div className="text-sm text-gray-600">
                  <span className="font-medium">Quantity:</span> {item.quantity} {item.unit}
                </div>
                
                <div className={`text-sm font-medium ${
                  item.status === 'expired' ? 'text-red-600' : 
                  item.status === 'expiring' ? 'text-yellow-600' : 
                  'text-green-600'
                }`}>
                  {getExpiryText(item.expiryDate, item.status)}
                </div>
                
                <Button 
                  onClick={() => onMarkAsUsed(item.id)}
                  className="w-full bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors duration-200"
                  size="sm"
                >
                  Mark as Used ✨
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default PantryDashboard;
