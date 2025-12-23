import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";

export async function registerRoutes(app: Express): Promise<Server> {
  // PayPal integration routes - only register if credentials are available
  if (process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET) {
    try {
      const { createPaypalOrder, capturePaypalOrder, loadPaypalDefault } = await import("./paypal");
      
      app.get("/setup", async (req, res) => {
        await loadPaypalDefault(req, res);
      });

      app.post("/order", async (req, res) => {
        await createPaypalOrder(req, res);
      });

      app.post("/order/:orderID/capture", async (req, res) => {
        await capturePaypalOrder(req, res);
      });
      
      console.log("[PayPal] Routes registered successfully");
    } catch (error) {
      console.error("[PayPal] Failed to initialize:", error);
    }
  } else {
    console.log("[PayPal] Credentials not set - PayPal routes disabled");
  }

  const httpServer = createServer(app);

  return httpServer;
}
