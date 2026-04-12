/**
 * routes.js — Centralized Client-Side Route Constants
 *
 * All navigation targets in the app are defined here. Components should import
 * from this file instead of hardcoding path strings, so that renaming a route
 * only requires a change in one place.
 *
 * Usage:
 *   import { ROUTES } from "../utils/routes";
 *   navigate(ROUTES.HOME);
 *   navigate(ROUTES.AUTH.LOGIN);
 *   <Link to={ROUTES.RESTAURANTS} />
 */

// ── Top-level routes ───────────────────────────────────────────────────────────

export const ROUTES = {
  /** Landing / home page */
  HOME: "/",

  /** Auth page — defaults to login view */
  AUTH: "/auth",

  /** Restaurant browse/search page */
  RESTAURANTS: "/restaurants",

  /** AI chatbot page (protected) */
  CHATBOT: "/chatbot",

  /** User profile & preferences page (protected) */
  PROFILE: "/profile",
};

// ── Auth sub-routes (query-param variants) ────────────────────────────────────

/**
 * Pre-built auth routes with the `mode` query param baked in.
 * Use these anywhere you need to link directly to login or signup.
 *
 * Usage:
 *   navigate(AUTH_ROUTES.LOGIN);
 *   navigate(AUTH_ROUTES.SIGNUP);
 */
export const AUTH_ROUTES = {
  LOGIN:  "/auth?mode=login",
  SIGNUP: "/auth?mode=signup",
};
