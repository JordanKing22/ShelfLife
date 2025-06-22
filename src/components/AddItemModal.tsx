
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PantryItem } from "@/pages/Index";

interface AddItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddItem: (item: Omit<PantryItem, 'id' | 'addedDate' | 'status'>) => void;
}

const categories = [
  'Fruits & Vegetables',
  'Dairy & Eggs',
  'Meat & Seafood',
  'Pantry Staples',
  'Frozen Foods',
  'Beverages',
  'Snacks',
  'Other'
];

const units = [
  'piece(s)',
  'cup(s)',
  'bag(s)',
  'bottle(s)',
  'carton(s)'
];

const AddItemModal = ({ isOpen, onClose, onAddItem }: AddItemModalProps) => {
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    expiryDate: '',
    quantity: 1,
    unit: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name && formData.category && formData.expiryDate && formData.unit) {
      onAddItem(formData);
      setFormData({
        name: '',
        category: '',
        expiryDate: '',
        quantity: 1,
        unit: ''
      });
    }
  };

  const handleClose = () => {
    setFormData({
      name: '',
      category: '',
      expiryDate: '',
      quantity: 1,
      unit: ''
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md bg-white">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-gray-800 text-center">
            Add to Your Pantry 🍎
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name" className="text-sm font-medium text-gray-700 mb-1 block">
              Item Name
            </Label>
            <Input
              id="name"
              type="text"
              placeholder="e.g., Fresh Bananas"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="w-full"
              required
            />
          </div>

          <div>
            <Label htmlFor="category" className="text-sm font-medium text-gray-700 mb-1 block">
              Category
            </Label>
            <Select value={formData.category} onValueChange={(value) => setFormData({...formData, category: value})}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select category..." />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="quantity" className="text-sm font-medium text-gray-700 mb-1 block">
                Quantity
              </Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                value={formData.quantity}
                onChange={(e) => setFormData({...formData, quantity: parseInt(e.target.value) || 1})}
                className="w-full"
                required
              />
            </div>

            <div>
              <Label htmlFor="unit" className="text-sm font-medium text-gray-700 mb-1 block">
                Unit
              </Label>
              <Select value={formData.unit} onValueChange={(value) => setFormData({...formData, unit: value})}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Unit..." />
                </SelectTrigger>
                <SelectContent>
                  {units.map((unit) => (
                    <SelectItem key={unit} value={unit}>
                      {unit}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="expiryDate" className="text-sm font-medium text-gray-700 mb-1 block">
              Expiry Date
            </Label>
            <Input
              id="expiryDate"
              type="date"
              value={formData.expiryDate}
              onChange={(e) => setFormData({...formData, expiryDate: e.target.value})}
              className="w-full"
              required
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              className="flex-1 bg-green-600 hover:bg-green-700 text-white"
            >
              Add Item ✨
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddItemModal;
