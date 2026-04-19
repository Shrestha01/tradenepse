import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

// This pulls the URL from your .env file
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not defined in .env file");
}

// Prepare: false is safer for local development environments
const client = postgres(connectionString, { prepare: false });

export const db = drizzle(client, { schema });
