import express from 'express';
import cors from 'cors';
import pkg from 'mongodb';
const { MongoClient, ServerApi, ObjectId } = pkg;
import dotenv from 'dotenv';
import path from 'path';
import LocalStorageDB, { ObjectId as LocalObjectId } from './localStorage.js';

// Load .env file - check both current directory and parent directory
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Try to load .env from parent directory (project root)
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const app = express();
const PORT = process.env.PORT || 3001;

// MongoDB connection
const uri = process.env.MONGODB_URI;

if (!uri) {
  console.error('❌ MONGODB_URI environment variable is required');
  console.error('Please create a .env file with your MongoDB connection string');
  process.exit(1);
}

const client = new MongoClient(uri, {
  serverApi: {
    version: '1',
    strict: true,
    deprecationErrors: true,
  }
});

let db;
let usingLocalStorage = false;
let ObjectIdClass = ObjectId;

// Connect to MongoDB with fallback to local storage
async function connectToMongo() {
  try {
    await client.connect();
    await client.db("admin").command({ ping: 1 });
    console.log("✅ Successfully connected to MongoDB!");
    db = client.db("shelflife");
    usingLocalStorage = false;
  } catch (error) {
    console.error("⚠️ MongoDB connection failed:", error.message);
    console.log("📦 Falling back to local storage...");
    
    // Use local storage as fallback
    const localDB = new LocalStorageDB();
    await localDB.init();
    db = localDB;
    usingLocalStorage = true;
    ObjectIdClass = LocalObjectId;
    
    console.log("✅ Using local storage backend");
  }
}

// Middleware
app.use(cors());
app.use(express.json());

// Simple authentication middleware
const authenticateUser = async (req, res, next) => {
  try {
    const userId = req.headers['x-user-id'];
    console.log('Auth middleware - received userId:', userId);
    
    if (!userId) {
      console.log('Auth middleware - no user ID provided');
      return res.status(401).json({ error: 'User ID required' });
    }
    
    // Verify user exists
    console.log('Auth middleware - looking up user in database');
    const user = await db.collection('users').findOne({ _id: new ObjectIdClass(userId) });
    console.log('Auth middleware - user found:', user ? 'YES' : 'NO');
    
    if (!user) {
      console.log('Auth middleware - user not found in database');
      return res.status(401).json({ error: 'Invalid user', userId: userId });
    }
    
    req.userId = userId;
    console.log('Auth middleware - authentication successful');
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    console.error('Error details:', error.message);
    res.status(401).json({ error: 'Authentication failed', details: error.message });
  }
};

// Routes

// Get all pantry items for authenticated user
app.get('/api/pantry', authenticateUser, async (req, res) => {
  try {
    const items = await db.collection('pantry').find({ userId: req.userId }).toArray();
    res.json(items);
  } catch (error) {
    console.error('Error fetching pantry items:', error);
    res.status(500).json({ error: 'Failed to fetch pantry items' });
  }
});

// Add new pantry item for authenticated user
app.post('/api/pantry', authenticateUser, async (req, res) => {
  try {
    const newItem = {
      ...req.body,
      userId: req.userId,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    const result = await db.collection('pantry').insertOne(newItem);
    res.status(201).json({ ...newItem, _id: result.insertedId });
  } catch (error) {
    console.error('Error adding pantry item:', error);
    res.status(500).json({ error: 'Failed to add pantry item' });
  }
});

// Update pantry item for authenticated user
app.put('/api/pantry/:id', authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = {
      ...req.body,
      updatedAt: new Date()
    };
    const result = await db.collection('pantry').updateOne(
      { _id: new ObjectIdClass(id), userId: req.userId },
      { $set: updateData }
    );
    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'Item not found or unauthorized' });
    }
    res.json({ message: 'Item updated successfully' });
  } catch (error) {
    console.error('Error updating pantry item:', error);
    res.status(500).json({ error: 'Failed to update pantry item' });
  }
});

// Delete pantry item for authenticated user
app.delete('/api/pantry/:id', authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.collection('pantry').deleteOne({ 
      _id: new ObjectIdClass(id), 
      userId: req.userId 
    });
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Item not found or unauthorized' });
    }
    res.json({ message: 'Item deleted successfully' });
  } catch (error) {
    console.error('Error deleting pantry item:', error);
    res.status(500).json({ error: 'Failed to delete pantry item' });
  }
});

