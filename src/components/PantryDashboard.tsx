import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle, Clock, AlertTriangle, Trash2, Snowflake } from "lucide-react";
import { PantryItem } from "@/pages/Index";

interface PantryDashboardProps {
  items: PantryItem[];
  onMarkAsUsed: (itemId: string) => void;
  onFreezeItem: (itemId: string) => void;
}

const PantryDashboard = ({ items, onMarkAsUsed, onFreezeItem }: PantryDashboardProps) => {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'fresh':
        return <CheckCircle className="h-4 w-4 text-green-700" />;
      case 'expiring':
        return <Clock className="h-4 w-4 text-amber-600" />;
      case 'critical':
        return <AlertTriangle className="h-4 w-4 text-red-700" />;
      case 'expired':
        return <AlertTriangle className="h-4 w-4 text-green-800" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'fresh':
        return 'bg-green-200 text-green-900 border-green-400';
      case 'expiring':
        return 'bg-amber-200 text-amber-900 border-amber-400';
      case 'critical':
        return 'bg-red-200 text-red-900 border-red-400';
      case 'expired':
        return 'bg-green-800 text-green-100 border-green-900';
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

  const shouldShowThrowAway = (expiryDate: string, status: string) => {
    const daysUntilExpiry = getDaysUntilExpiry(expiryDate);
    return status === 'expired' && daysUntilExpiry < -3; // Expired more than 3 days ago
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

  const canItemBeFreezed = (category: string, name: string): boolean => {
    const freezableCategories = [
      'meat',
      'poultry', 
      'seafood',
      'vegetables',
      'fruits',
      'bread',
      'leftovers',
      'prepared',
      'grains',
      'pasta',
      'rice',
      'beans',
      'nuts',
      'seeds',
      'herbs',
      'spices',
      'frozen',
      'bakery'
    ];

    // Items that generally shouldn't be frozen
    const nonFreezableItems = [
      'eggs',
      'milk',
      'yogurt',
      'cheese',
      'cream',
      'butter',
      'lettuce',
      'cucumber',
      'tomatoes',
      'potatoes',
      'onions',
      'garlic',
      'avocado',
      'bananas',
      'citrus',
      'mayo',
      'mayonnaise',
      'sour cream',
      'cottage cheese',
      'ricotta',
      'cream cheese'
    ];

    const categoryLower = category.toLowerCase();
    const nameLower = name.toLowerCase();

    // Check if the item name contains any non-freezable keywords
    const containsNonFreezable = nonFreezableItems.some(item => 
      nameLower.includes(item) || item.includes(nameLower)
    );

    if (containsNonFreezable) {
      return false;
    }

    // Check if category is generally freezable
    return freezableCategories.includes(categoryLower);
  };

  const sortedItems = [...items].sort((a, b) => {
    const statusOrder = { expired: 0, critical: 1, expiring: 2, fresh: 3 };
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
      
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 items-stretch">
        {sortedItems.map((item) => {
          const showThrowAway = shouldShowThrowAway(item.expiryDate, item.status);
          
          return (
            <Card 
              key={item._id || item.id} 
              className={`border-2 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 bg-white/90 backdrop-blur-sm h-full flex flex-col ${
                item.status === 'expired' ? 'border-green-800 bg-green-50' : 
                item.status === 'critical' ? 'border-red-400 bg-red-50' : 
                item.status === 'expiring' ? 'border-amber-400 bg-amber-50' : 
                'border-green-400 bg-green-50'
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
                  className={`w-fit text-xs font-medium ${getStatusColor(item.status)}`}
                >
                  {item.category}
                </Badge>
              </CardHeader>
              
              <CardContent className="pt-0 flex-1 flex flex-col">
                <div className="space-y-3 flex-1 flex flex-col justify-between">
                  {/* Item Details - Top Section */}
                  <div className="space-y-3">
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">Quantity:</span> {item.quantity} {item.unit}
                    </div>
                    
                    <div className={`text-sm font-bold ${
                      item.status === 'expired' ? 'text-green-800' : 
                      item.status === 'critical' ? 'text-red-700' : 
                      item.status === 'expiring' ? 'text-amber-700' : 
                      'text-green-700'
                    }`}>
                      {getExpiryText(item.expiryDate, item.status)}
                      {item.frozen && (
                        <div className="text-blue-600 text-xs mt-1 flex items-center">
                          <Snowflake className="h-3 w-3 mr-1" />
                          Frozen (Extended shelf life)
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Buttons - Bottom Section */}
                  <div className="space-y-2">
                    {/* Freeze/Unfreeze Button */}
                    {canItemBeFreezed(item.category, item.name) && (
                      <Button 
                        onClick={() => item._id && onFreezeItem(item._id)}
                        className={`w-full ${
                          item.frozen 
                            ? 'bg-blue-600 hover:bg-blue-700' 
                            : 'bg-blue-500 hover:bg-blue-600'
                        } text-white rounded-lg transition-colors duration-200`}
                        size="sm"
                      >
                        <Snowflake className="h-4 w-4 mr-2" />
                        {item.frozen ? 'Unfreeze ❄️➡️🌡️' : 'Freeze ❄️'}
                      </Button>
                    )}
                    
                    {/* Mark as Used/Throw Away Button */}
                    {showThrowAway ? (
                      <Button 
                        onClick={() => item._id && onMarkAsUsed(item._id)}
                        className="w-full bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors duration-200"
                        size="sm"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Throw Away 🗑️
                      </Button>
                    ) : (
                      <Button 
                        onClick={() => item._id && onMarkAsUsed(item._id)}
                        className="w-full bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors duration-200"
                        size="sm"
                      >
                        Mark as Used ✨
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default PantryDashboard;
