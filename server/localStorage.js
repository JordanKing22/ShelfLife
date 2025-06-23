import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { randomBytes } from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class LocalStorageDB {
  constructor() {
    this.dataDir = path.join(__dirname, 'localdb');
    this.collections = {};
    this.init();
  }

  async init() {
    try {
      await fs.mkdir(this.dataDir, { recursive: true });
      console.log('📁 Local storage initialized at:', this.dataDir);
    } catch (error) {
      console.error('Error initializing local storage:', error);
    }
  }

  collection(name) {
    if (!this.collections[name]) {
      this.collections[name] = new Collection(this.dataDir, name);
    }
    return this.collections[name];
  }
}

class Collection {
  constructor(dataDir, name) {
    this.dataDir = dataDir;
    this.name = name;
    this.filePath = path.join(dataDir, `${name}.json`);
  }

  async readData() {
    try {
      const data = await fs.readFile(this.filePath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      if (error.code === 'ENOENT') {
        return [];
      }
      throw error;
    }
  }

  async writeData(data) {
    await fs.writeFile(this.filePath, JSON.stringify(data, null, 2));
  }

  generateId() {
    return randomBytes(12).toString('hex');
  }

  async findOne(query) {
    const data = await this.readData();
    return data.find(item => {
      return Object.entries(query).every(([key, value]) => {
        if (key === '_id' && typeof value === 'object' && value.toString) {
          return item._id === value.toString();
        }
        return item[key] === value;
      });
    });
  }

  async find(query = {}) {
    const data = await this.readData();
    const filtered = data.filter(item => {
      return Object.entries(query).every(([key, value]) => {
        return item[key] === value;
      });
    });
    
    return {
      toArray: async () => filtered,
      sort: (sortQuery) => {
        const sorted = [...filtered];
        const [field, order] = Object.entries(sortQuery)[0] || [];
        if (field) {
          sorted.sort((a, b) => {
            if (order === -1) {
              return b[field] > a[field] ? 1 : -1;
            }
            return a[field] > b[field] ? 1 : -1;
          });
        }
        return {
          limit: (n) => ({
            toArray: async () => sorted.slice(0, n)
          }),
          toArray: async () => sorted
        };
      },
      limit: (n) => ({
        toArray: async () => filtered.slice(0, n)
      })
    };
  }

  async insertOne(document) {
    const data = await this.readData();
    const newDoc = {
      ...document,
      _id: this.generateId(),
      createdAt: document.createdAt || new Date(),
      updatedAt: document.updatedAt || new Date()
    };
    data.push(newDoc);
    await this.writeData(data);
    return { insertedId: newDoc._id };
  }

  async updateOne(query, update) {
    const data = await this.readData();
    let matchedCount = 0;
    let modifiedCount = 0;
    
    for (let i = 0; i < data.length; i++) {
      const item = data[i];
      const matches = Object.entries(query).every(([key, value]) => {
        if (key === '_id' && typeof value === 'object' && value.toString) {
          return item._id === value.toString();
        }
        return item[key] === value;
      });
      
      if (matches) {
        matchedCount++;
        if (update.$set) {
          Object.assign(item, update.$set);
          item.updatedAt = new Date();
          modifiedCount++;
        }
        break;
      }
    }
    
    if (modifiedCount > 0) {
      await this.writeData(data);
    }
    
    return { matchedCount, modifiedCount };
  }

  async deleteOne(query) {
    const data = await this.readData();
    const initialLength = data.length;
    
    const filtered = data.filter(item => {
      return !Object.entries(query).every(([key, value]) => {
        if (key === '_id' && typeof value === 'object' && value.toString) {
          return item._id === value.toString();
        }
        return item[key] === value;
      });
    });
    
    const deletedCount = initialLength - filtered.length;
    
    if (deletedCount > 0) {
      await this.writeData(filtered);
    }
    
    return { deletedCount };
  }
}

// Mock ObjectId class for compatibility
export class ObjectId {
  constructor(id) {
    this.id = id;
  }
  
  toString() {
    return this.id;
  }
}

export default LocalStorageDB; 