import { and, desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { contentItems, contentSources, InsertContentItem, InsertContentSource, InsertUser, userPreferences, users } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function getContentForUser(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");

  return db.select({
    id: contentItems.id,
    sourceId: contentItems.sourceId,
    title: contentItems.title,
    category: contentItems.category,
    playbackUrl: contentItems.playbackUrl,
    logoUrl: contentItems.logoUrl,
    createdAt: contentItems.createdAt,
    sourceName: contentSources.name,
    sourceType: contentSources.sourceType,
  })
    .from(contentItems)
    .innerJoin(contentSources, eq(contentItems.sourceId, contentSources.id))
    .where(eq(contentItems.userId, userId))
    .orderBy(desc(contentItems.createdAt));
}

export async function getSourcesForUser(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  return db.select().from(contentSources).where(eq(contentSources.userId, userId)).orderBy(desc(contentSources.createdAt));
}

export async function createContentForUser(
  userId: number,
  source: Omit<InsertContentSource, "userId">,
  items: Array<Omit<InsertContentItem, "userId" | "sourceId">>,
) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");

  return db.transaction(async tx => {
    const sourceResult = await tx.insert(contentSources).values({ ...source, userId });
    const sourceId = Number(sourceResult[0].insertId);
    if (!sourceId) throw new Error("No se pudo crear la fuente.");

    await tx.insert(contentItems).values(items.map(item => ({ ...item, userId, sourceId })));
    return { sourceId, itemCount: items.length };
  });
}

export async function deleteSourceForUser(userId: number, sourceId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const result = await db.delete(contentSources).where(and(eq(contentSources.id, sourceId), eq(contentSources.userId, userId)));
  return Number(result[0].affectedRows) > 0;
}

export async function getPreferencesForUser(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const rows = await db.select().from(userPreferences).where(eq(userPreferences.userId, userId)).limit(1);
  return rows[0] ?? { lastContentItemId: null, preferredQuality: "auto" };
}

export async function savePreferencesForUser(userId: number, preferences: { lastContentItemId: number | null; preferredQuality: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");

  if (preferences.lastContentItemId !== null) {
    const ownedItem = await db.select({ id: contentItems.id })
      .from(contentItems)
      .where(and(eq(contentItems.id, preferences.lastContentItemId), eq(contentItems.userId, userId)))
      .limit(1);
    if (ownedItem.length === 0) throw new Error("El canal seleccionado no pertenece a tu cuenta.");
  }

  await db.insert(userPreferences).values({
    userId,
    lastContentItemId: preferences.lastContentItemId,
    preferredQuality: preferences.preferredQuality,
  }).onDuplicateKeyUpdate({
    set: {
      lastContentItemId: preferences.lastContentItemId,
      preferredQuality: preferences.preferredQuality,
      updatedAt: new Date(),
    },
  });
  return getPreferencesForUser(userId);
}
