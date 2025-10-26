import * as dotenv from "dotenv";

dotenv.config();

export const JWT_SECRET: string =
	process.env.JWT_SECRET || "fallback-secret-key-change-in-production";
export const JWT_EXPIRES_IN: string = process.env.JWT_EXPIRES_IN || "7d";
