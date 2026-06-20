import { drizzle } from "drizzle-orm/bun-sqlite";
import { Database } from "bun:sqlite";
import { config } from "../../config";

const isTestEnv = process.env.NODE_ENV === "test";
const dbPath = isTestEnv ? ":memory:" : config.DATABASE_URL;

const sqlite = new Database(dbPath);
export const db = drizzle(sqlite);