import { beforeEach, describe, expect, it, vi } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

const mocks = vi.hoisted(() => ({
  getContentForUser: vi.fn(async (userId: number) => [{ id: userId, title: `item-${userId}` }]),
  getSourcesForUser: vi.fn(async (userId: number) => [{ id: userId, userId }]),
  deleteSourceForUser: vi.fn(async () => true),
  createContentForUser: vi.fn(async () => ({ sourceId: 9, itemCount: 1 })),
  getPreferencesForUser: vi.fn(async (userId: number) => ({ userId, lastContentItemId: 4, preferredQuality: "1" })),
  savePreferencesForUser: vi.fn(async (userId: number, preferences: { lastContentItemId: number | null; preferredQuality: string }) => ({ userId, ...preferences })),
}));

vi.mock("./db", async () => {
  const actual = await vi.importActual<typeof import("./db")>("./db");
  return { ...actual, ...mocks };
});

vi.mock("./contentParser", () => ({
  parsePlaylist: vi.fn(async () => [{ title: "Demo", category: "GENERAL", playbackUrl: "https://cdn.example/demo.m3u8" }]),
}));

const { getContentForUser, getSourcesForUser, deleteSourceForUser, createContentForUser, getPreferencesForUser, savePreferencesForUser } = mocks;

function createContext(user?: TrpcContext["user"]): TrpcContext {
  return {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

const user = (id: number): NonNullable<TrpcContext["user"]> => ({
  id,
  openId: `user-${id}`,
  email: `user-${id}@example.com`,
  name: `User ${id}`,
  loginMethod: "test",
  role: "user",
  createdAt: new Date(),
  updatedAt: new Date(),
  lastSignedIn: new Date(),
});

describe("content procedures", () => {
  beforeEach(() => vi.clearAllMocks());

  it("rejects protected content procedures without a session", async () => {
    const caller = appRouter.createCaller(createContext());
    await expect(caller.content.list()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    await expect(caller.content.sources()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    await expect(caller.content.remove({ sourceId: 1 })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    await expect(caller.content.add({ name: "Demo", sourceType: "url", payload: "https://cdn.example/demo.m3u8" })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    await expect(caller.content.preferences()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    await expect(caller.content.savePreferences({ lastContentItemId: 1, preferredQuality: "auto" })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("passes the authenticated user id to list and source queries", async () => {
    const firstCaller = appRouter.createCaller(createContext(user(11)));
    const secondCaller = appRouter.createCaller(createContext(user(22)));

    await expect(firstCaller.content.list()).resolves.toEqual([{ id: 11, title: "item-11" }]);
    await expect(secondCaller.content.list()).resolves.toEqual([{ id: 22, title: "item-22" }]);
    await expect(firstCaller.content.sources()).resolves.toEqual([{ id: 11, userId: 11 }]);
    await expect(secondCaller.content.sources()).resolves.toEqual([{ id: 22, userId: 22 }]);
    expect(getContentForUser).toHaveBeenNthCalledWith(1, 11);
    expect(getContentForUser).toHaveBeenNthCalledWith(2, 22);
    expect(getSourcesForUser).toHaveBeenNthCalledWith(1, 11);
    expect(getSourcesForUser).toHaveBeenNthCalledWith(2, 22);
  });

  it("passes the authenticated user id when adding content", async () => {
    const caller = appRouter.createCaller(createContext(user(44)));
    await expect(caller.content.add({ name: "Mi fuente", sourceType: "url", payload: "https://cdn.example/demo.m3u8" })).resolves.toEqual({ sourceId: 9, itemCount: 1 });
    expect(createContentForUser).toHaveBeenCalledWith(44, expect.objectContaining({ name: "Mi fuente", sourceType: "url" }), [expect.objectContaining({ title: "Demo" })]);
  });

  it("reads and saves preferences for the authenticated user", async () => {
    const caller = appRouter.createCaller(createContext(user(55)));
    await expect(caller.content.preferences()).resolves.toMatchObject({ userId: 55, preferredQuality: "1" });
    await expect(caller.content.savePreferences({ lastContentItemId: 8, preferredQuality: "1" })).resolves.toEqual({ userId: 55, lastContentItemId: 8, preferredQuality: "1" });
    expect(getPreferencesForUser).toHaveBeenCalledWith(55);
    expect(savePreferencesForUser).toHaveBeenCalledWith(55, { lastContentItemId: 8, preferredQuality: "1" });
  });

  it("passes the authenticated user id when deleting a source", async () => {
    const caller = appRouter.createCaller(createContext(user(33)));
    await expect(caller.content.remove({ sourceId: 7 })).resolves.toEqual({ deleted: true });
    expect(deleteSourceForUser).toHaveBeenCalledWith(33, 7);
  });
});
