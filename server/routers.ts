import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { TRPCError } from "@trpc/server";
import { 
  createContentForUser, 
  createUser, 
  deleteSourceForUser, 
  getContentForUser, 
  getPreferencesForUser, 
  getSourcesForUser, 
  getUserByEmail, 
  savePreferencesForUser,
  updateLastSignedIn
} from "./db";
import { parsePlaylist } from "./contentParser";

const JWT_SECRET = process.env.JWT_SECRET || "clave_secreta_desarrollo_nexus_tv";

export const appRouter = router({
  system: systemRouter,

  auth: router({
    register: publicProcedure
      .input(
        z.object({
          email: z.string().email("Correo electrónico inválido"),
          name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
          password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const existingUser = await getUserByEmail(input.email);
        if (existingUser) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "El correo electrónico ya está registrado.",
          });
        }

        const passwordHash = await bcrypt.hash(input.password, 10);
        const newUser = await createUser({
          email: input.email,
          name: input.name,
          passwordHash,
        });

        if (!newUser) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Error al crear la cuenta de usuario.",
          });
        }

        const token = jwt.sign({ id: newUser.id, email: newUser.email }, JWT_SECRET, {
          expiresIn: "7d",
        });

        ctx.res.cookie("auth_token", token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        return {
          id: newUser.id,
          email: newUser.email,
          name: newUser.name,
        };
      }),

    login: publicProcedure
      .input(
        z.object({
          email: z.string().email("Correo electrónico inválido"),
          password: z.string().min(1, "Ingresa tu contraseña"),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const user = await getUserByEmail(input.email);
        if (!user || !user.passwordHash) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Credenciales de acceso incorrectas.",
          });
        }

        const isValidPassword = await bcrypt.compare(input.password, user.passwordHash);
        if (!isValidPassword) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Credenciales de acceso incorrectas.",
          });
        }

        await updateLastSignedIn(user.id);

        const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, {
          expiresIn: "7d",
        });

        ctx.res.cookie("auth_token", token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        return {
          id: user.id,
          email: user.email,
          name: user.name,
        };
      }),

    me: publicProcedure.query(opts => opts.ctx.user),

    logout: publicProcedure.mutation(({ ctx }) => {
      ctx.res.clearCookie("auth_token");
      return { success: true };
    }),
  }),

  content: router({
    list: protectedProcedure.query(({ ctx }) => getContentForUser(ctx.user.id)),
    sources: protectedProcedure.query(({ ctx }) => getSourcesForUser(ctx.user.id)),
    add: protectedProcedure
      .input(
        z.object({
          name: z.string().trim().min(1).max(160),
          sourceType: z.enum(["url", "m3u", "m3u8"]),
          payload: z.string().trim().min(1).max(500_000),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const parsed = await parsePlaylist(input.payload, input.sourceType);
        return createContentForUser(
          ctx.user.id,
          {
            name: input.name,
            sourceType: input.sourceType,
            sourceUrl: input.sourceType === "url" ? input.payload : null,
            rawContent: input.sourceType === "url" ? null : input.payload,
          },
          parsed.map(item => ({
            title: item.title,
            category: item.category,
            playbackUrl: item.playbackUrl,
            logoUrl: item.logoUrl ?? null,
            createdAt: new Date(),
          }))
        );
      }),
    remove: protectedProcedure
      .input(z.object({ sourceId: z.number().int().positive() }))
      .mutation(async ({ ctx, input }) => ({
        deleted: await deleteSourceForUser(ctx.user.id, input.sourceId),
      })),
    preferences: protectedProcedure.query(({ ctx }) => getPreferencesForUser(ctx.user.id)),
    savePreferences: protectedProcedure
      .input(
        z.object({
          lastContentItemId: z.number().int().positive().nullable(),
          preferredQuality: z.string().regex(/^(auto|\d+)$/).max(32),
        })
      )
      .mutation(({ ctx, input }) => savePreferencesForUser(ctx.user.id, input)),
  }),
});

export type AppRouter = typeof appRouter;