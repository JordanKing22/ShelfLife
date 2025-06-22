import { useState, useEffect } from "react";
import { Plus, LogOut, Home, ChefHat, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useToast } from "@/hooks/use-toast";
import WelcomeHero from "@/components/WelcomeHero";
import PantryDashboard from "@/components/PantryDashboard";
import AddItemModal from "@/components/AddItemModal";
import StatsCards from "@/components/StatsCards";
import ThemePicker from "@/components/ThemePicker";
import ReceiptScanner from "@/components/ReceiptScanner";
import RecipeSuggestions from "@/components/RecipeSuggestions";
import { apiService } from "@/services/api";
import OnboardingSurvey from "@/OnBoardingSurvey";
import { useNavigate } from "react-router-dom";

export interface PantryItem {
  id?: string;
  _id?: string;
  name: string;
  category: string;
  expiryDate: string;
  quantity: number;
  unit: string;
  addedDate?: string;
  status: 'fresh' | 'expiring' | 'critical' | 'expired';
  frozen?: boolean;
  originalExpiryDate?: string; // Store original expiry date before freezing
  createdAt?: Date;
  updatedAt?: Date;
}

export interface UserProfile {
  _id: string;
  email: string;
  name: string;
  full_name?: string;
  createdAt: Date;
  dietaryPreferences?: string[];
  cookingStyle?: string;
  cookingGoals?: string[];
  onboardingCompleted?: boolean;
  householdSize?: number;
}

