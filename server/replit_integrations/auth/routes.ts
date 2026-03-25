import type { Express } from "express";
import { authStorage } from "./storage";
import { isAuthenticated } from "./replitAuth";

// Register auth-specific routes
// NOTE: /api/auth/user is handled in routes.ts with sessionAuth which supports
// Apple Sign In (Bearer token), Replit OIDC, and email/password — don't register it here
export function registerAuthRoutes(app: Express): void {
}
