/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as announcements from "../announcements.js";
import type * as applications from "../applications.js";
import type * as audit from "../audit.js";
import type * as bibs from "../bibs.js";
import type * as emails from "../emails.js";
import type * as events from "../events.js";
import type * as http from "../http.js";
import type * as notifications from "../notifications.js";
import type * as registrations from "../registrations.js";
import type * as stats from "../stats.js";
import type * as users from "../users.js";
import type * as volunteers from "../volunteers.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  announcements: typeof announcements;
  applications: typeof applications;
  audit: typeof audit;
  bibs: typeof bibs;
  emails: typeof emails;
  events: typeof events;
  http: typeof http;
  notifications: typeof notifications;
  registrations: typeof registrations;
  stats: typeof stats;
  users: typeof users;
  volunteers: typeof volunteers;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
