import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import jwt from "jsonwebtoken";
import { getUserById } from "../db";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

const JWT_SECRET = process.env.JWT_SECRET || "clave_secreta_desarrollo_nexus_tv";

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;
  const token = opts.req.cookies?.auth_token;

  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { id: number };
      const foundUser = await getUserById(decoded.id);
      if (foundUser) {
        user = foundUser;
      }
    } catch {
      // Cookie expirada o token inválido
    }
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}