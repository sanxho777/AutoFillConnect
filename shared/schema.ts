import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, boolean, jsonb, decimal } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const vehicles = pgTable("vehicles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  vin: varchar("vin", { length: 17 }),
  year: integer("year"),
  make: text("make"),
  model: text("model"),
  trim: text("trim"),
  price: decimal("price", { precision: 10, scale: 2 }),
  mileage: integer("mileage"),
  location: text("location"),
  description: text("description"),
  features: text("features").array(),
  images: text("images").array(),
  source: text("source").notNull(), // AutoTrader, Cars.com, CarGurus, Dealer.com
  sourceUrl: text("source_url"),
  status: text("status").notNull().default("extracted"), // extracted, posted, failed
  facebookPostId: text("facebook_post_id"),
  extractedAt: timestamp("extracted_at").defaultNow().notNull(),
  lastUpdated: timestamp("last_updated").defaultNow().notNull(),
});

export const scrapingSessions = pgTable("scraping_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  status: text("status").notNull().default("active"), // active, completed, failed, stopped
  currentSite: text("current_site"),
  progress: integer("progress").default(0),
  totalItems: integer("total_items").default(0),
  completedItems: integer("completed_items").default(0),
  currentAction: text("current_action"),
  startedAt: timestamp("started_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
  errorMessage: text("error_message"),
});

export const activityLogs = pgTable("activity_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  type: text("type").notNull(), // scrape_success, scrape_failed, facebook_post, facebook_failed
  description: text("description").notNull(),
  vehicleId: varchar("vehicle_id"),
  sessionId: varchar("session_id"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const facebookIntegration = pgTable("facebook_integration", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  isConnected: boolean("is_connected").default(false),
  accessToken: text("access_token"),
  userId: text("user_id"),
  userName: text("user_name"),
  autoPost: boolean("auto_post").default(false),
  lastSync: timestamp("last_sync"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const extensionSettings = pgTable("extension_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  autoExtractVin: boolean("auto_extract_vin").default(true),
  autoPostFacebook: boolean("auto_post_facebook").default(false),
  lazyLoadImages: boolean("lazy_load_images").default(true),
  scrapingDelay: integer("scraping_delay").default(2000), // milliseconds
  maxRetries: integer("max_retries").default(3),
  settings: jsonb("settings").default({}),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Relations
export const vehiclesRelations = relations(vehicles, ({ many }) => ({
  activityLogs: many(activityLogs),
}));

export const scrapingSessionsRelations = relations(scrapingSessions, ({ many }) => ({
  activityLogs: many(activityLogs),
}));

export const activityLogsRelations = relations(activityLogs, ({ one }) => ({
  vehicle: one(vehicles, {
    fields: [activityLogs.vehicleId],
    references: [vehicles.id],
  }),
  session: one(scrapingSessions, {
    fields: [activityLogs.sessionId],
    references: [scrapingSessions.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertVehicleSchema = createInsertSchema(vehicles).omit({
  id: true,
  extractedAt: true,
  lastUpdated: true,
});

export const insertScrapingSessionSchema = createInsertSchema(scrapingSessions).omit({
  id: true,
  startedAt: true,
});

export const insertActivityLogSchema = createInsertSchema(activityLogs).omit({
  id: true,
  createdAt: true,
});

export const insertFacebookIntegrationSchema = createInsertSchema(facebookIntegration).omit({
  id: true,
  createdAt: true,
});

export const insertExtensionSettingsSchema = createInsertSchema(extensionSettings).omit({
  id: true,
  updatedAt: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertVehicle = z.infer<typeof insertVehicleSchema>;
export type Vehicle = typeof vehicles.$inferSelect;

export type InsertScrapingSession = z.infer<typeof insertScrapingSessionSchema>;
export type ScrapingSession = typeof scrapingSessions.$inferSelect;

export type InsertActivityLog = z.infer<typeof insertActivityLogSchema>;
export type ActivityLog = typeof activityLogs.$inferSelect;

export type InsertFacebookIntegration = z.infer<typeof insertFacebookIntegrationSchema>;
export type FacebookIntegration = typeof facebookIntegration.$inferSelect;

export type InsertExtensionSettings = z.infer<typeof insertExtensionSettingsSchema>;
export type ExtensionSettings = typeof extensionSettings.$inferSelect;
