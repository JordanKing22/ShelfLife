import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, ChefHat, Users, AlertTriangle, RefreshCw } from 'lucide-react';
import { PantryItem, UserProfile } from '@/pages/Index';
import { useToast } from '@/hooks/use-toast';
import { apiService } from '@/services/api';

interface GeneratedRecipe {
  recipeName: string;
  description: string;
  servingSize: string;
  ingredients: string[];
  instructions: string[];
  time?: string;
  difficulty?: 'Easy' | 'Medium' | 'Hard';
}

interface RecipeSuggestionsProps {
  items: PantryItem[];
  forceGenerate?: boolean;
  userProfile?: UserProfile | null;
}

const RecipeSuggestions: React.FC<RecipeSuggestionsProps> = ({ items, forceGenerate = false, userProfile }) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [recipes, setRecipes] = useState<GeneratedRecipe[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [lastTriggeredItems, setLastTriggeredItems] = useState<string[]>([]);
  const [lastGeneratedTime, setLastGeneratedTime] = useState<Date | null>(null);
  const [previousItemNames, setPreviousItemNames] = useState<string[]>([]);
  
  // Use ref to track current triggered items to avoid circular dependency
  const lastTriggeredItemsRef = useRef<string[]>([]);
  const isGeneratingRef = useRef(false);

  // Helper function to calculate days until expiry
  const getDaysUntilExpiry = (expiryDate: string) => {
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  // Build personalized prompt based on user preferences
  const buildPersonalizedPrompt = (availableIngredients: string) => {
    let prompt = '';
    
    // Base request
    if (availableIngredients) {
      prompt = `Create 3 recipes using these expiring ingredients: ${availableIngredients}. Include common pantry items.`;
    } else {
      prompt = `Create 3 recipes using common pantry ingredients.`;
    }

    // Add user preferences if available
    if (userProfile) {
      const preferences = [];
      
      // Dietary restrictions
      if (userProfile.dietaryPreferences && userProfile.dietaryPreferences.length > 0) {
        const dietaryReqs = userProfile.dietaryPreferences
          .filter(pref => pref !== 'No restrictions')
          .join(', ');
        if (dietaryReqs) {
          preferences.push(`dietary requirements: ${dietaryReqs}`);
        }
      }
      
      // Cooking style
      if (userProfile.cookingStyle) {
        preferences.push(`cooking style: ${userProfile.cookingStyle}`);
      }
      
      // Household size for serving portions
      if (userProfile.householdSize && userProfile.householdSize > 1) {
        preferences.push(`serves ${userProfile.householdSize} people`);
      }
      
      // Cooking goals
      if (userProfile.cookingGoals && userProfile.cookingGoals.length > 0) {
        const goals = userProfile.cookingGoals.join(', ');
        preferences.push(`focus on: ${goals}`);
      }
      
      // Add preferences to prompt
      if (preferences.length > 0) {
        prompt += ` Requirements: ${preferences.join(', ')}.`;
      }
    }
    
    // Add JSON format requirement
    prompt += ` Return JSON with recipeName, description, servingSize, ingredients[], instructions[].`;
    
    return prompt;
  };

  // Load existing recipes and state on component mount
  useEffect(() => {
    loadExistingRecipes();
    loadPersistedState();
  }, []);

  // Handle force generation when Recipe Ideas button is clicked
  useEffect(() => {
    if (forceGenerate && items.length > 0 && !loading) {
      console.log('Force generating recipes due to Recipe Ideas button click');
      isGeneratingRef.current = false; // Reset flag to allow generation
      generateRecipes();
    }
  }, [forceGenerate, items.length, loading]);

  const loadPersistedState = () => {
    try {
      const persistedTriggers = localStorage.getItem('shelflife-last-triggered-items');
      if (persistedTriggers) {
        setLastTriggeredItems(JSON.parse(persistedTriggers));
      }
    } catch (error) {
      console.error('Error loading persisted state:', error);
    }
  };

  const savePersistedState = (triggeredItems: string[]) => {
    try {
      localStorage.setItem('shelflife-last-triggered-items', JSON.stringify(triggeredItems));
    } catch (error) {
      console.error('Error saving persisted state:', error);
    }
  };

  // Update ref when state changes
  useEffect(() => {
    lastTriggeredItemsRef.current = lastTriggeredItems;
  }, [lastTriggeredItems]);

  // Auto-trigger recipe generation when conditions are met
  useEffect(() => {
    if (items.length === 0 || isGeneratingRef.current) return;

    // Count items by urgency status
    const criticalItems = items.filter(item => {
      const days = getDaysUntilExpiry(item.expiryDate);
      return days <= 1; // Critical: expires today or tomorrow
    });

    const expiringItems = items.filter(item => {
      const days = getDaysUntilExpiry(item.expiryDate);
      return days >= 2 && days <= 3; // Expiring: expires in 2-3 days
    });

    const urgentItems = [...criticalItems, ...expiringItems];
    const currentUrgentItemNames = urgentItems.map(item => item.name).sort();
    const currentAllItemNames = items.map(item => item.name).sort();

    // Check if we have new urgent items that weren't there before
    const hasNewUrgentItems = currentUrgentItemNames.some(name => !lastTriggeredItems.includes(name));
    
    // Check if any previously urgent items were removed (marked as used)
    const removedUrgentItems = lastTriggeredItems.filter(name => !currentAllItemNames.includes(name));
    const hasRemovedUrgentItems = removedUrgentItems.length > 0;
    
    // Only auto-generate if:
    // 1. We have urgent items AND (new urgent items OR removed urgent items)
    // 2. We're not currently loading
    // 3. We're not currently generating
    const shouldAutoGenerate = urgentItems.length > 0 && (hasNewUrgentItems || hasRemovedUrgentItems) && !isGeneratingRef.current;

    // Debug logging
    console.log('Recipe trigger check:', {
      urgentItemsCount: urgentItems.length,
      currentUrgentItems: currentUrgentItemNames,
      lastTriggeredItems,
      hasNewUrgentItems,
      removedUrgentItems,
      hasRemovedUrgentItems,
      shouldAutoGenerate,
      loading,
      recipesCount: recipes.length,
      isGenerating: isGeneratingRef.current
    });

    if (shouldAutoGenerate && !loading) {
      if (hasRemovedUrgentItems) {
        console.log(`Regenerating recipes due to removed items: ${removedUrgentItems.join(', ')}`);
      }
      if (hasNewUrgentItems) {
        console.log('New urgent items detected:', currentUrgentItemNames.filter(name => !lastTriggeredItems.includes(name)));
      }
      console.log(`Auto-generating recipes: ${criticalItems.length} critical items, ${expiringItems.length} expiring items`);
      
      // Set flag to prevent double execution
      isGeneratingRef.current = true;
      
      const newTriggeredItems = currentUrgentItemNames;
      // Only update if items are actually different to prevent circular dependency
      const itemsAreDifferent = JSON.stringify(newTriggeredItems.sort()) !== JSON.stringify(lastTriggeredItems.sort());
      if (itemsAreDifferent) {
        setLastTriggeredItems(newTriggeredItems);
        savePersistedState(newTriggeredItems);
      }
      generateRecipes();
    }

    // Update previous item names for next comparison
    setPreviousItemNames(currentAllItemNames);
  }, [items, loading, lastTriggeredItems]); // Added lastTriggeredItems back but with better logic

  const loadExistingRecipes = async () => {
    try {
      const existingRecipes = await apiService.getRecipes();
      if (existingRecipes.length > 0) {
        // Get the most recent recipes (last 3)
        const recentRecipes = existingRecipes.slice(0, 3).map(recipe => ({
          recipeName: recipe.recipeName,
          description: recipe.description,
          servingSize: recipe.servingSize,
          ingredients: recipe.ingredients,
          instructions: recipe.instructions,
          time: recipe.time || '20-30 min',
          difficulty: recipe.difficulty || 'Easy' as const
        }));
        setRecipes(recentRecipes);
        
        // Set the last triggered items based on the most recent recipe
        if (existingRecipes[0].triggeredBy) {
          const triggeredItems = existingRecipes[0].triggeredBy;
          setLastTriggeredItems(triggeredItems);
          savePersistedState(triggeredItems);
        }
        
        // Set the last generated time from the most recent recipe
        if (existingRecipes[0].createdAt) {
          setLastGeneratedTime(new Date(existingRecipes[0].createdAt));
        }
      }
    } catch (error) {
      console.error('Error loading existing recipes:', error);
    }
  };

  const generateRecipes = async () => {
    setError('');
    setLoading(true);

    // Extract names from urgent items
    const urgentItems = items.filter(item => {
      const days = getDaysUntilExpiry(item.expiryDate);
      return days <= 1 || (days >= 2 && days <= 3); // Critical or expiring
    });
    const availableIngredients = urgentItems.map(item => item.name).join(', ');

    // Clear existing recipes only when generating new ones
    setRecipes([]);

    // Build personalized prompt based on user preferences
    const fullPrompt = buildPersonalizedPrompt(availableIngredients);
    
    // Debug log the enhanced prompt
    console.log('Enhanced recipe prompt:', fullPrompt);
    console.log('User preferences:', userProfile);

    const chatHistory = [{ role: 'user', parts: [{ text: fullPrompt }] }];

    const payload = {
      contents: chatHistory,
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.7,
        maxOutputTokens: 2048,
        responseSchema: {
          type: 'ARRAY',
          items: {
            type: 'OBJECT',
            properties: {
              recipeName: { type: 'STRING' },
              description: { type: 'STRING' },
              servingSize: { type: 'STRING' },
              ingredients: { type: 'ARRAY', items: { type: 'STRING' } },
              instructions: { type: 'ARRAY', items: { type: 'STRING' } },
            },
            required: ['recipeName', 'description', 'servingSize', 'ingredients', 'instructions']
          },
        },
      },
    };

    // Get API key from environment variable or use a fallback
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    try {
      // Add timeout for faster failure
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (
        result.candidates &&
        result.candidates.length > 0 &&
        result.candidates[0].content &&
        result.candidates[0].content.parts &&
        result.candidates[0].content.parts.length > 0
      ) {
        const jsonText = result.candidates[0].content.parts[0].text;
        const parsedRecipes = JSON.parse(jsonText);

        if (Array.isArray(parsedRecipes)) {
          // Add estimated time and difficulty to recipes, adjust serving size if needed
          const enhancedRecipes = parsedRecipes.slice(0, 3).map(recipe => {
            let servingSize = recipe.servingSize;
            
            // If user profile has household size and recipe doesn't specify the right amount, adjust
            if (userProfile?.householdSize && userProfile.householdSize > 1) {
              const householdSize = userProfile.householdSize;
              // Only adjust if the recipe doesn't already mention the household size
              if (!servingSize.includes(householdSize.toString())) {
                servingSize = `Serves ${householdSize}`;
              }
            }
            
            return {
              ...recipe,
              servingSize,
              time: '20-30 min',
              difficulty: 'Easy' as const
            };
          });
          setRecipes(enhancedRecipes);
          setLastGeneratedTime(new Date());
          
          // Save recipes to MongoDB
          const recipesToSave = enhancedRecipes.map(recipe => ({
            ...recipe,
            triggeredBy: urgentItems.map(item => item.name)
          }));
          await apiService.saveRecipes(recipesToSave);
          
          // Check if this was triggered by removed items
          const currentUrgentItems = items.filter(item => {
            const days = getDaysUntilExpiry(item.expiryDate);
            return days <= 3; // All urgent items
          });
          const removedItems = lastTriggeredItems.filter(name => 
            !items.map(item => item.name).includes(name)
          );
          
          const isRegeneratedDueToRemovedItems = removedItems.length > 0;
          
          toast({
            title: isRegeneratedDueToRemovedItems ? "Recipes Updated! 🔄" : "Recipes Generated! 🍳",
            description: isRegeneratedDueToRemovedItems 
              ? `Updated recipes after using ${removedItems.join(', ')}. Found ${enhancedRecipes.length} new suggestions!`
              : `Created ${enhancedRecipes.length} recipes using your expiring ingredients.`
          });
        } else {
          setError('Unexpected API response format. Please try again.');
        }
      } else {
        // Fallback recipes if API fails
        setRecipes(getFallbackRecipes(availableIngredients));
        setLastGeneratedTime(new Date());
        toast({
          title: "Using Fallback Recipes",
          description: "Generated backup recipes for your ingredients."
        });
      }
    } catch (err) {
      console.error('Error generating recipes:', err);
      // Use fallback recipes
      setRecipes(getFallbackRecipes(availableIngredients));
      setLastGeneratedTime(new Date());
      toast({
        title: "Using Backup Recipes",
        description: "API unavailable, showing curated recipes instead.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
      // Reset generation flag to allow future generations
      isGeneratingRef.current = false;
    }
  };

  const getFallbackRecipes = (availableIngredients: string): GeneratedRecipe[] => {
    const defaultServingSize = userProfile?.householdSize ? `Serves ${userProfile.householdSize}` : 'Serves 2-3';
    
    // Base fallback recipes
    const baseRecipes: GeneratedRecipe[] = [
      {
        recipeName: 'Quick Stir Fry',
        description: 'A fast and healthy way to use up vegetables and proteins.',
        servingSize: defaultServingSize,
        ingredients: ['Available vegetables', '2 tbsp oil', '2 cloves garlic', 'Soy sauce', 'Rice or noodles'],
        instructions: ['Heat oil in pan', 'Add garlic and vegetables', 'Stir-fry for 5-7 minutes', 'Add soy sauce', 'Serve over rice'],
        time: '15 min',
        difficulty: 'Easy' as const
      },
      {
        recipeName: 'Simple Soup',
        description: 'Comforting soup using whatever vegetables you have on hand.',
        servingSize: defaultServingSize,
        ingredients: ['Available vegetables', '4 cups broth', '1 onion', 'Salt and pepper', 'Herbs'],
        instructions: ['Sauté onion', 'Add vegetables and broth', 'Simmer 20 minutes', 'Season to taste', 'Serve hot'],
        time: '25 min',
        difficulty: 'Easy' as const
      },
      {
        recipeName: 'Pantry Pasta',
        description: 'Use up ingredients in a satisfying pasta dish.',
        servingSize: defaultServingSize,
        ingredients: ['8 oz pasta', 'Available proteins/vegetables', '2 tbsp olive oil', 'Garlic', 'Parmesan cheese'],
        instructions: ['Cook pasta', 'Sauté garlic and ingredients', 'Combine with pasta', 'Add cheese', 'Serve immediately'],
        time: '20 min',
        difficulty: 'Easy' as const
      }
    ];

    // Modify recipes based on dietary preferences
    if (userProfile?.dietaryPreferences?.includes('Vegetarian') || userProfile?.dietaryPreferences?.includes('Vegan')) {
      baseRecipes[0].ingredients = baseRecipes[0].ingredients.filter(ing => !ing.includes('proteins'));
      baseRecipes[2].ingredients = baseRecipes[2].ingredients.map(ing => 
        ing.includes('Parmesan cheese') ? 'Nutritional yeast or herbs' : ing
      );
    }

    if (userProfile?.dietaryPreferences?.includes('Gluten-free')) {
      baseRecipes[2].ingredients = baseRecipes[2].ingredients.map(ing => 
        ing.includes('pasta') ? 'Gluten-free pasta' : ing
      );
    }

    return baseRecipes;
  };

  const convertToUrlSlug = (recipeName: string): string => {
    return recipeName.toLowerCase().replace(/\s+/g, '-');
  };

  const handleRecipeClick = (recipe: GeneratedRecipe) => {
    // Save recipe click to MongoDB
    apiService.saveRecipeClick(recipe.recipeName);
    
    // Navigate to the recipe details page
    const urlSlug = convertToUrlSlug(recipe.recipeName);
    navigate(`/recipe/${urlSlug}`, { state: { recipe } });
  };

  const handleManualRefresh = () => {
    // Reset the last triggered items to force regeneration
    setLastTriggeredItems([]);
    savePersistedState([]);
    // Reset generation flag to allow manual refresh
    isGeneratingRef.current = false;
    generateRecipes();
  };

  const formatLastGeneratedTime = (time: Date | null) => {
    if (!time) return '';
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - time.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  const getDifficultyColor = (difficulty?: string) => {
    switch (difficulty) {
      case 'Easy': return 'bg-green-200 text-green-900 border-green-400';
      case 'Medium': return 'bg-amber-200 text-amber-900 border-amber-400';
      case 'Hard': return 'bg-red-200 text-red-900 border-red-400';
      default: return 'bg-gray-200 text-gray-900 border-gray-400';
    }
  };

  const criticalItems = items.filter(item => {
    const days = getDaysUntilExpiry(item.expiryDate);
    return days <= 1;
  });

  const expiringItems = items.filter(item => {
    const days = getDaysUntilExpiry(item.expiryDate);
    return days >= 2 && days <= 3;
  });

  const shouldShowAlert = criticalItems.length >= 1;

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold text-gray-800">
          🤖 AI Recipe Suggestions
        </h2>
        {recipes.length > 0 && (
          <div className="flex items-center gap-4">
            {lastGeneratedTime && (
              <span className="text-sm text-gray-500">
                Generated {formatLastGeneratedTime(lastGeneratedTime)}
              </span>
            )}
            <Button
              onClick={handleManualRefresh}
              disabled={loading}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        )}
      </div>

      {/* Auto-generation alert */}
      {shouldShowAlert && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
          <div className="flex items-center space-x-2 mb-2">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <h3 className="font-semibold text-red-800">⚡ Urgent Recipe Alert!</h3>
          </div>
          <p className="text-red-700 text-sm">
            You have <strong>{criticalItems.length} item{criticalItems.length > 1 ? 's' : ''}</strong> expiring very soon
            {expiringItems.length > 0 ? ` and ${expiringItems.length} item${expiringItems.length > 1 ? 's' : ''} expiring in 2-3 days` : ''}. 
            AI recipes have been generated to help you use these urgent ingredients!
          </p>
        </div>
      )}



      {/* Loading indicator */}
      {loading && (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          <p className="ml-3 text-blue-700">AI is cooking up ideas...</p>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
          <p className="font-semibold">Error:</p>
          <p>{error}</p>
        </div>
      )}

      {/* Display recipes */}
      {recipes.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {recipes.map((recipe, index) => (
            <Card 
              key={index}
              className="cursor-pointer hover:shadow-lg transition-all duration-200 transform hover:scale-105 border-2 hover:border-blue-300"
              onClick={() => handleRecipeClick(recipe)}
            >
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-semibold text-gray-800">
                  {recipe.recipeName}
                </CardTitle>
                <div className="flex items-center justify-between">
                  <div className="flex items-center text-sm text-gray-600">
                    <Clock className="w-4 h-4 mr-1" />
                    {recipe.time || '20-30 min'}
                  </div>
                  <Badge className={`text-xs font-medium ${getDifficultyColor(recipe.difficulty)}`}>
                    {recipe.difficulty || 'Easy'}
                  </Badge>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Users className="w-4 h-4 mr-1" />
                  {recipe.servingSize}
                </div>
              </CardHeader>
              
              <CardContent className="pt-0">
                <p className="text-sm text-gray-600 mb-3">
                  {recipe.description}
                </p>
                <p className="text-sm text-gray-500 mb-2">
                  <span className="font-medium">Key ingredients:</span> {recipe.ingredients.slice(0, 3).join(', ')}
                  {recipe.ingredients.length > 3 && '...'}
                </p>
                <p className="text-xs text-blue-600 font-medium">
                  🤖 AI Generated • Click for details →
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : !loading && items.length === 0 ? (
        <div className="text-center py-8">
          <ChefHat className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <p className="text-gray-500">Add some ingredients to your pantry to get AI-powered recipe suggestions!</p>
        </div>
      ) : !loading && (
        <div className="text-center py-8">
          <ChefHat className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <p className="text-gray-500">Recipes will automatically appear when ingredients are expiring soon!</p>
        </div>
      )}
    </div>
  );
};

export default RecipeSuggestions; 