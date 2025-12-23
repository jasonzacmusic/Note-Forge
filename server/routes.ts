import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";

export async function registerRoutes(app: Express): Promise<Server> {
  // Application routes can be added here
  // prefix all routes with /api

  const httpServer = createServer(app);

  return httpServer;
}
