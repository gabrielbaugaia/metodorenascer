import { Database } from "./types";

export type UserHealthData = Database["public"]["Tables"]["user_health_data"]["Row"];
export type InsertUserHealthData = Database["public"]["Tables"]["user_health_data"]["Insert"];
export type UpdateUserHealthData = Database["public"]["Tables"]["user_health_data"]["Update"];
