import { useLocation, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ChefHat, Clock, Users } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import ThemePicker from '@/components/ThemePicker';

const RecipeDetails = () => {
  const location = useLocation();
  const { currentTheme } = useTheme();
  const { recipe } = location.state || {};

  if (!recipe) {
    return (
      <div className={`min-h-screen ${currentTheme.colors.background} text-center p-8`}>
        <h2 className="text-2xl font-bold text-red-500">Recipe not found!</h2>
        <p className="mt-4 text-lg">
          Please go back and select a recipe to view.
        </p>
        <Button asChild className="mt-6">
          <Link to="/">
            <ArrowLeft className="mr-2 h-4 w-4" /> Go Back to Pantry
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${currentTheme.colors.background} relative`}>
      <ThemePicker />

      <div className="container mx-auto px-4 py-6">
        <div className="text-center mb-8">
          <h1 className={`text-4xl font-bold ${currentTheme.colors.text} mb-2`}>🥬 ShelfLife</h1>
          <p className={`text-lg ${currentTheme.colors.textSecondary}`}>Your friendly kitchen companion</p>
        </div>
        
        <div className="max-w-4xl mx-auto">
          <Button asChild variant="outline" className="mb-6">
            <Link to="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Pantry
            </Link>
          </Button>

          <Card className="overflow-hidden shadow-lg border-2">
            <CardHeader className="bg-gray-50 dark:bg-gray-800 p-6">
              <CardTitle className="text-3xl font-bold text-gray-800 dark:text-gray-100">{recipe.recipeName}</CardTitle>
              <p className="text-gray-600 dark:text-gray-300 mt-2">{recipe.description}</p>
              <div className="flex items-center justify-start gap-6 text-sm text-gray-500 dark:text-gray-400 mt-4">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  <span>{recipe.time || '25 min'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <ChefHat className="w-5 h-5" />
                  <span>{recipe.difficulty || 'Easy'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  <span>{recipe.servingSize}</span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6 grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-xl font-semibold mb-4 text-gray-700 dark:text-gray-200">Ingredients</h3>
                <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-300">
                  {recipe.ingredients.map((ingredient: string, index: number) => (
                    <li key={index}>{ingredient}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-4 text-gray-700 dark:text-gray-200">Instructions</h3>
                <ol className="list-decimal list-inside space-y-3 text-gray-600 dark:text-gray-300">
                  {recipe.instructions.map((instruction: string, index: number) => (
                    <li key={index}>{instruction}</li>
                  ))}
                </ol>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default RecipeDetails; 