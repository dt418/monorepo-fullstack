import { z } from 'zod';
import { TaskSchema } from './task';
import { UserSchema } from './user';

// ============ WebSocket Events ============
export const WsEventTypeSchema = z.enum([
  // Task events
  'task:created',
  'task:updated',
  'task:deleted',
  // User events
  'user:online',
  'user:offline',
  // Presence
  'presence:join',
  'presence:leave',
  // System
  'error',
  'ping',
  'pong',
]);
export type WsEventType = z.infer<typeof WsEventTypeSchema>;

// ============ Event Payloads ============
export const TaskEventPayloadSchema = z.object({
  type: z.enum(['task:created', 'task:updated', 'task:deleted']),
  task: TaskSchema.optional(),
  taskId: z.string().uuid().optional(),
});
export type TaskEventPayload = z.infer<typeof TaskEventPayloadSchema>;

export const PresenceEventPayloadSchema = z.object({
  type: z.enum(['presence:join', 'presence:leave', 'user:online', 'user:offline']),
  user: UserSchema.pick({ id: true, name: true, email: true }),
  room: z.string().optional(),
});
export type PresenceEventPayload = z.infer<typeof PresenceEventPayloadSchema>;

export const WsMessageSchema = z.object({
  event: WsEventTypeSchema,
  payload: z.unknown(),
  timestamp: z.coerce.date(),
});
export type WsMessage = z.infer<typeof WsMessageSchema>;

// ============ Room Types ============
export const RoomTypeSchema = z.enum(['global', 'user', 'task']);
export type RoomType = z.infer<typeof RoomTypeSchema>;

export const JoinRoomSchema = z.object({
  room: z.string(),
  type: RoomTypeSchema,
});
export type JoinRoom = z.infer<typeof JoinRoomSchema>;
