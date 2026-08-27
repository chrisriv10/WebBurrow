import { z } from 'zod';

export const roomTemplateSchema = z.enum(['den', 'studio', 'lounge']);
export const archetypeSchema = z.enum(['terminal', 'tv', 'book', 'poster', 'arcade', 'pedestal', 'laptop', 'radio', 'file-box']);
export const lifecycleSchema = z.enum(['permanent', 'session']);
export const sourceSchema = z.enum(['demo', 'manual', 'bookmark-html', 'config-import', 'browser-extension', 'future-extension']);
export const vec3Schema = z.tuple([z.number(), z.number(), z.number()]);
export const integrationIdSchema = z.enum(['browser', 'github', 'weather', 'calendar', 'rss']);
export const trayModuleSchema = z.enum(['weather', 'calendar', 'github', 'feed', 'favorites', 'recent', 'note', 'browser-tabs', 'notifications']);

export const roomSchema = z.object({
  id: z.string().min(1), name: z.string().min(1).max(60), template: roomTemplateSchema,
  accent: z.string().regex(/^#[0-9a-fA-F]{6}$/), spawn: vec3Schema, lifecycle: lifecycleSchema.default('permanent'),
  isDemo: z.boolean(), createdAt: z.number(),
});

export const bookmarkObjectSchema = z.object({
  id: z.string().min(1), roomId: z.string().min(1), name: z.string().min(1).max(80), url: z.string().url(),
  archetype: archetypeSchema, icon: z.string(), color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  position: vec3Schema, rotation: z.number(), favorite: z.boolean(), usageCount: z.number().int().nonnegative(),
  collection: z.string().max(40).optional(), collectionId: z.string().optional(), note: z.string().max(280).optional(),
  lifecycle: lifecycleSchema.default('permanent'), source: sourceSchema, isDemo: z.boolean(), createdAt: z.number(), updatedAt: z.number(),
});

export const activitySchema = z.object({ id:z.string(), objectId:z.string(), name:z.string(), url:z.string().url(), openedAt:z.number() });
export const collectionSchema = z.object({ id:z.string().min(1), name:z.string().min(1).max(40), lifecycle:lifecycleSchema.default('permanent'), createdAt:z.number(), updatedAt:z.number() });
export const integrationConfigSchema = z.object({ id:integrationIdSchema, enabled:z.boolean(), settings:z.record(z.string(),z.unknown()), updatedAt:z.number() });
export const integrationCacheSchema = z.object({ id:z.string(), integrationId:integrationIdSchema, cacheKey:z.string(), data:z.unknown(), fetchedAt:z.number(), expiresAt:z.number(), etag:z.string().optional(), error:z.string().max(500).optional() });
export const integrationObjectKindSchema = z.enum(['github-repo','weather-window','calendar','feed','recent-shelf','favorites-shelf','notes-board','activity-board']);
export const integrationObjectSchema = z.object({
  id:z.string(), integrationId:integrationIdSchema, kind:integrationObjectKindSchema, roomId:z.string(), reference:z.string().max(300).optional(),
  position:vec3Schema, rotation:z.number(), accent:z.string().regex(/^#[0-9a-fA-F]{6}$/), lifecycle:lifecycleSchema.default('permanent'), createdAt:z.number(), updatedAt:z.number(),
});
export const calendarSourceSchema = z.object({ id:z.string(), name:z.string().min(1).max(80), kind:z.enum(['local','subscription']), url:z.string().url().optional(), enabled:z.boolean(), refreshMinutes:z.number().int().min(15).max(1440), createdAt:z.number(), updatedAt:z.number() });
export const calendarEventSchema = z.object({ id:z.string(), sourceId:z.string(), title:z.string().min(1).max(160), startAt:z.number(), endAt:z.number(), allDay:z.boolean(), location:z.string().max(240).optional(), url:z.string().url().optional(), description:z.string().max(500).optional(), updatedAt:z.number() });
export const feedSourceSchema = z.object({ id:z.string(), name:z.string().min(1).max(80), url:z.string().url(), enabled:z.boolean(), refreshMinutes:z.number().int().min(15).max(60), createdAt:z.number(), updatedAt:z.number() });
export const feedItemSchema = z.object({ id:z.string(), sourceId:z.string(), title:z.string().min(1).max(240), url:z.string().url(), source:z.string().max(100), publishedAt:z.number(), read:z.boolean(), firstSeenAt:z.number() });
export const notificationSchema = z.object({ id:z.string(), kind:z.enum(['info','success','warning','error']), title:z.string().max(100), body:z.string().max(300), createdAt:z.number(), dismissedAt:z.number().optional(), dedupeKey:z.string().max(120).optional() });

export const preferencesSchema = z.object({
  lastRoomId:z.string(), trayOpen:z.boolean(), trayPinned:z.boolean(), reducedEffects:z.boolean(), hasEntered:z.boolean(),
  recentSearches:z.array(z.string().max(80)).max(6).default([]), searchProvider:z.enum(['duckduckgo','google','bing']).default('duckduckgo'),
  trayModules:z.array(trayModuleSchema).max(4).default(['favorites','recent','note']), systemTrayEnabled:z.boolean().default(false),
  minimizeToTray:z.boolean().default(false), temperatureUnit:z.enum(['celsius','fahrenheit']).default('fahrenheit'), windowEffects:z.boolean().default(true),
});

const configBase = { exportedAt:z.number(), rooms:z.array(roomSchema), objects:z.array(bookmarkObjectSchema), activity:z.array(activitySchema), note:z.string().max(5000), preferences:preferencesSchema };
export const configEnvelopeV1Schema = z.object({schemaVersion:z.literal(1),...configBase});
export const configEnvelopeV2Schema = z.object({
  schemaVersion:z.literal(2), ...configBase, collections:z.array(collectionSchema), integrations:z.array(integrationConfigSchema), integrationObjects:z.array(integrationObjectSchema),
  calendarSources:z.array(calendarSourceSchema), calendarEvents:z.array(calendarEventSchema), feedSources:z.array(feedSourceSchema), feedItems:z.array(feedItemSchema), notifications:z.array(notificationSchema),
});
export const configEnvelopeSchema = z.union([configEnvelopeV1Schema,configEnvelopeV2Schema]);

export type Room = z.infer<typeof roomSchema>;
export type RoomTemplate = z.infer<typeof roomTemplateSchema>;
export type BookmarkObject = z.infer<typeof bookmarkObjectSchema>;
export type Archetype = z.infer<typeof archetypeSchema>;
export type Activity = z.infer<typeof activitySchema>;
export type Collection = z.infer<typeof collectionSchema>;
export type IntegrationId = z.infer<typeof integrationIdSchema>;
export type IntegrationConfig = z.infer<typeof integrationConfigSchema>;
export type IntegrationCache = z.infer<typeof integrationCacheSchema>;
export type IntegrationObject = z.infer<typeof integrationObjectSchema>;
export type CalendarSource = z.infer<typeof calendarSourceSchema>;
export type CalendarEvent = z.infer<typeof calendarEventSchema>;
export type FeedSource = z.infer<typeof feedSourceSchema>;
export type FeedItem = z.infer<typeof feedItemSchema>;
export type BurrowNotification = z.infer<typeof notificationSchema>;
export type TrayModule = z.infer<typeof trayModuleSchema>;
export type Preferences = z.infer<typeof preferencesSchema>;
export type ConfigEnvelopeV1 = z.infer<typeof configEnvelopeV1Schema>;
export type ConfigEnvelopeV2 = z.infer<typeof configEnvelopeV2Schema>;
export type ConfigEnvelope = ConfigEnvelopeV1|ConfigEnvelopeV2;
export type ModalName = 'add-site'|'edit-site'|'create-room'|'import-bookmarks'|'data'|'help'|'integrations'|'live-detail'|null;
