
import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import WelcomeHero from "@/components/WelcomeHero";
import PantryDashboard from "@/components/PantryDashboard";
import AddItemModal from "@/components/AddItemModal";
import StatsCards from "@/components/StatsCards";

export interface PantryItem {
  id: string;
  name: string;
  category: string;
  expiryDate: string;
  quantity: number;
  unit: string;
  addedDate: string;
  status: 'fresh' | 'expiring' | 'expired';
}

const Index = () => {
  const [showWelcome, setShowWelcome] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [pantryItems, setPantryItems] = useState<PantryItem[]>([
    {
      id: '1',
      name: 'Organic Milk',
      category: 'Dairy',
      expiryDate: '2025-06-25',
      quantity: 1,
      unit: 'carton',
      addedDate: '2025-06-20',
      status: 'expiring'
    },
    {
      id: '2',
      name: 'Fresh Spinach',
      category: 'Vegetables',
      expiryDate: '2025-06-23',
      quantity: 1,
      unit: 'bag',
      addedDate: '2025-06-19',
      status: 'expired'
    },
    {
      id: '3',
      name: 'Greek Yogurt',
      category: 'Dairy',
      expiryDate: '2025-06-28',
      quantity: 4,
      unit: 'cups',
      addedDate: '2025-06-18',
      status: 'fresh'
    }
  ]);

  const handleAddItem = (item: Omit<PantryItem, 'id' | 'addedDate' | 'status'>) => {
    const newItem: PantryItem = {
      ...item,
      id: Date.now().toString(),
      addedDate: new Date().toISOString().split('T')[0],
      status: getItemStatus(item.expiryDate)
    };
    setPantryItems([...pantryItems, newItem]);
    setShowAddModal(false);
  };

  const getItemStatus = (expiryDate: string): 'fresh' | 'expiring' | 'expired' => {
    const today = new Date();
    const expiry = new Date(expiryDate);
    const daysUntilExpiry = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilExpiry < 0) return 'expired';
    if (daysUntilExpiry <= 3) return 'expiring';
    return 'fresh';
  };

  const handleMarkAsUsed = (itemId: string) => {
    setPantryItems(items => items.filter(item => item.id !== itemId));
    // Here we could add celebration animation and update stats
  };

  if (showWelcome) {
    return <WelcomeHero onGetStarted={() => setShowWelcome(false)} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-green-800 mb-2">🥬 ShelfLife</h1>
          <p className="text-lg text-gray-600">Your friendly kitchen companion</p>
        </div>

        {/* Stats Cards */}
        <StatsCards items={pantryItems} />

        {/* Add Item Button */}
        <div className="flex justify-center mb-6">
          <Button 
            onClick={() => setShowAddModal(true)}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
            size="lg"
          >
            <Plus className="mr-2 h-5 w-5" />
            Add to Pantry
          </Button>
        </div>

        {/* Pantry Dashboard */}
        <PantryDashboard 
          items={pantryItems} 
          onMarkAsUsed={handleMarkAsUsed}
        />

        {/* Add Item Modal */}
        <AddItemModal 
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          onAddItem={handleAddItem}
        />
      </div>
    </div>
  );
};

export default Index;
