const API_BASE_URL = 'http://localhost:3001/api';

export interface PantryItem {
  _id?: string;
  id?: string;
  name: string;
  quantity: number;
  unit: string;
  expiryDate: string;
  category: string;
  status?: 'fresh' | 'expiring' | 'critical' | 'expired';
  frozen?: boolean;
  originalExpiryDate?: string; // Store original expiry date before freezing
  userId?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Recipe {
  _id?: string;
  recipeName: string;
  description: string;
  servingSize: string;
  ingredients: string[];
  instructions: string[];
  time?: string;
  difficulty?: 'Easy' | 'Medium' | 'Hard';
  triggeredBy?: string[]; // Array of ingredient names that triggered this recipe
  userId?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface RecipeClick {
  _id?: string;
  recipe: string;
  userId?: string;
  timestamp: Date;
}

class ApiService {
  private getCurrentUser() {
    const userStr = localStorage.getItem('currentUser');
    return userStr ? JSON.parse(userStr) : null;
  }

  private getAuthHeaders() {
    const user = this.getCurrentUser();
    if (!user) {
      throw new Error('User not authenticated');
    }
    return {
      'Content-Type': 'application/json',
      'x-user-id': user._id,
    };
  }

  isAuthenticated(): boolean {
    return this.getCurrentUser() !== null;
  }
  // Pantry operations
  async getPantryItems(): Promise<PantryItem[]> {
    const response = await fetch(`${API_BASE_URL}/pantry`, {
      headers: this.getAuthHeaders(),
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  }

  async addPantryItem(item: Omit<PantryItem, '_id' | 'createdAt' | 'updatedAt' | 'userId'>): Promise<PantryItem> {
    const response = await fetch(`${API_BASE_URL}/pantry`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(item),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  }

  async updatePantryItem(id: string, updates: Partial<PantryItem>): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/pantry/${id}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(updates),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
  }

  async deletePantryItem(id: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/pantry/${id}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
  }

  // Recipe operations
  async saveRecipes(recipes: Recipe[]): Promise<void> {
    // Save each recipe individually
    for (const recipe of recipes) {
      await fetch(`${API_BASE_URL}/recipes`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(recipe),
      });
    }
  }

  async getRecipes(): Promise<Recipe[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/recipes`, {
        headers: this.getAuthHeaders(),
      });
      if (!response.ok) {
        // It's okay to return an empty array if there are no recipes
        // or if the endpoint fails, as recipes are non-critical.
        return [];
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching recipes:', error);
      return [];
    }
  }

  async saveRecipeClick(recipeName: string): Promise<void> {
    try {
      await fetch(`${API_BASE_URL}/recipe-clicks`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({
          recipe: recipeName,
          timestamp: new Date(),
        }),
      });
    } catch (error) {
      console.error('Error saving recipe click:', error);
      // Don't throw error for recipe clicks as it's non-critical
    }
  }

  // Health check
  async checkHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/health`);
      return response.ok;
    } catch (error) {
      console.error('API health check failed:', error);
      return false;
    }
  }
}

export const apiService = new ApiService(); 