// Save generated recipes for authenticated user
app.post('/api/recipes', authenticateUser, async (req, res) => {
  try {
    const recipeData = {
      ...req.body,
      userId: req.userId,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    const result = await db.collection('recipes').insertOne(recipeData);
    res.status(201).json({ ...recipeData, _id: result.insertedId });
  } catch (error) {
    console.error('Error saving recipe:', error);
    res.status(500).json({ error: 'Failed to save recipe' });
  }
});

// Get recent recipes for authenticated user
app.get('/api/recipes', authenticateUser, async (req, res) => {
  try {
    const recipes = await db.collection('recipes')
      .find({ userId: req.userId })
      .sort({ createdAt: -1 })
      .limit(20)
      .toArray();
    res.json(recipes);
  } catch (error) {
    console.error('Error fetching recipes:', error);
    res.status(500).json({ error: 'Failed to fetch recipes' });
  }
});

// Save recipe click/interaction for authenticated user
app.post('/api/recipe-clicks', authenticateUser, async (req, res) => {
  try {
    const clickData = {
      ...req.body,
      userId: req.userId,
      timestamp: new Date()
    };
    const result = await db.collection('recipe_clicks').insertOne(clickData);
    res.status(201).json({ ...clickData, _id: result.insertedId });
  } catch (error) {
    console.error('Error saving recipe click:', error);
    res.status(500).json({ error: 'Failed to save recipe click' });
  }
});

// Authentication Routes

// Sign up new user
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    
    // Check if user already exists
    const existingUser = await db.collection('users').findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'User already exists with this email' });
    }
    
    // Simple password hashing (in production, use bcrypt)
    const hashedPassword = Buffer.from(password).toString('base64');
    
    // Create new user
    const newUser = {
      email,
      password: hashedPassword,
      name,
      onboardingCompleted: false, // New users need to complete onboarding
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const result = await db.collection('users').insertOne(newUser);
    
    // Return user without password
    const userResponse = {
      _id: result.insertedId,
      email,
      name,
      createdAt: newUser.createdAt
    };
    
    res.status(201).json({ success: true, user: userResponse });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ success: false, message: 'Failed to create user' });
  }
});

// Sign in user
app.post('/api/auth/signin', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Find user by email
    const user = await db.collection('users').findOne({ email });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }
    
    // Simple password verification (in production, use bcrypt)
    const hashedPassword = Buffer.from(password).toString('base64');
    if (user.password !== hashedPassword) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }
    
    // Return user without password
    const userResponse = {
      _id: user._id,
      email: user.email,
      name: user.name,
      createdAt: user.createdAt
    };
    
    res.json({ success: true, user: userResponse });
  } catch (error) {
    console.error('Error signing in user:', error);
    res.status(500).json({ success: false, message: 'Failed to sign in' });
  }
});

// Update user onboarding for authenticated user
app.put('/api/users/onboarding', authenticateUser, async (req, res) => {
  console.log('=== ONBOARDING ENDPOINT CALLED ===');
  console.log('Request headers:', req.headers);
  console.log('Request body:', req.body);
  
  try {
    const { 
      householdSize, 
      dietaryPreferences, 
      cookingStyle, 
      cookingGoals, 
      onboardingCompleted 
    } = req.body;

    console.log('Updating onboarding for user:', req.userId);
    console.log('Onboarding data:', req.body);

    const updateData = {
      householdSize: parseInt(householdSize),
      dietaryPreferences,
      cookingStyle,
      cookingGoals,
      onboardingCompleted,
      updatedAt: new Date()
    };

    const result = await db.collection('users').updateOne(
      { _id: new ObjectIdClass(req.userId) },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ 
      success: true, 
      message: 'Onboarding completed successfully',
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    console.error('Error updating user onboarding:', error);
    res.status(500).json({ error: 'Failed to update user onboarding' });
  }
});

// Get user profile for authenticated user
app.get('/api/users/:id', authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Ensure user can only access their own profile
    if (id !== req.userId) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const user = await db.collection('users').findOne(
      { _id: new ObjectIdClass(id) },
      { projection: { password: 0 } } // Exclude password from response
    );
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(user);
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ error: 'Failed to fetch user profile' });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'ShelfLife API is running',
    backend: usingLocalStorage ? 'local-storage' : 'mongodb'
  });
});

// Start server
async function startServer() {
  await connectToMongo();
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer().catch(console.error);

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down gracefully...');
  await client.close();
  process.exit(0);
});