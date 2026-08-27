import { z } from 'zod';

export const roomTemplateSchema = z.enum(['den', 'studio', 'lounge']);
export const archetypeSchema = z.enum(['terminal', 'tv', 'book', 'poster', 'arcade', 'pedestal', 'laptop', 'radio', 'file-box']);
export const sourceSchema = z.enum(['demo', 'manual', 'bookmark-html', 'config-import', 'future-extension']);
export const vec3Schema = z.tuple([z.number(), z.number(), z.number()]);

export const roomSchema = z.object({
  id: z.string().min(1), name: z.string().min(1).max(60), template: roomTemplateSchema,
  accent: z.string().regex(/^#[0-9a-fA-F]{6}$/), spawn: vec3Schema, isDemo: z.boolean(), createdAt: z.number(),
});

export const bookmarkObjectSchema = z.object({
  id: z.string().min(1), roomId: z.string().min(1), name: z.string().min(1).max(80), url: z.string().url(),
  archetype: archetypeSchema, icon: z.string(), color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  position: vec3Schema, rotation: z.number(), favorite: z.boolean(), usageCount: z.number().int().nonnegative(),
  collection: z.string().max(40).optional(), note: z.string().max(280).optional(),
  source: sourceSchema, isDemo: z.boolean(), createdAt: z.number(), updatedAt: z.number(),
});

export const activitySchema = z.object({ id:z.string(), objectId:z.string(), name:z.string(), url:z.string().url(), openedAt:z.number() });
export const preferencesSchema = z.object({
  lastRoomId:z.string(), trayOpen:z.boolean(), trayPinned:z.boolean(), reducedEffects:z.boolean(), hasEntered:z.boolean(),
  recentSearches:z.array(z.string().max(80)).max(6).default([]),
});

export const configEnvelopeSchema = z.object({
  schemaVersion:z.literal(1), exportedAt:z.number(), rooms:z.array(roomSchema), objects:z.array(bookmarkObjectSchema),
  activity:z.array(activitySchema), note:z.string().max(5000), preferences:preferencesSchema,
});

export type Room = z.infer<typeof roomSchema>;
export type RoomTemplate = z.infer<typeof roomTemplateSchema>;
export type BookmarkObject = z.infer<typeof bookmarkObjectSchema>;
export type Archetype = z.infer<typeof archetypeSchema>;
export type Activity = z.infer<typeof activitySchema>;
export type Preferences = z.infer<typeof preferencesSchema>;
export type ConfigEnvelopeV1 = z.infer<typeof configEnvelopeSchema>;
export type ModalName = 'add-site'|'edit-site'|'create-room'|'import-bookmarks'|'data'|'help'|null;
