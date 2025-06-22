import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Users, Heart, ChefHat, ArrowLeft } from 'lucide-react';
import Logo from '@/components/ui/logo';

interface OnboardingSurveyProps {
  onComplete: () => void;
  onCancel?: () => void;
}

const OnboardingSurvey = ({ onComplete, onCancel }: OnboardingSurveyProps) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [householdSize, setHouseholdSize] = useState('');
  const [dietaryPreferences, setDietaryPreferences] = useState<string[]>([]);
  const [cookingStyle, setCookingStyle] = useState('');
  const [cookingGoals, setCookingGoals] = useState<string[]>([]);
  
  const { user } = useAuth();
  const { currentTheme } = useTheme();
  const { toast } = useToast();

  const dietaryOptions = [
    'Vegetarian', 'Vegan', 'Halal', 'Kosher', 'Gluten-free', 
    'Dairy-free', 'Keto', 'Paleo', 'No restrictions'
  ];

  const cookingStyleOptions = [
    'Quick meals (15-30 min)', 'Gourmet experiments', 'Family-friendly classics',
    'Meal prep focused', 'International cuisine', 'Healthy & light'
  ];

  const goalOptions = [
    'Reduce food waste', 'Save money', 'Eat healthier', 'Try new recipes',
    'Meal planning', 'Family bonding', 'Cooking skills'
  ];

  const toggleSelection = (item: string, currentList: string[], setter: (list: string[]) => void) => {
    if (currentList.includes(item)) {
      setter(currentList.filter(i => i !== item));
    } else {
      setter([...currentList, item]);
    }
  };

  const handleComplete = async () => {
    if (!user) {
      console.error('No user found');
      return;
    }
    
    console.log('User object:', user); // Debug user object
    console.log('Onboarding data:', {
      householdSize: parseInt(householdSize),
      dietaryPreferences,
      cookingStyle,
      cookingGoals,
    });
    
    setLoading(true);
    try {
      // Use the same API pattern as other endpoints
      const response = await fetch('http://localhost:3001/api/users/onboarding', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user._id.toString(),
        },
        body: JSON.stringify({
          householdSize: parseInt(householdSize),
          dietaryPreferences,
          cookingStyle,
          cookingGoals,
          onboardingCompleted: true,
        }),
      });

      console.log('Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error Response:', errorText);
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      const result = await response.json();
      console.log('Success result:', result);

      toast({
        title: "Welcome to your kitchen! 🎉",
        description: "Let's start tracking your pantry and saving food together!",
      });
      
      onComplete();
    } catch (error) {
      console.error('Error saving onboarding data:', error);
      toast({
        title: "Oops!",
        description: `Something went wrong: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => {
    if (step < 3) setStep(step + 1);
    else handleComplete();
  };

  const canProceed = () => {
    switch (step) {
      case 1: return householdSize !== '';
      case 2: return dietaryPreferences.length > 0;
      case 3: return cookingStyle !== '' && cookingGoals.length > 0;
      default: return false;
    }
  };

  return (
    <div className={`min-h-screen ${currentTheme.colors.background} flex items-center justify-center p-4`}>
      <div className="w-full max-w-2xl">
        {/* Go Back Button */}
        {onCancel && (
          <div className="mb-6">
            <Button
              variant="outline"
              onClick={onCancel}
              className="text-gray-600 hover:text-gray-800 border-gray-300 hover:border-green-500 hover:text-green-600 transition-colors duration-200"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
          </div>
        )}
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="mb-4">
            <Logo size="lg" />
          </div>
          <h1 className={`text-3xl font-bold ${currentTheme.colors.text} mb-2`}>
            Let's set up your kitchen!
          </h1>
          <p className={`text-lg ${currentTheme.colors.textSecondary}`}>
            Help us personalize your ShelfLife experience
          </p>
          <div className="flex justify-center mt-4 space-x-2">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className={`w-3 h-3 rounded-full ${
                  i <= step ? 'bg-green-500' : 'bg-gray-300'
                }`}
              />
            ))}
          </div>
        </div>

        <Card className={`${currentTheme.colors.cardBackground} backdrop-blur-sm border-none shadow-xl`}>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-semibold text-gray-800 flex items-center justify-center">
              {step === 1 && <><Users className="mr-2 h-6 w-6 text-green-600" /> How many mouths are you feeding?</>}
              {step === 2 && <><Heart className="mr-2 h-6 w-6 text-green-600" /> Any dietary preferences?</>}
              {step === 3 && <><ChefHat className="mr-2 h-6 w-6 text-green-600" /> What's your cooking style?</>}
            </CardTitle>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {step === 1 && (
              <div className="space-y-4">
                <Label htmlFor="household" className="text-gray-700 text-lg">
                  Including yourself, how many people do you cook for?
                </Label>
                <Input
                  id="household"
                  type="number"
                  min="1"
                  max="20"
                  placeholder="e.g., 4"
                  value={householdSize}
                  onChange={(e) => setHouseholdSize(e.target.value)}
                  className="text-lg text-center border-gray-300 focus:border-green-500 focus:ring-green-500"
                />
                <p className="text-sm text-gray-500 text-center">
                  This helps us suggest appropriate portion sizes and quantities
                </p>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <p className="text-gray-700 text-lg text-center">
                  Select all that apply to anyone in your household:
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {dietaryOptions.map((option) => (
                    <Badge
                      key={option}
                      variant={dietaryPreferences.includes(option) ? "default" : "outline"}
                      className={`cursor-pointer text-center p-3 h-auto transition-all hover:scale-105 ${
                        dietaryPreferences.includes(option)
                          ? 'bg-green-500 hover:bg-green-600 text-white'
                          : 'hover:border-green-500 hover:text-green-600'
                      }`}
                      onClick={() => toggleSelection(option, dietaryPreferences, setDietaryPreferences)}
                    >
                      {option}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6">
                <div className="space-y-4">
                  <Label className="text-gray-700 text-lg">What's your cooking style?</Label>
                  <div className="grid grid-cols-1 gap-2">
                    {cookingStyleOptions.map((option) => (
                      <Badge
                        key={option}
                        variant={cookingStyle === option ? "default" : "outline"}
                        className={`cursor-pointer text-center p-3 h-auto transition-all hover:scale-105 ${
                          cookingStyle === option
                            ? 'bg-green-500 hover:bg-green-600 text-white'
                            : 'hover:border-green-500 hover:text-green-600'
                        }`}
                        onClick={() => setCookingStyle(option)}
                      >
                        {option}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <Label className="text-gray-700 text-lg">What are your cooking goals?</Label>
                  <div className="grid grid-cols-2 gap-3">
                    {goalOptions.map((goal) => (
                      <Badge
                        key={goal}
                        variant={cookingGoals.includes(goal) ? "default" : "outline"}
                        className={`cursor-pointer text-center p-3 h-auto transition-all hover:scale-105 ${
                          cookingGoals.includes(goal)
                            ? 'bg-green-500 hover:bg-green-600 text-white'
                            : 'hover:border-green-500 hover:text-green-600'
                        }`}
                        onClick={() => toggleSelection(goal, cookingGoals, setCookingGoals)}
                      >
                        {goal}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-between pt-6">
              {step > 1 && (
                <Button
                  variant="outline"
                  onClick={() => setStep(step - 1)}
                  className="border-gray-300 hover:border-green-500 hover:text-green-600"
                >
                  Back
                </Button>
              )}
              
              <Button
                onClick={nextStep}
                disabled={!canProceed() || loading}
                className={`ml-auto ${currentTheme.colors.primary} ${currentTheme.colors.primaryHover} text-white rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105`}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Setting up...
                  </>
                ) : (
                  <>
                    {step === 3 ? "Start Cooking! 🍳" : "Next"}
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default OnboardingSurvey;