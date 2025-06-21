
import { useState } from 'react';
import { Palette, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useTheme } from '@/contexts/ThemeContext';

const ThemePicker = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { currentTheme, setTheme, themes } = useTheme();

  return (
    <>
      {/* Theme Picker Button */}
      <Button
        onClick={() => setIsOpen(true)}
        className={`fixed top-4 right-4 z-40 ${currentTheme.colors.primary} ${currentTheme.colors.primaryHover} text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105`}
        size="sm"
      >
        <Palette className="h-4 w-4 mr-2" />
        Themes
      </Button>

      {/* Theme Picker Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <Card className="w-full max-w-md bg-white/95 backdrop-blur-sm border-none shadow-2xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-800">
                  Choose Your Kitchen Style ✨
                </h3>
                <Button
                  onClick={() => setIsOpen(false)}
                  variant="ghost"
                  size="sm"
                  className="hover:bg-gray-100 rounded-full p-2"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {themes.map((theme) => (
                  <button
                    key={theme.id}
                    onClick={() => {
                      setTheme(theme.id);
                      setIsOpen(false);
                    }}
                    className={`p-4 rounded-xl border-2 transition-all duration-200 hover:scale-105 ${
                      currentTheme.id === theme.id
                        ? 'border-gray-400 shadow-lg'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className={`w-full h-16 rounded-lg mb-3 ${theme.colors.background}`}>
                      <div className="flex items-center justify-center h-full">
                        <div className={`w-8 h-8 rounded-full ${theme.colors.primary}`}></div>
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl mb-1">{theme.emoji}</div>
                      <div className="text-sm font-medium text-gray-700">{theme.name}</div>
                    </div>
                  </button>
                ))}
              </div>

              <p className="text-xs text-gray-500 text-center mt-4">
                Your theme preference is saved automatically
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
};

export default ThemePicker;
