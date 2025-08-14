import { 
  vehicles, 
  scrapingSessions, 
  activityLogs, 
  facebookIntegration,
  extensionSettings,
  type Vehicle, 
  type InsertVehicle,
  type ScrapingSession,
  type InsertScrapingSession,
  type ActivityLog,
  type InsertActivityLog,
  type FacebookIntegration,
  type InsertFacebookIntegration,
  type ExtensionSettings,
  type InsertExtensionSettings,
  users,
  type User,
  type InsertUser
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, count, and, or } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Vehicles
  getVehicles(filters: { page?: number; limit?: number; source?: string; status?: string }): Promise<Vehicle[]>;
  getVehiclesCount(filters: { source?: string; status?: string }): Promise<number>;
  getVehicle(id: string): Promise<Vehicle | undefined>;
  createVehicle(vehicle: InsertVehicle): Promise<Vehicle>;
  updateVehicle(id: string, updates: Partial<InsertVehicle>): Promise<Vehicle | undefined>;
  deleteVehicle(id: string): Promise<boolean>;

  // Scraping Sessions
  createScrapingSession(session: InsertScrapingSession): Promise<ScrapingSession>;
  getScrapingSession(id: string): Promise<ScrapingSession | undefined>;
  updateScrapingSession(id: string, updates: Partial<InsertScrapingSession>): Promise<ScrapingSession | undefined>;
  getActiveScrapingSession(): Promise<ScrapingSession | undefined>;

  // Activity Logs
  createActivityLog(log: InsertActivityLog): Promise<ActivityLog>;
  getRecentActivity(limit: number): Promise<ActivityLog[]>;

  // Dashboard Stats
  getDashboardStats(): Promise<{
    totalVehicles: number;
    successfulScrapes: number;
    facebookPosts: number;
    failedExtractions: number;
  }>;

  // Facebook Integration
  getFacebookIntegration(): Promise<FacebookIntegration | undefined>;
  updateFacebookIntegration(integration: Partial<InsertFacebookIntegration>): Promise<FacebookIntegration>;

  // Extension Settings
  getExtensionSettings(): Promise<ExtensionSettings | undefined>;
  updateExtensionSettings(settings: Partial<InsertExtensionSettings>): Promise<ExtensionSettings>;
}

export class DatabaseStorage implements IStorage {
  // Users
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  // Vehicles
  async getVehicles(filters: { page?: number; limit?: number; source?: string; status?: string }): Promise<Vehicle[]> {
    const { page = 1, limit = 10, source, status } = filters;
    const offset = (page - 1) * limit;

    let query = db.select().from(vehicles);
    
    const conditions = [];
    if (source) conditions.push(eq(vehicles.source, source));
    if (status) conditions.push(eq(vehicles.status, status));
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as typeof query;
    }

    const result = await query
      .orderBy(desc(vehicles.extractedAt))
      .limit(limit)
      .offset(offset);

