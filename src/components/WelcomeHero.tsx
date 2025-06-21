
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ChefHat, Leaf, TrendingUp } from "lucide-react";

interface WelcomeHeroProps {
  onGetStarted: () => void;
}

const WelcomeHero = ({ onGetStarted }: WelcomeHeroProps) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-yellow-50 flex items-center justify-center p-4">
      <div className="max-w-4xl mx-auto text-center">
        <div className="mb-8 animate-fade-in">
          <h1 className="text-6xl font-bold text-green-800 mb-4">
            🥬 ShelfLife
          </h1>
          <p className="text-2xl text-gray-700 mb-2">
            Your friendly kitchen companion
          </p>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Transform your kitchen into a waste-free haven! Track expiry dates, 
            get gentle reminders, and celebrate every meal that saves food from the bin.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <Card className="border-none shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 bg-white/80 backdrop-blur-sm">
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Leaf className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">
                Smart Tracking
              </h3>
              <p className="text-gray-600">
                Color-coded system shows what's fresh, expiring, or needs attention
              </p>
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 bg-white/80 backdrop-blur-sm">
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <ChefHat className="h-8 w-8 text-yellow-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">
                Gentle Reminders
              </h3>
              <p className="text-gray-600">
                Friendly notifications help you use ingredients before they expire
              </p>
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 bg-white/80 backdrop-blur-sm">
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">
                Celebrate Wins
              </h3>
              <p className="text-gray-600">
                Track your food-saving progress and feel good about reducing waste
              </p>
            </CardContent>
          </Card>
        </div>

        <Button 
          onClick={onGetStarted}
          className="bg-green-600 hover:bg-green-700 text-white px-8 py-4 text-lg rounded-full shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
          size="lg"
        >
          Start Your Kitchen Journey ✨
        </Button>

        <p className="text-sm text-gray-500 mt-4">
          No signup required • Start tracking immediately
        </p>
      </div>
    </div>
  );
};

export default WelcomeHero;
