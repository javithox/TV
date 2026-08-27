import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { createContentForUser, deleteSourceForUser, getContentForUser, getPreferencesForUser, getSourcesForUser, savePreferencesForUser } from "./db";
import { parsePlaylist } from "./contentParser";

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  content: router({
    list: protectedProcedure.query(({ ctx }) => getContentForUser(ctx.user.id)),
    sources: protectedProcedure.query(({ ctx }) => getSourcesForUser(ctx.user.id)),
    add: protectedProcedure
      .input(z.object({
        name: z.string().trim().min(1).max(160),
        sourceType: z.enum(["url", "m3u", "m3u8"]),
        payload: z.string().trim().min(1).max(500_000),
      }))
      .mutation(async ({ ctx, input }) => {
        const parsed = await parsePlaylist(input.payload, input.sourceType);
        return createContentForUser(ctx.user.id, {
          name: input.name,
          sourceType: input.sourceType,
          sourceUrl: input.sourceType === "url" ? input.payload : null,
          rawContent: input.sourceType === "url" ? null : input.payload,
        }, parsed.map(item => ({
          title: item.title,
          category: item.category,
          playbackUrl: item.playbackUrl,
          logoUrl: item.logoUrl ?? null,
          createdAt: new Date(),
        })));
      }),
    remove: protectedProcedure
      .input(z.object({ sourceId: z.number().int().positive() }))
      .mutation(async ({ ctx, input }) => ({
        deleted: await deleteSourceForUser(ctx.user.id, input.sourceId),
      })),
    preferences: protectedProcedure.query(({ ctx }) => getPreferencesForUser(ctx.user.id)),
    savePreferences: protectedProcedure
      .input(z.object({
        lastContentItemId: z.number().int().positive().nullable(),
        preferredQuality: z.string().regex(/^(auto|\d+)$/).max(32),
      }))
      .mutation(({ ctx, input }) => savePreferencesForUser(ctx.user.id, input)),
  }),
});

export type AppRouter = typeof appRouter;
