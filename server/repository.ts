import fs from 'fs/promises';
import path from 'path';
import { Application } from './types';

const DATA_DIR = path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'applications.json');

// Initial seed data is empty to ensure user starts with a clean slate
const SEED_DATA: Application[] = [];

export class ApplicationRepository {
  private static async ensureInitialized() {
    try {
      await fs.mkdir(DATA_DIR, { recursive: true });
      try {
        await fs.access(DATA_FILE);
      } catch {
        // File does not exist, seed it
        await fs.writeFile(DATA_FILE, JSON.stringify(SEED_DATA, null, 2), 'utf-8');
      }
    } catch (err) {
      console.error('Failed to initialize database folder or seed data:', err);
    }
  }

  static async getAll(): Promise<Application[]> {
    await this.ensureInitialized();
    try {
      const content = await fs.readFile(DATA_FILE, 'utf-8');
      const apps: Application[] = JSON.parse(content);
      return apps.filter(app => !app.is_deleted);
    } catch (err) {
      console.error('Error reading applications file:', err);
      return [];
    }
  }

  static async getById(id: string): Promise<Application | null> {
    await this.ensureInitialized();
    const apps = await this.getAll();
    const app = apps.find(a => a.id === id);
    return app || null;
  }

  static async create(app: Application): Promise<Application> {
    await this.ensureInitialized();
    try {
      const content = await fs.readFile(DATA_FILE, 'utf-8');
      const apps: Application[] = JSON.parse(content);
      apps.push(app);
      await fs.writeFile(DATA_FILE, JSON.stringify(apps, null, 2), 'utf-8');
      return app;
    } catch (err) {
      console.error('Error writing application record:', err);
      throw new Error('Failed to persist application record.');
    }
  }

  static async update(id: string, updates: Partial<Application>): Promise<Application | null> {
    await this.ensureInitialized();
    try {
      const content = await fs.readFile(DATA_FILE, 'utf-8');
      const apps: Application[] = JSON.parse(content);
      const index = apps.findIndex(a => a.id === id && !a.is_deleted);
      if (index === -1) return null;

      apps[index] = {
        ...apps[index],
        ...updates,
        updated_at: new Date().toISOString()
      };

      await fs.writeFile(DATA_FILE, JSON.stringify(apps, null, 2), 'utf-8');
      return apps[index];
    } catch (err) {
      console.error('Error updating application record:', err);
      throw new Error('Failed to update application record.');
    }
  }

  static async delete(id: string): Promise<boolean> {
    await this.ensureInitialized();
    try {
      const content = await fs.readFile(DATA_FILE, 'utf-8');
      const apps: Application[] = JSON.parse(content);
      const index = apps.findIndex(a => a.id === id && !a.is_deleted);
      if (index === -1) return false;

      apps[index] = {
        ...apps[index],
        is_deleted: true,
        updated_at: new Date().toISOString()
      };

      await fs.writeFile(DATA_FILE, JSON.stringify(apps, null, 2), 'utf-8');
      return true;
    } catch (err) {
      console.error('Error soft-deleting application record:', err);
      throw new Error('Failed to delete application record.');
    }
  }
}
