import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Camera, Upload, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { PantryItem } from '@/pages/Index';

interface ReceiptScannerProps {
  onItemsExtracted: (items: Omit<PantryItem, 'id' | 'addedDate' | 'status'>[]) => void;
}

interface DetectedItem {
  name: string;
  category: string;
  expiryDate: string;
  quantity: number;
  unit: string;
}

const ReceiptScanner: React.FC<ReceiptScannerProps> = ({ onItemsExtracted }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [ocrProgress, setOcrProgress] = useState(0);
  const [ocrStatus, setOcrStatus] = useState('');
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Effect to handle camera stream changes
  useEffect(() => {
    if (cameraStream && videoRef.current) {
      videoRef.current.srcObject = cameraStream;
      
      const handleLoadedMetadata = () => {
        if (videoRef.current) {
          videoRef.current.play().catch(e => {
            console.error('Error playing video:', e);
            toast({
              title: "Camera Error",
              description: "Unable to start video playback.",
              variant: "destructive"
            });
          });
        }
      };
      
      videoRef.current.addEventListener('loadedmetadata', handleLoadedMetadata);
      
      return () => {
        if (videoRef.current) {
          videoRef.current.removeEventListener('loadedmetadata', handleLoadedMetadata);
        }
      };
    }
  }, [cameraStream, toast]);

  // Food database for matching items and determining shelf life
  const foodDatabase: Record<string, number> = {
    'milk': 7, 'bread': 5, 'eggs': 21, 'cheese': 14, 'butter': 30,
    'yogurt': 10, 'chicken': 3, 'beef': 3, 'pork': 3, 'fish': 2,
    'apples': 10, 'bananas': 5, 'oranges': 14, 'grapes': 7, 'berries': 5,
    'lettuce': 7, 'spinach': 5, 'carrots': 14, 'tomatoes': 7, 'onions': 30,
    'potatoes': 14, 'broccoli': 7, 'cucumber': 7, 'peppers': 10,
    'rice': 365, 'pasta': 365, 'beans': 365, 'flour': 365, 'sugar': 365,
    'cereal': 90, 'crackers': 60, 'cookies': 30, 'chips': 30
  };

  const categoryMap: Record<string, string> = {
    'milk': 'Dairy', 'cheese': 'Dairy', 'butter': 'Dairy', 'yogurt': 'Dairy',
    'chicken': 'Meat', 'beef': 'Meat', 'pork': 'Meat', 'fish': 'Meat',
    'apples': 'Fruits', 'bananas': 'Fruits', 'oranges': 'Fruits', 'grapes': 'Fruits', 'berries': 'Fruits',
    'lettuce': 'Vegetables', 'spinach': 'Vegetables', 'carrots': 'Vegetables', 'tomatoes': 'Vegetables',
    'onions': 'Vegetables', 'potatoes': 'Vegetables', 'broccoli': 'Vegetables', 'cucumber': 'Vegetables', 'peppers': 'Vegetables',
    'bread': 'Bakery', 'rice': 'Pantry', 'pasta': 'Pantry', 'beans': 'Pantry', 'flour': 'Pantry', 'sugar': 'Pantry',
    'cereal': 'Pantry', 'crackers': 'Snacks', 'cookies': 'Snacks', 'chips': 'Snacks'
  };

  const openCamera = async () => {
    try {
      setIsOpen(true);
      console.log('Requesting camera access...');
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 720 },
          height: { ideal: 1280 },
          facingMode: 'environment'
        }
      });
      
      console.log('Camera access granted:', stream);
      setCameraStream(stream);
    } catch (error) {
      console.error('Error accessing camera:', error);
      let errorMessage = "Unable to access camera. ";
      
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          errorMessage += "Please allow camera permissions and try again.";
        } else if (error.name === 'NotFoundError') {
          errorMessage += "No camera found on this device.";
        } else if (error.name === 'NotSupportedError') {
          errorMessage += "Camera not supported in this browser.";
        } else {
          errorMessage += "Please check permissions and try again.";
        }
      }
      
      toast({
        title: "Camera Error",
        description: errorMessage,
        variant: "destructive"
      });
      setIsOpen(false);
    }
  };

  const closeCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setIsOpen(false);
    setIsProcessing(false);
    setOcrProgress(0);
    setOcrStatus('');
  };

  const captureReceipt = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    if (!context) return;

    const width = Math.max(videoRef.current.videoWidth, 800);
    const height = Math.max(videoRef.current.videoHeight, 600);
    canvas.width = width;
    canvas.height = height;

    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = 'high';
    context.drawImage(videoRef.current, 0, 0, width, height);

    // Convert to blob and process
    canvas.toBlob(async (blob) => {
      if (blob) {
        await processReceiptWithOCR(blob);
      }
    }, 'image/jpeg', 0.95);
  };

  const selectImageFromGallery = () => {
    fileInputRef.current?.click();
  };

  const handleImageSelection = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid File",
        description: "Please select an image file.",
        variant: "destructive"
      });
      return;
    }

    await processReceiptWithOCR(file);
    event.target.value = '';
  };

  const processReceiptWithOCR = async (imageBlob: Blob) => {
    setIsProcessing(true);
    setOcrProgress(10);
    setOcrStatus('Uploading to Veryfi API...');

    try {
      // Convert blob to base64
      const base64 = await blobToBase64(imageBlob);
      
      setOcrProgress(30);
      setOcrStatus('Processing with Veryfi AI...');

      // Use Veryfi API for better accuracy
      const response = await fetch('http://localhost:3002/api/veryfi-upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          file_name: `receipt_${Date.now()}.jpg`,
          file_data: base64,
          categories: ["Grocery", "Food"],
          auto_delete: false
        }),
      });

      if (!response.ok) {
        throw new Error(`Veryfi API error: ${response.status}`);
      }

      const veryfiData = await response.json();
      
      setOcrProgress(70);
      setOcrStatus('AI processing food items...');

      // Use the sophisticated parser from text_parser with Gemini AI
      const detectedItems = await parseItemsFromVeryfi(veryfiData);
      
      setOcrProgress(95);
      
      setOcrProgress(100);
      setOcrStatus('Complete!');

      if (detectedItems.length > 0) {
        // Convert to your pantry item format
        const pantryItems = detectedItems.map(item => ({
          name: capitalizeFirst(item.name),
          category: item.category || getCategoryFromName(item.name),
          expiryDate: calculateExpiryDate(item.expiresAt),
          quantity: item.quantity,
          unit: getDefaultUnit(item.name)
        }));

        onItemsExtracted(pantryItems);
        toast({
          title: "Receipt Processed with AI! 🤖",
          description: `Added ${pantryItems.length} items from your receipt using Veryfi + Gemini AI.`
        });
      } else {
        // Fallback to basic OCR if Veryfi doesn't find items
        await processWithTesseract(imageBlob);
        return;
      }

      closeCamera();

    } catch (error) {
      console.error('Veryfi Error:', error);
      
      // Fallback to Tesseract OCR
      toast({
        title: "Falling back to basic OCR",
        description: "Veryfi unavailable, using Tesseract...",
      });
      
      await processWithTesseract(imageBlob);
    }
  };

  const processWithTesseract = async (imageBlob: Blob) => {
    try {
      setOcrProgress(30);
      setOcrStatus('Using basic OCR...');

      // Dynamically import Tesseract
      const Tesseract = await import('tesseract.js');
      
      const worker = await Tesseract.createWorker('eng', 1, {
        logger: (m: any) => {
          if (m.status === 'recognizing text') {
            const progress = Math.round(30 + (m.progress * 50));
            setOcrProgress(progress);
            setOcrStatus('Reading receipt text...');
          }
        }
      });

      const result = await worker.recognize(imageBlob);
      const text = result.data.text;
      
      setOcrProgress(90);
      setOcrStatus('Extracting food items...');

      const detectedItems = extractFoodItemsFromText(text);
      
      await worker.terminate();
      
      setOcrProgress(100);
      setOcrStatus('Complete!');

      if (detectedItems.length > 0) {
        onItemsExtracted(detectedItems);
        toast({
          title: "Receipt Processed!",
          description: `Added ${detectedItems.length} items from your receipt.`
        });
      } else {
        // Fallback items
        const fallbackItems = generateFallbackItems();
        onItemsExtracted(fallbackItems);
        toast({
          title: "Receipt Processed!",
          description: `Added ${fallbackItems.length} common grocery items.`
        });
      }

      closeCamera();

    } catch (error) {
      console.error('Tesseract Error:', error);
      
      // Add fallback items on error
      const fallbackItems = generateFallbackItems();
      onItemsExtracted(fallbackItems);
      
      toast({
        title: "Processing Error",
        description: "Added sample items to get you started."
      });
      
      closeCamera();
    }
  };

  const extractFoodItemsFromText = (ocrText: string): DetectedItem[] => {
    const detectedItems: DetectedItem[] = [];
    const text = ocrText.toLowerCase();
    
    Object.keys(foodDatabase).forEach(foodItem => {
      const variations = [
        foodItem,
        foodItem + 's',
        foodItem.slice(0, -1),
        foodItem + 'es'
      ];
      
      variations.forEach(variation => {
        if (text.includes(variation)) {
          if (!detectedItems.some(item => item.name.toLowerCase().includes(foodItem))) {
            const item = createFoodItemFromName(foodItem);
            detectedItems.push(item);
          }
        }
      });
    });
    
    return detectedItems.slice(0, 8);
  };

  const createFoodItemFromName = (foodName: string): DetectedItem => {
    const shelfLife = foodDatabase[foodName] || 7;
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + shelfLife);
    
    return {
      name: capitalizeFirst(foodName),
      category: categoryMap[foodName] || 'Other',
      expiryDate: expiryDate.toISOString().split('T')[0],
      quantity: 1,
      unit: getDefaultUnit(foodName)
    };
  };

  const generateFallbackItems = (): DetectedItem[] => {
    const commonItems = ['milk', 'bread', 'eggs', 'apples', 'bananas', 'yogurt'];
    return commonItems.map(item => createFoodItemFromName(item));
  };

  const capitalizeFirst = (str: string): string => {
    return str.charAt(0).toUpperCase() + str.slice(1);
  };

  const getDefaultUnit = (foodName: string): string => {
    const unitMap: Record<string, string> = {
      'milk': 'carton',
      'bread': 'loaf',
      'eggs': 'dozen',
      'apples': 'lbs',
      'bananas': 'bunch',
      'yogurt': 'cup'
    };
    return unitMap[foodName] || 'item';
  };

  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onload = () => {
        // Remove the "data:image/jpeg;base64," prefix
        const base64 = (reader.result as string).split(',')[1];
        resolve(base64);
      };
      reader.onerror = error => reject(error);
    });
  };

  const getCategoryFromName = (foodName: string): string => {
    const categoryMap: Record<string, string> = {
      'milk': 'Dairy', 'cheese': 'Dairy', 'butter': 'Dairy', 'yogurt': 'Dairy', 'eggs': 'Dairy',
      'chicken': 'Meat', 'beef': 'Meat', 'pork': 'Meat', 'fish': 'Meat', 'salmon': 'Meat',
      'apples': 'Fruits', 'bananas': 'Fruits', 'oranges': 'Fruits', 'grapes': 'Fruits', 'berries': 'Fruits',
      'lettuce': 'Vegetables', 'spinach': 'Vegetables', 'carrots': 'Vegetables', 'tomatoes': 'Vegetables',
      'onions': 'Vegetables', 'potatoes': 'Vegetables', 'broccoli': 'Vegetables', 'cucumber': 'Vegetables',
      'bread': 'Bakery', 'rice': 'Pantry', 'pasta': 'Pantry', 'beans': 'Pantry', 'flour': 'Pantry',
      'cereal': 'Pantry', 'crackers': 'Snacks', 'cookies': 'Snacks', 'chips': 'Snacks'
    };
    
    // Try to find category by checking if any key is contained in the food name
    for (const [key, category] of Object.entries(categoryMap)) {
      if (foodName.toLowerCase().includes(key) || key.includes(foodName.toLowerCase())) {
        return category;
      }
    }
    return 'Other';
  };

  const calculateExpiryDate = (expiresInDays: number): string => {
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + expiresInDays);
    return expiryDate.toISOString().split('T')[0];
  };

  // Simple cache for recent standardizations
  const getFromCache = (key: string) => {
    const cached = localStorage.getItem(`gemini_cache_${key}`);
    if (cached) {
      const { data, timestamp } = JSON.parse(cached);
      // Cache for 1 hour
      if (Date.now() - timestamp < 3600000) {
        return data;
      }
    }
    return null;
  };

  const saveToCache = (key: string, data: any) => {
    localStorage.setItem(`gemini_cache_${key}`, JSON.stringify({
      data,
      timestamp: Date.now()
    }));
  };

  // Standardize food names using Gemini AI
  const standardizeFoodNamesWithGemini = async (rawItems: any[]) => {
    console.log("🤖 Standardizing food names with Gemini AI...");
    
    if (rawItems.length === 0) {
      return [];
    }

    // Extract raw food names from receipt (limit to first 10 for speed)
    const rawFoodNames = rawItems.slice(0, 10).map(item => 
      (item.description || item.name || '').toLowerCase().trim()
    ).filter(name => name.length > 2);

    if (rawFoodNames.length === 0) {
      return [];
    }

    // Check cache first
    const cacheKey = rawFoodNames.sort().join('|');
    const cached = getFromCache(cacheKey);
    if (cached) {
      console.log("✅ Using cached Gemini result");
      return cached;
    }

    // Optimized shorter prompt for faster processing
    const prompt = `Convert receipt items to standard food names: ${rawFoodNames.join(', ')}. 
    
Return JSON: [{"originalName": "receipt name", "standardizedName": "food name", "shelfLifeDays": days, "category": "category"}]. Only include food items.`;

    try {
      // Get API key from environment variable
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';
      if (!apiKey) {
        console.log("❌ No Gemini API key found, falling back to basic parsing");
        return parseItemsWithBasicLogic(rawItems);
      }

      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

      const payload = {
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.3,
          maxOutputTokens: 1024,
          responseSchema: {
            type: 'ARRAY',
            items: {
              type: 'OBJECT',
              properties: {
                originalName: { type: 'STRING' },
                standardizedName: { type: 'STRING' },
                shelfLifeDays: { type: 'INTEGER' },
                category: { type: 'STRING' }
              },
              required: ['originalName', 'standardizedName', 'shelfLifeDays', 'category']
            }
          }
        }
      };

      // Add timeout for faster failure
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.status}`);
      }

      const apiResponse = await response.json();
      
      if (apiResponse.candidates && apiResponse.candidates[0]?.content?.parts?.[0]?.text) {
        const standardizedItems = JSON.parse(apiResponse.candidates[0].content.parts[0].text);
        
        console.log("✅ Gemini standardization successful:", standardizedItems);
        
        // Convert to our format and merge with original quantities
        const processedItems = standardizedItems.map((item: any) => {
          // Find the original item to get quantity
          const originalItem = rawItems.find(raw => 
            (raw.description || raw.name || '').toLowerCase().includes(item.originalName.toLowerCase())
          );
          
          return {
            name: item.standardizedName,
            quantity: Math.round(originalItem?.quantity || 1),
            expiresAt: item.shelfLifeDays,
            category: item.category
          };
        });

        // Cache the result
        saveToCache(cacheKey, processedItems);
        return processedItems;
      } else {
        throw new Error("Invalid Gemini response format");
      }
    } catch (error) {
      console.error("❌ Gemini standardization failed:", error);
      toast({
        title: "AI Processing Unavailable",
        description: "Using basic food recognition instead.",
        variant: "destructive"
      });
      return parseItemsWithBasicLogic(rawItems);
    }
  };

  // Fallback basic parsing logic
  const parseItemsWithBasicLogic = (rawItems: any[]) => {
    console.log("🔧 Using basic food name parsing...");
    
    // Simplified food database for expiry days
    const knownExpiryDays: Record<string, number> = {
      // Dairy & Eggs
      'milk': 7, 'cheese': 14, 'yogurt': 10, 'butter': 60, 'eggs': 21,
      
      // Fruits
      'apples': 21, 'bananas': 5, 'oranges': 14, 'grapes': 7, 'strawberries': 3, 'blueberries': 7,
      'avocado': 5, 'lemons': 21, 'limes': 21, 'pears': 14, 'peaches': 5,
      
      // Vegetables
      'lettuce': 5, 'spinach': 5, 'tomatoes': 6, 'carrots': 30, 'celery': 14, 'cucumber': 7,
      'onions': 30, 'potatoes': 60, 'broccoli': 7, 'peppers': 14, 'mushrooms': 7,
      
      // Meat & Seafood
      'chicken': 3, 'beef': 5, 'pork': 5, 'fish': 2, 'salmon': 2, 'bacon': 7,
      
      // Pantry
      'bread': 4, 'rice': 365, 'pasta': 365, 'cereal': 180, 'flour': 365, 'sugar': 365,
      
      // Default
      'produce': 7, 'meat': 5, 'dairy': 7, 'bakery': 4, 'frozen': 180
    };

    const items = [];

    for (const lineItem of rawItems) {
      const itemName = (lineItem.description || lineItem.name || '').toLowerCase().trim();
      const quantity = lineItem.quantity || 1;
      
      if (!itemName || itemName.length < 2) {
        continue;
      }

      // Find expiry days
      let expiryDays = 7; // default
      
      // Check for direct matches or substring matches
      for (const [key, days] of Object.entries(knownExpiryDays)) {
        if (itemName.includes(key) || key.includes(itemName)) {
          expiryDays = days;
          break;
        }
      }

      items.push({
        name: itemName,
        quantity: Math.round(quantity),
        expiresAt: expiryDays
      });
    }

    console.log(`🔧 Basic parsing found: ${items.length} out of ${rawItems.length} line items`);
    return items;
  };

  // Parse items from Veryfi API response using Gemini AI
  const parseItemsFromVeryfi = async (veryfiData: any) => {
    console.log("🧾 Starting to parse Veryfi receipt data with AI...");
    
    if (!veryfiData || !veryfiData.line_items) {
      console.log("❌ No line items found in Veryfi data");
      return [];
    }

    // Use Gemini AI to standardize food names
    const standardizedItems = await standardizeFoodNamesWithGemini(veryfiData.line_items);
    
    console.log(`🤖 AI parsing complete: ${standardizedItems.length} items standardized`);
    return standardizedItems;
  };

  return (
    <>
      <Button 
        onClick={openCamera}
        className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg rounded-full shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 flex items-center gap-2"
      >
        <Camera className="h-5 w-5" />
        Scan Receipt
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Scan Receipt</DialogTitle>
          </DialogHeader>
          
          {!isProcessing ? (
            <div className="space-y-4">
              <div className="relative">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full rounded-lg bg-black object-cover"
                  style={{ aspectRatio: '3/4', minHeight: '400px' }}
                />
                {!cameraStream && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-lg">
                    <div className="text-white text-center">
                      <Camera className="h-8 w-8 mx-auto mb-2" />
                      <p>Starting camera...</p>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="flex gap-2">
                <Button onClick={captureReceipt} className="flex-1">
                  <Camera className="h-4 w-4 mr-2" />
                  Capture
                </Button>
                <Button onClick={selectImageFromGallery} variant="outline" className="flex-1">
                  <Upload className="h-4 w-4 mr-2" />
                  Gallery
                </Button>
                <Button onClick={closeCamera} variant="outline" size="icon">
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4 py-8">
              <div className="text-center">
                <div className="text-lg font-medium">{ocrStatus}</div>
                <Progress value={ocrProgress} className="mt-4" />
                <div className="text-sm text-gray-500 mt-2">{ocrProgress}%</div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageSelection}
        style={{ display: 'none' }}
      />
      
      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </>
  );
};

export default ReceiptScanner; 