const Index = () => {
  const { currentTheme } = useTheme();
  const { toast } = useToast();
  const { user, logout } = useAuth();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showAddItem, setShowAddItem] = useState(false);
  const [showRecipes, setShowRecipes] = useState(false);
  const [forceGenerateRecipes, setForceGenerateRecipes] = useState(false);
  const [pantryItems, setPantryItems] = useState<PantryItem[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savedItemsCount, setSavedItemsCount] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    
    loadPantryItems();
    fetchUserProfile();
    loadSavedItemsCount();
  }, [user]);

  // Load saved items count from localStorage
  const loadSavedItemsCount = () => {
    if (!user) return;
    const key = `savedItems_${user._id}`;
    const saved = localStorage.getItem(key);
    if (saved) {
      setSavedItemsCount(parseInt(saved, 10));
    }
  };

  // Save count to localStorage when it changes
  useEffect(() => {
    if (user && savedItemsCount > 0) {
      const key = `savedItems_${user._id}`;
      localStorage.setItem(key, savedItemsCount.toString());
    }
  }, [savedItemsCount, user]);

  // Check if user needs onboarding after profile is loaded
  // Only show onboarding for users who explicitly have onboardingCompleted: false
  // (new users), not for existing users who don't have this field
  useEffect(() => {
    if (userProfile && userProfile.onboardingCompleted === false) {
      setShowOnboarding(true);
    }
  }, [userProfile]);

  const fetchUserProfile = async () => {
    if (!user) return;
    
    try {
      // Fetch complete user profile from MongoDB
      const response = await fetch(`http://localhost:3001/api/users/${user._id}`, {
        headers: {
          'x-user-id': user._id.toString(),
        },
      });
      
      if (response.ok) {
        const fullProfile = await response.json();
        setUserProfile(fullProfile);
      } else {
        // Fallback to basic profile with defaults
        setUserProfile({
          _id: user._id,
          email: user.email,
          name: user.name,
          full_name: user.name,
          createdAt: user.createdAt,
          dietaryPreferences: [],
          cookingStyle: '',
          cookingGoals: [],
          onboardingCompleted: false,
          householdSize: 1
        });
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      // Set basic profile on error
      setUserProfile({
        _id: user._id,
        email: user.email,
        name: user.name,
        full_name: user.name,
        createdAt: user.createdAt,
        dietaryPreferences: [],
        cookingStyle: '',
        cookingGoals: [],
        onboardingCompleted: false,
        householdSize: 1
      });
    }
  };

  const loadPantryItems = async () => {
    try {
      setLoading(true);
      const items = await apiService.getPantryItems();
      const itemsWithStatus = items.map(item => ({
        ...item,
        status: getItemStatus(item.expiryDate)
      }));
      setPantryItems(itemsWithStatus);
    } catch (error) {
      console.error('Error loading pantry items:', error);
      toast({
        title: "Error Loading Items",
        description: "Failed to load pantry items from database. Using local storage.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = async (item: Omit<PantryItem, 'id' | 'addedDate' | 'status'>) => {
    try {
      // Check if an item with the same name already exists
      const existingItem = pantryItems.find(
        existingItem => existingItem.name.toLowerCase() === item.name.toLowerCase()
      );

      if (existingItem) {
        // Update the existing item's quantity
        const updatedQuantity = existingItem.quantity + item.quantity;
        await apiService.updatePantryItem(existingItem._id || existingItem.id!, {
          quantity: updatedQuantity,
          // Update expiry date if the new item has a later expiry (fresher)
          expiryDate: new Date(item.expiryDate) > new Date(existingItem.expiryDate) 
            ? item.expiryDate 
            : existingItem.expiryDate
        });
        
        // Update local state
        setPantryItems(prev => prev.map(pantryItem => 
          pantryItem._id === existingItem._id || pantryItem.id === existingItem.id
            ? { 
                ...pantryItem, 
                quantity: updatedQuantity,
                expiryDate: new Date(item.expiryDate) > new Date(existingItem.expiryDate) 
                  ? item.expiryDate 
                  : existingItem.expiryDate,
                status: getItemStatus(
                  new Date(item.expiryDate) > new Date(existingItem.expiryDate) 
                    ? item.expiryDate 
                    : existingItem.expiryDate
                )
              }
            : pantryItem
        ));
        
        toast({
          title: "Item Updated! 📦",
          description: `${item.name} quantity updated to ${updatedQuantity} ${item.unit}.`
        });
      } else {
        // Add new item as before
        const newItem = await apiService.addPantryItem({
          ...item,
          status: getItemStatus(item.expiryDate)
        });
        setPantryItems(prev => [...prev, { ...newItem, status: getItemStatus(newItem.expiryDate) }]);
        
        toast({
          title: "Item Added! 🎉",
          description: `${item.name} has been added to your pantry.`
        });
      }
      
      setShowAddItem(false);
    } catch (error) {
      console.error('Error adding item:', error);
      toast({
        title: "Error Adding Item",
        description: "Failed to add item to database. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleReceiptItems = async (items: Omit<PantryItem, 'id' | 'addedDate' | 'status'>[]) => {
    try {
      let addedCount = 0;
      let updatedCount = 0;
      let currentPantryItems = [...pantryItems]; // Local copy to track changes
      
      for (const item of items) {
        // Check if an item with the same name already exists in current items
        const existingItemIndex = currentPantryItems.findIndex(
          existingItem => existingItem.name.toLowerCase() === item.name.toLowerCase()
        );

        if (existingItemIndex !== -1) {
          const existingItem = currentPantryItems[existingItemIndex];
          // Update the existing item's quantity
          const updatedQuantity = existingItem.quantity + item.quantity;
          const updatedExpiryDate = new Date(item.expiryDate) > new Date(existingItem.expiryDate) 
            ? item.expiryDate 
            : existingItem.expiryDate;
            
          await apiService.updatePantryItem(existingItem._id || existingItem.id!, {
            quantity: updatedQuantity,
            expiryDate: updatedExpiryDate
          });
          
          // Update the local copy
          currentPantryItems[existingItemIndex] = {
            ...existingItem,
            quantity: updatedQuantity,
            expiryDate: updatedExpiryDate,
            status: getItemStatus(updatedExpiryDate)
          };
          
          updatedCount++;
        } else {
          // Add new item
          const newItem = await apiService.addPantryItem({
            ...item,
            status: getItemStatus(item.expiryDate)
          });
          const newItemWithStatus = { ...newItem, status: getItemStatus(newItem.expiryDate) };
          currentPantryItems.push(newItemWithStatus);
          addedCount++;
        }
      }
      
      // Update the state with all changes at once
      setPantryItems(currentPantryItems);
      
      // Show appropriate toast message
      if (addedCount > 0 && updatedCount > 0) {
        toast({
          title: "Receipt Processed! 📄",
          description: `Added ${addedCount} new items and updated ${updatedCount} existing items.`
        });
      } else if (addedCount > 0) {
        toast({
          title: "Receipt Processed! 📄",
          description: `Added ${addedCount} new items from your receipt.`
        });
      } else if (updatedCount > 0) {
        toast({
          title: "Receipt Processed! 📄",
          description: `Updated quantities for ${updatedCount} existing items.`
        });
      } else {
        toast({
          title: "Receipt Processed! 📄",
          description: "No new items were found on the receipt."
        });
      }
    } catch (error) {
      console.error('Error adding receipt items:', error);
      toast({
        title: "Error Processing Receipt",
        description: "Failed to save some items. Please try again.",
        variant: "destructive"
      });
    }
  };

  const getItemStatus = (expiryDate: string): 'fresh' | 'expiring' | 'critical' | 'expired' => {
    const today = new Date();
    const expiry = new Date(expiryDate);
    const daysUntilExpiry = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilExpiry < 0) return 'expired';    // Gross green - already expired
    if (daysUntilExpiry <= 1) return 'critical';  // Red - 1 day or less (includes today)
    if (daysUntilExpiry <= 3) return 'expiring';  // Yellow - 2-3 days
    return 'fresh';                               // Green - more than 3 days
  };

  const handleMarkAsUsed = async (itemId: string) => {
    try {
      // Find the item to check if it was expiring/critical (saved from waste)
      const item = pantryItems.find(item => item._id === itemId || item.id === itemId);
      const wasSaved = item && (item.status === 'expiring' || item.status === 'critical');
      
      await apiService.deletePantryItem(itemId);
      setPantryItems(items => items.filter(item => (item.id !== itemId && item._id !== itemId)));
      
      // Increment saved count if this was an expiring/critical item
      if (wasSaved) {
        setSavedItemsCount(prev => prev + 1);
        toast({
          title: "Food Saved! 🎉✅",
          description: `Great job! You prevented ${item.name} from going to waste!`
        });
      } else {
        toast({
          title: "Item Used! ✅",
          description: "Thanks for keeping your pantry organized!"
        });
      }
    } catch (error) {
      console.error('Error removing item:', error);
      toast({
        title: "Error",
        description: "Failed to remove item. Please try again.",
        variant: "destructive"
      });
    }
  };

  const calculateFrozenExpiryDate = (originalExpiryDate: string, category: string): string => {
    const originalDate = new Date(originalExpiryDate);
    const today = new Date();
    
    // Calculate how many days were remaining until expiry
    const daysRemaining = Math.ceil((originalDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    // Freezing extends shelf life based on food category
    const freezerExtensionDays = {
      'meat': 90,        // 3 months
      'poultry': 90,     // 3 months  
      'seafood': 60,     // 2 months
      'dairy': 30,       // 1 month
      'vegetables': 240, // 8 months
      'fruits': 240,     // 8 months
      'bread': 90,       // 3 months
      'leftovers': 90,   // 3 months
      'prepared': 90,    // 3 months
      'other': 90        // 3 months default
    };
    
    const extensionDays = freezerExtensionDays[category.toLowerCase()] || freezerExtensionDays.other;
    
    // New expiry date = today + remaining days + freezer extension
    const newExpiryDate = new Date(today);
    newExpiryDate.setDate(today.getDate() + Math.max(daysRemaining, 0) + extensionDays);
    
    return newExpiryDate.toISOString().split('T')[0];
  };

  const handleFreezeItem = async (itemId: string) => {
    try {
      const item = pantryItems.find(item => item._id === itemId || item.id === itemId);
      if (!item) return;

      if (item.frozen) {
        // Unfreeze the item - restore original expiry date
        const originalExpiry = item.originalExpiryDate || item.expiryDate;
        await apiService.updatePantryItem(itemId, {
          frozen: false,
          expiryDate: originalExpiry,
          originalExpiryDate: undefined
        });
        
        // Update local state
        setPantryItems(prev => prev.map(pantryItem => 
          (pantryItem._id === itemId || pantryItem.id === itemId)
            ? { 
                ...pantryItem, 
                frozen: false,
                expiryDate: originalExpiry,
                originalExpiryDate: undefined,
                status: getItemStatus(originalExpiry)
              }
            : pantryItem
        ));
        
        toast({
          title: "Item Unfrozen! ❄️➡️🌡️",
          description: `${item.name} has been moved back to regular storage.`
        });
      } else {
        // Freeze the item - extend expiry date
        const newExpiryDate = calculateFrozenExpiryDate(item.expiryDate, item.category);
        await apiService.updatePantryItem(itemId, {
          frozen: true,
          originalExpiryDate: item.expiryDate,
          expiryDate: newExpiryDate
        });
        
        // Update local state
        setPantryItems(prev => prev.map(pantryItem => 
          (pantryItem._id === itemId || pantryItem.id === itemId)
            ? { 
                ...pantryItem, 
                frozen: true,
                originalExpiryDate: item.expiryDate,
                expiryDate: newExpiryDate,
                status: getItemStatus(newExpiryDate)
              }
            : pantryItem
        ));
        
        toast({
          title: "Item Frozen! ❄️",
          description: `${item.name} has been frozen and expiry date extended.`
        });
      }
    } catch (error) {
      console.error('Error freezing/unfreezing item:', error);
      toast({
        title: "Error",
        description: "Failed to update item. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleSignOut = async () => {
    try {
      await logout();
      toast({
        title: "Signed Out",
        description: "You've been successfully signed out."
      });
    } catch (error) {
      console.error('Sign out error:', error);
      toast({
        title: "Sign Out Error",
        description: "Failed to sign out. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleItemAdded = async (item: Omit<PantryItem, 'id' | 'addedDate' | 'status'>) => {
    await handleAddItem(item);
  };

  const handleRecipeClick = () => {
    setShowRecipes(true);
    setForceGenerateRecipes(true);
    // Scroll to bottom of the page smoothly after a brief delay to allow recipes to render
    setTimeout(() => {
      window.scrollTo({
        top: document.documentElement.scrollHeight,
        behavior: 'smooth'
      });
    }, 100);
    // Reset force flag after a brief delay
    setTimeout(() => {
      setForceGenerateRecipes(false);
    }, 500);
  };

  // Get expiring items (within 3 days)
  const getExpiringItems = () => {
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
    
    return pantryItems.filter(item => {
      const expiryDate = new Date(item.expiryDate);
      return expiryDate <= threeDaysFromNow && item.status !== 'expired';
    });
  };

  const expiringItems = getExpiringItems();

  if (loading) {
    return (
      <div className={`min-h-screen ${currentTheme.colors.background} flex items-center justify-center`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className={`${currentTheme.colors.text}`}>Loading your pantry...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`min-h-screen ${currentTheme.colors.background} flex items-center justify-center`}>
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  if (showOnboarding) {
    return <OnboardingSurvey 
      onComplete={() => {
        setShowOnboarding(false);
        // Refresh user profile after onboarding
        fetchUserProfile();
      }}
      onCancel={() => {
        setShowOnboarding(false);
      }}
    />;
  }

  return (
    <div className={`min-h-screen ${currentTheme.colors.background} relative`}>
      {/* Navigation Bar */}
      <div className="fixed top-4 left-4 right-4 z-40 flex justify-between items-center">
        <Button
          onClick={() => window.location.reload()}
          variant="ghost"
          className="text-gray-600 hover:text-gray-800"
          size="sm"
        >
          <Home className="h-4 w-4 mr-2" />
          Refresh Dashboard
        </Button>
        
        <div className="flex items-center gap-3">
          {expiringItems.length > 0 && (
            <Button
              onClick={handleRecipeClick}
              className="bg-orange-500 hover:bg-orange-600 text-white"
              size="sm"
            >
              <ChefHat className="h-4 w-4 mr-2" />
              Recipe Ideas ({expiringItems.length})
            </Button>
          )}
          <Button
            onClick={() => setShowOnboarding(true)}
            variant="ghost"
            className="text-gray-600 hover:text-gray-800"
            size="sm"
          >
            <Users className="h-4 w-4 mr-2" />
            Update Preferences
          </Button>
          <ThemePicker />
          <Button
            onClick={handleSignOut}
            variant="ghost"
            className="text-gray-600 hover:text-gray-800"
            size="sm"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </div>
      
      <div className="container mx-auto px-4 py-6 pt-16">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="mb-4">
              <div className="inline-block p-4 rounded-full bg-gradient-to-br from-green-400 to-green-600 shadow-lg">
                <div className="text-white text-4xl font-bold">
                  🥬 ShelfLife
                </div>
              </div>
            </div>
            <h1 className={`text-4xl font-bold ${currentTheme.colors.text} mb-4`}>
              Your Smart Kitchen
            </h1>
            <p className={`text-xl ${currentTheme.colors.textSecondary} mb-6`}>
              Hello, {userProfile?.full_name || 'Chef'}! Ready to cook smart? ✨
            </p>
          </div>

                    {/* Stats Cards */}
          <StatsCards items={pantryItems} savedItemsCount={savedItemsCount} />
          
          {/* Action Buttons */}
          <div className="flex gap-4 justify-center mb-8">
            <Button
              onClick={() => setShowAddItem(true)}
              className={`${currentTheme.colors.primary} ${currentTheme.colors.primaryHover} text-white px-6 py-3 text-lg rounded-full shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105`}
            >
              <Plus className="h-5 w-5 mr-2" />
              Add Food Item
            </Button>
            
            <ReceiptScanner onItemsExtracted={handleReceiptItems} />
          </div>

          {/* Main Dashboard */}
          <PantryDashboard 
            items={pantryItems} 
            onMarkAsUsed={handleMarkAsUsed}
            onFreezeItem={handleFreezeItem}
          />

          {/* Add Item Modal */}
          <AddItemModal 
            isOpen={showAddItem}
            onClose={() => setShowAddItem(false)}
            onAddItem={handleItemAdded}
          />

          {showRecipes && (
            <RecipeSuggestions
              items={pantryItems}
              forceGenerate={forceGenerateRecipes}
              userProfile={userProfile}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default Index;
