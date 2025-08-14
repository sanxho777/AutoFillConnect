import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { insertVehicleSchema, insertScrapingSessionSchema, insertActivityLogSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Vehicle routes
  app.get("/api/vehicles", async (req, res) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const source = req.query.source as string;
      const status = req.query.status as string;

      const vehicles = await storage.getVehicles({ page, limit, source, status });
      const total = await storage.getVehiclesCount({ source, status });

      res.json({
        vehicles,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      console.error("Failed to fetch vehicles:", error);
      res.status(500).json({ message: "Failed to fetch vehicles" });
    }
  });

  app.get("/api/vehicles/:id", async (req, res) => {
    try {
      const vehicle = await storage.getVehicle(req.params.id);
      if (!vehicle) {
        return res.status(404).json({ message: "Vehicle not found" });
      }
      res.json(vehicle);
    } catch (error) {
      console.error("Failed to fetch vehicle:", error);
      res.status(500).json({ message: "Failed to fetch vehicle" });
    }
  });

  app.post("/api/vehicles", async (req, res) => {
    try {
      const validatedData = insertVehicleSchema.parse(req.body);
      const vehicle = await storage.createVehicle(validatedData);
      
      // Log the activity
      await storage.createActivityLog({
        type: "scrape_success",
        description: `Successfully scraped ${vehicle.year} ${vehicle.make} ${vehicle.model} data`,
        vehicleId: vehicle.id,
      });

      res.status(201).json(vehicle);
    } catch (error) {
      console.error("Failed to create vehicle:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid vehicle data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create vehicle" });
    }
  });

  app.put("/api/vehicles/:id", async (req, res) => {
    try {
      const validatedData = insertVehicleSchema.partial().parse(req.body);
      const vehicle = await storage.updateVehicle(req.params.id, validatedData);
      if (!vehicle) {
        return res.status(404).json({ message: "Vehicle not found" });
      }
      res.json(vehicle);
    } catch (error) {
      console.error("Failed to update vehicle:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid vehicle data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update vehicle" });
    }
  });

  app.delete("/api/vehicles/:id", async (req, res) => {
    try {
      const success = await storage.deleteVehicle(req.params.id);
      if (!success) {
        return res.status(404).json({ message: "Vehicle not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Failed to delete vehicle:", error);
      res.status(500).json({ message: "Failed to delete vehicle" });
    }
  });

  // Scraping session routes
  app.post("/api/scraping/start", async (req, res) => {
    try {
      const validatedData = insertScrapingSessionSchema.parse(req.body);
      const session = await storage.createScrapingSession(validatedData);
      res.status(201).json(session);
    } catch (error) {
      console.error("Failed to start scraping session:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid session data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to start scraping session" });
    }
  });

  app.get("/api/scraping/progress/:id", async (req, res) => {
    try {
      const session = await storage.getScrapingSession(req.params.id);
      if (!session) {
        return res.status(404).json({ message: "Scraping session not found" });
      }
      res.json(session);
    } catch (error) {
      console.error("Failed to fetch scraping progress:", error);
      res.status(500).json({ message: "Failed to fetch scraping progress" });
    }
  });

  app.put("/api/scraping/:id", async (req, res) => {
    try {
      const validatedData = insertScrapingSessionSchema.partial().parse(req.body);
      const session = await storage.updateScrapingSession(req.params.id, validatedData);
      if (!session) {
        return res.status(404).json({ message: "Scraping session not found" });
      }
      res.json(session);
    } catch (error) {
      console.error("Failed to update scraping session:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid session data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update scraping session" });
    }
  });

  app.get("/api/scraping/active", async (req, res) => {
    try {
      const session = await storage.getActiveScrapingSession();
      res.json(session);
    } catch (error) {
      console.error("Failed to fetch active session:", error);
      res.status(500).json({ message: "Failed to fetch active session" });
    }
  });

  // Dashboard stats
  app.get("/api/dashboard/stats", async (req, res) => {
    try {
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (error) {
      console.error("Failed to fetch dashboard stats:", error);
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  // Activity logs
  app.get("/api/activity", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const activities = await storage.getRecentActivity(limit);
      res.json(activities);
    } catch (error) {
      console.error("Failed to fetch activity logs:", error);
      res.status(500).json({ message: "Failed to fetch activity logs" });
    }
  });

  // Facebook integration
  app.get("/api/facebook/status", async (req, res) => {
    try {
      const integration = await storage.getFacebookIntegration();
      res.json(integration || { isConnected: false });
    } catch (error) {
      console.error("Failed to fetch Facebook status:", error);
      res.status(500).json({ message: "Failed to fetch Facebook status" });
    }
  });

  app.post("/api/facebook/generate-description", async (req, res) => {
    try {
      const { vehicleId } = req.body;
      const vehicle = await storage.getVehicle(vehicleId);
      
      if (!vehicle) {
        return res.status(404).json({ message: "Vehicle not found" });
      }

      // Generate Facebook Marketplace description
      const description = generateFacebookDescription(vehicle);
      res.json({ description });
    } catch (error) {
      console.error("Failed to generate Facebook description:", error);
      res.status(500).json({ message: "Failed to generate Facebook description" });
    }
  });

  app.post("/api/facebook/quick-post", async (req, res) => {
    try {
      const { vehicleIds, groupIds } = req.body;
      
      if (!Array.isArray(vehicleIds) || !Array.isArray(groupIds)) {
        return res.status(400).json({ message: "vehicleIds and groupIds must be arrays" });
      }

      const results = [];
      
      for (const vehicleId of vehicleIds) {
        const vehicle = await storage.getVehicle(vehicleId);
        if (!vehicle) continue;

        const description = generateFacebookDescription(vehicle);
        
        for (const groupId of groupIds) {
          results.push({
            vehicleId,
            groupId,
            description,
            status: "prepared", // In a real implementation, this would post to Facebook
          });
        }
      }

      res.json({ results });
    } catch (error) {
      console.error("Failed to prepare Facebook posts:", error);
      res.status(500).json({ message: "Failed to prepare Facebook posts" });
    }
  });

  // Extension settings
  app.get("/api/extension/settings", async (req, res) => {
    try {
      const settings = await storage.getExtensionSettings();
      res.json(settings || {
        autoExtractVin: true,
        autoPostFacebook: false,
        lazyLoadImages: true,
        scrapingDelay: 2000,
        maxRetries: 3,
      });
    } catch (error) {
      console.error("Failed to fetch extension settings:", error);
      res.status(500).json({ message: "Failed to fetch extension settings" });
    }
  });

  app.put("/api/extension/settings", async (req, res) => {
    try {
      const settings = await storage.updateExtensionSettings(req.body);
      res.json(settings);
    } catch (error) {
      console.error("Failed to update extension settings:", error);
      res.status(500).json({ message: "Failed to update extension settings" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

function generateFacebookDescription(vehicle: any): string {
  const features = vehicle.features ? vehicle.features.join(", ") : "";
  
  return `🚗 ${vehicle.year} ${vehicle.make} ${vehicle.model}${vehicle.trim ? ` ${vehicle.trim}` : ""}

💰 Price: $${vehicle.price}
📍 Location: ${vehicle.location}
🛣️ Mileage: ${vehicle.mileage?.toLocaleString()} miles
${vehicle.vin ? `🔍 VIN: ${vehicle.vin}` : ""}

${vehicle.description || ""}

${features ? `✨ Features: ${features}` : ""}

Contact for more details and to schedule a test drive!

#UsedCars #${vehicle.make} #${vehicle.model} #CarSale`;
}