    return result;
  }

  async getVehiclesCount(filters: { source?: string; status?: string }): Promise<number> {
    const { source, status } = filters;

    let query = db.select({ count: count() }).from(vehicles);
    
    const conditions = [];
    if (source) conditions.push(eq(vehicles.source, source));
    if (status) conditions.push(eq(vehicles.status, status));
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as typeof query;
    }

    const [{ count: total }] = await query;
    return total;
  }

  async getVehicle(id: string): Promise<Vehicle | undefined> {
    const [vehicle] = await db.select().from(vehicles).where(eq(vehicles.id, id));
    return vehicle || undefined;
  }

  async createVehicle(vehicle: InsertVehicle): Promise<Vehicle> {
    const [newVehicle] = await db
      .insert(vehicles)
      .values({
        ...vehicle,
        extractedAt: new Date(),
        lastUpdated: new Date()
      })
      .returning();
    return newVehicle;
  }

  async updateVehicle(id: string, updates: Partial<InsertVehicle>): Promise<Vehicle | undefined> {
    const [updatedVehicle] = await db
      .update(vehicles)
      .set({
        ...updates,
        lastUpdated: new Date()
      })
      .where(eq(vehicles.id, id))
      .returning();
    return updatedVehicle || undefined;
  }

  async deleteVehicle(id: string): Promise<boolean> {
    const result = await db.delete(vehicles).where(eq(vehicles.id, id));
    return (result.rowCount || 0) > 0;
  }

  // Scraping Sessions
  async createScrapingSession(session: InsertScrapingSession): Promise<ScrapingSession> {
    const [newSession] = await db
      .insert(scrapingSessions)
      .values({
        ...session,
        startedAt: new Date()
      })
      .returning();
    return newSession;
  }

  async getScrapingSession(id: string): Promise<ScrapingSession | undefined> {
    const [session] = await db.select().from(scrapingSessions).where(eq(scrapingSessions.id, id));
    return session || undefined;
  }

  async updateScrapingSession(id: string, updates: Partial<InsertScrapingSession>): Promise<ScrapingSession | undefined> {
    const updateData = { ...updates };
    if (updates.status && ['completed', 'failed', 'stopped'].includes(updates.status)) {
      updateData.completedAt = new Date();
    }

    const [updatedSession] = await db
      .update(scrapingSessions)
      .set(updateData)
      .where(eq(scrapingSessions.id, id))
      .returning();
    return updatedSession || undefined;
  }

  async getActiveScrapingSession(): Promise<ScrapingSession | undefined> {
    const [session] = await db
      .select()
      .from(scrapingSessions)
      .where(eq(scrapingSessions.status, 'active'))
      .orderBy(desc(scrapingSessions.startedAt))
      .limit(1);
    return session || undefined;
  }

  // Activity Logs
  async createActivityLog(log: InsertActivityLog): Promise<ActivityLog> {
    const [newLog] = await db
      .insert(activityLogs)
      .values({
        ...log,
        createdAt: new Date()
      })
      .returning();
    return newLog;
  }

  async getRecentActivity(limit: number): Promise<ActivityLog[]> {
    return await db
      .select()
      .from(activityLogs)
      .orderBy(desc(activityLogs.createdAt))
      .limit(limit);
  }

  // Dashboard Stats
  async getDashboardStats(): Promise<{
    totalVehicles: number;
    successfulScrapes: number;
    facebookPosts: number;
    failedExtractions: number;
  }> {
    const [totalVehiclesResult] = await db.select({ count: count() }).from(vehicles);
    
    const [successfulScrapesResult] = await db
      .select({ count: count() })
      .from(vehicles)
      .where(eq(vehicles.status, 'extracted'));
    
    const [facebookPostsResult] = await db
      .select({ count: count() })
      .from(vehicles)
      .where(eq(vehicles.status, 'posted'));
    
    const [failedExtractionsResult] = await db
      .select({ count: count() })
      .from(vehicles)
      .where(eq(vehicles.status, 'failed'));

    return {
      totalVehicles: totalVehiclesResult.count,
      successfulScrapes: successfulScrapesResult.count,
      facebookPosts: facebookPostsResult.count,
      failedExtractions: failedExtractionsResult.count
    };
  }

  // Facebook Integration
  async getFacebookIntegration(): Promise<FacebookIntegration | undefined> {
    const [integration] = await db
      .select()
      .from(facebookIntegration)
      .orderBy(desc(facebookIntegration.createdAt))
      .limit(1);
    return integration || undefined;
  }

  async updateFacebookIntegration(integration: Partial<InsertFacebookIntegration>): Promise<FacebookIntegration> {
    const existing = await this.getFacebookIntegration();
    
    if (existing) {
      const [updated] = await db
        .update(facebookIntegration)
        .set(integration)
        .where(eq(facebookIntegration.id, existing.id))
        .returning();
      return updated;
    } else {
      const [newIntegration] = await db
        .insert(facebookIntegration)
        .values({
          ...integration,
          createdAt: new Date()
        })
        .returning();
      return newIntegration;
    }
  }

  // Extension Settings
  async getExtensionSettings(): Promise<ExtensionSettings | undefined> {
    const [settings] = await db
      .select()
      .from(extensionSettings)
      .orderBy(desc(extensionSettings.updatedAt))
      .limit(1);
    return settings || undefined;
  }

  async updateExtensionSettings(settings: Partial<InsertExtensionSettings>): Promise<ExtensionSettings> {
    const existing = await this.getExtensionSettings();
    
    if (existing) {
      const [updated] = await db
        .update(extensionSettings)
        .set({
          ...settings,
          updatedAt: new Date()
        })
        .where(eq(extensionSettings.id, existing.id))
        .returning();
      return updated;
    } else {
      const [newSettings] = await db
        .insert(extensionSettings)
        .values({
          ...settings,
          updatedAt: new Date()
        })
        .returning();
      return newSettings;
    }
  }
}

export const storage = new DatabaseStorage();
