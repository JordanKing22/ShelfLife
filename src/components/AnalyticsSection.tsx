import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PantryItem } from '@/pages/Index';
import { Leaf, DollarSign, TrendingUp } from 'lucide-react';

interface AnalyticsSectionProps {
  items: PantryItem[];
  savedItemsCount: number;
}

const AnalyticsSection: React.FC<AnalyticsSectionProps> = ({ items, savedItemsCount }) => {
  // Calculate food usage stats
  const totalItems = items.length;
  const usedItems = savedItemsCount;
  const wastedItems = Math.max(0, totalItems - usedItems);
  
  // Calculate percentages for charts
  const usedPercentage = totalItems > 0 ? (usedItems / (usedItems + wastedItems)) * 100 : 0;
  const wastedPercentage = totalItems > 0 ? (wastedItems / (usedItems + wastedItems)) * 100 : 100;
  
  // Mock financial data (in a real app, this would come from actual price tracking)
  const avgItemCost = 5; // Average cost per item
  const moneySpent = totalItems * avgItemCost;
  const estimatedSavings = usedItems * avgItemCost;
  const lostToWaste = wastedItems * avgItemCost;
  
  const spentPercentage = moneySpent > 0 ? (moneySpent / (moneySpent + estimatedSavings)) * 85 : 85;
  const savingsPercentage = moneySpent > 0 ? (estimatedSavings / (moneySpent + estimatedSavings)) * 10 : 10;
  const wastePercentage = moneySpent > 0 ? (lostToWaste / (moneySpent + estimatedSavings)) * 5 : 5;

  // Create SVG donut chart
  const createDonutChart = (data: { value: number; color: string; label: string }[], size: number = 120) => {
    const radius = 40;
    const strokeWidth = 12;
    const center = size / 2;
    const circumference = 2 * Math.PI * radius;
    
    let cumulativePercentage = 0;
    
    return (
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="#f3f4f6"
          strokeWidth={strokeWidth}
        />
        {data.map((segment, index) => {
          const strokeDasharray = `${(segment.value / 100) * circumference} ${circumference}`;
          const strokeDashoffset = -cumulativePercentage * circumference / 100;
          cumulativePercentage += segment.value;
          
          return (
            <circle
              key={index}
              cx={center}
              cy={center}
              r={radius}
              fill="none"
              stroke={segment.color}
              strokeWidth={strokeWidth}
              strokeDasharray={strokeDasharray}
              strokeDashoffset={strokeDashoffset}
              className="transition-all duration-300"
            />
          );
        })}
      </svg>
    );
  };

  const foodUsageData = [
    { value: usedPercentage, color: '#10b981', label: 'Used on Time' },
    { value: wastedPercentage, color: '#ef4444', label: 'Went to Waste' }
  ];

  const moneyData = [
    { value: spentPercentage, color: '#3b82f6', label: 'Money Spent' },
    { value: savingsPercentage, color: '#10b981', label: 'Estimated Savings' },
    { value: wastePercentage, color: '#f59e0b', label: 'Lost to Waste' }
  ];

  return (
    <div className="mb-8">
      {/* Your Food Story Section */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-6 mb-8 border border-green-100">
        <div className="flex items-center gap-2 mb-4">
          <Leaf className="h-6 w-6 text-green-600" />
          <h2 className="text-2xl font-bold text-gray-800">Your Food Story - {new Date().toLocaleDateString('en-US', { month: 'long' })}</h2>
        </div>
        
        <div className="text-center">
          <div className="text-4xl font-bold text-green-600 mb-2">${estimatedSavings}</div>
          <p className="text-gray-700 text-lg mb-4">
            You saved by rescuing {usedItems} items this month! 👏
          </p>
          
          <div className="flex justify-center gap-8 mb-4">
            <div className="text-center">
              <div className="flex items-center gap-2 text-blue-600">
                <div className="w-3 h-3 rounded-full bg-blue-600"></div>
                <span className="font-medium">{usedItems}</span>
              </div>
              <div className="text-sm text-gray-600">Fresh Items</div>
            </div>
            <div className="text-center">
              <div className="flex items-center gap-2 text-orange-500">
                <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                <span className="font-medium">{wastedItems}</span>
              </div>
              <div className="text-sm text-gray-600">Items Rescued</div>
            </div>
          </div>
          
          <p className="text-sm text-gray-600 mb-2">Every ingredient saved makes a difference! 💚</p>
          <p className="text-xs text-blue-600 flex items-center justify-center gap-1">
            <span>🌍</span>
            By preventing waste, you've helped reduce carbon emissions too!
          </p>
        </div>
      </div>

      {/* Analytics Charts */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Food Usage Chart */}
        <Card className="shadow-lg border-none">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-gray-800">Last Month's Food Usage</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <div className="relative mb-6">
              {createDonutChart(foodUsageData, 160)}
            </div>
            <div className="flex gap-6 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span>Used on Time: {usedItems}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <span>Went to Waste: {wastedItems}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Money Savings Chart */}
        <Card className="shadow-lg border-none">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-gray-800">Money Spent vs. Savings</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <div className="relative mb-6">
              {createDonutChart(moneyData, 160)}
            </div>
            <div className="grid grid-cols-1 gap-2 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                <span>Money Spent: ${moneySpent}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span>Estimated Savings: ${estimatedSavings}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                <span>Lost to Waste: ${lostToWaste}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AnalyticsSection; 