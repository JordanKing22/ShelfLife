import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useToast } from '@/hooks/use-toast';
import ThemePicker from './ThemePicker';
import Logo from '@/components/ui/logo';
import { ChefHat, Leaf, TrendingUp, Mail, Lock, User } from 'lucide-react';

const LoginPage = () => {
  const { signInWithEmail, signUpWithEmail } = useAuth();
  const { currentTheme } = useTheme();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    confirmPassword: ''
  });



  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email || !formData.password) {
      toast({
        title: "Missing Information",
        description: "Please enter both email and password.",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);
      await signInWithEmail(formData.email, formData.password);
      toast({
        title: "Welcome back! 🎉",
        description: "You've successfully signed in."
      });
    } catch (error) {
      console.error('Sign in error:', error);
      toast({
        title: "Sign In Error",
        description: "Invalid email or password. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email || !formData.password || !formData.name) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Password Mismatch",
        description: "Passwords do not match. Please try again.",
        variant: "destructive"
      });
      return;
    }

    if (formData.password.length < 6) {
      toast({
        title: "Password Too Short",
        description: "Password must be at least 6 characters long.",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);
      await signUpWithEmail(formData.email, formData.password, formData.name);
      toast({
        title: "Account Created! 🎉",
        description: "Welcome to ShelfLife! Your account has been created."
      });
    } catch (error) {
      console.error('Sign up error:', error);
      toast({
        title: "Sign Up Error",
        description: "Failed to create account. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <div className={`min-h-screen ${currentTheme.colors.background} flex flex-col items-center justify-center p-4 relative`}>
      <div className="fixed top-4 right-4 z-40">
        <ThemePicker />
      </div>
      
      <div className="max-w-6xl mx-auto text-center">
        {/* Logo & Header */}
        <div className="mb-8 animate-fade-in">
          <div className="mb-6">
            <Logo size="xl" />
          </div>
          <p className="text-2xl text-gray-700 mb-2">
            Your friendly kitchen companion
          </p>
          <p className={`text-lg ${currentTheme.colors.textSecondary} max-w-2xl mx-auto`}>
            Transform your kitchen into a waste-free haven! Track expiry dates, 
            get gentle reminders, and celebrate every meal that saves food from the bin.
          </p>
        </div>

        {/* Feature Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <Card className={`border-none shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 ${currentTheme.colors.cardBackground} backdrop-blur-sm`}>
            <CardContent className="p-6 text-center">
              <div className={`w-16 h-16 ${currentTheme.colors.secondary} rounded-full flex items-center justify-center mx-auto mb-4`}>
                <Leaf className={`h-8 w-8 ${currentTheme.colors.fresh}`} />
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">
                Smart Tracking
              </h3>
              <p className="text-gray-600">
                Color-coded system shows what's fresh, expiring, or needs attention
              </p>
            </CardContent>
          </Card>

          <Card className={`border-none shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 ${currentTheme.colors.cardBackground} backdrop-blur-sm`}>
            <CardContent className="p-6 text-center">
              <div className={`w-16 h-16 ${currentTheme.colors.secondary} rounded-full flex items-center justify-center mx-auto mb-4`}>
                <ChefHat className={`h-8 w-8 ${currentTheme.colors.expiring}`} />
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">
                Recipe Suggestions
              </h3>
              <p className="text-gray-600">
                AI-powered recipes based on your expiring ingredients
              </p>
            </CardContent>
          </Card>

          <Card className={`border-none shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 ${currentTheme.colors.cardBackground} backdrop-blur-sm`}>
            <CardContent className="p-6 text-center">
              <div className={`w-16 h-16 ${currentTheme.colors.secondary} rounded-full flex items-center justify-center mx-auto mb-4`}>
                <TrendingUp className={`h-8 w-8 ${currentTheme.colors.primary.replace('bg-', 'text-')}`} />
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">
                Reduce Waste
              </h3>
              <p className="text-gray-600">
                Track your progress and feel good about reducing food waste
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Login Card */}
        <Card className={`max-w-md mx-auto ${currentTheme.colors.cardBackground} shadow-2xl border-none`}>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-gray-800">
              Sign In to Continue
            </CardTitle>
            <p className="text-gray-600">
              Secure your pantry data with your account
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <Tabs defaultValue="signin" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signin">Sign In</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>
              
              <TabsContent value="signin" className="space-y-4 mt-4">
                <form onSubmit={handleEmailSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="Enter your email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="password"
                        name="password"
                        type="password"
                        placeholder="Enter your password"
                        value={formData.password}
                        onChange={handleInputChange}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>
                  <Button
                    type="submit"
                    disabled={loading}
                    className={`w-full ${currentTheme.colors.primary} ${currentTheme.colors.primaryHover} text-white py-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105`}
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Signing In...
                      </>
                    ) : (
                      'Sign In'
                    )}
                  </Button>
                </form>
              </TabsContent>
              
              <TabsContent value="signup" className="space-y-4 mt-4">
                <form onSubmit={handleEmailSignUp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="name"
                        name="name"
                        type="text"
                        placeholder="Enter your full name"
                        value={formData.name}
                        onChange={handleInputChange}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="signup-email"
                        name="email"
                        type="email"
                        placeholder="Enter your email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="signup-password"
                        name="password"
                        type="password"
                        placeholder="Create a password (min 6 chars)"
                        value={formData.password}
                        onChange={handleInputChange}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">Confirm Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="confirm-password"
                        name="confirmPassword"
                        type="password"
                        placeholder="Confirm your password"
                        value={formData.confirmPassword}
                        onChange={handleInputChange}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>
                  <Button
                    type="submit"
                    disabled={loading}
                    className={`w-full ${currentTheme.colors.primary} ${currentTheme.colors.primaryHover} text-white py-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105`}
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Creating Account...
                      </>
                    ) : (
                      'Create Account'
                    )}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
            
            <p className="text-xs text-gray-500 text-center mt-4">
              Your data is secure and only used to enhance your ShelfLife experience
            </p>
          </CardContent>
        </Card>

        {/* Community Stats */}
        <div className="mt-12 grid grid-cols-3 gap-6 max-w-2xl mx-auto">
          <div className="text-center">
            <div className={`text-3xl font-bold ${currentTheme.colors.text}`}>10K+</div>
            <div className="text-sm text-gray-500">Meals Saved</div>
          </div>
          <div className="text-center">
            <div className={`text-3xl font-bold ${currentTheme.colors.text}`}>5K+</div>
            <div className="text-sm text-gray-500">Happy Users</div>
          </div>
          <div className="text-center">
            <div className={`text-3xl font-bold ${currentTheme.colors.text}`}>50%</div>
            <div className="text-sm text-gray-500">Less Waste</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage; 