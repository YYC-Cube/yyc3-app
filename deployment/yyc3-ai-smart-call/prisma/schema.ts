import { pgTable, serial, text, timestamp, boolean, jsonb, varchar } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  clerkId: text("clerk_id").notNull().unique(),
  email: text("email").notNull(),
  username: text("username").notNull(),
  avatar: text("avatar"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const conversations = pgTable("conversations", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.clerkId),
  title: text("title").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  conversationId: text("conversation_id").notNull().references(() => conversations.id),
  role: text("role").notNull(), // 'user' | 'assistant' | 'system'
  content: text("content").notNull(),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const voiceSettings = pgTable("voice_settings", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.clerkId),
  voice: varchar("voice", { length: 50 }).default("zh-CN-XiaoxiaoNeural"),
  speed: serial("speed").default(1),
  pitch: serial("pitch").default(1),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});