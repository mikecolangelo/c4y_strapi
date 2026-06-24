/**
 * In-memory Server-Sent Events (SSE) hub for real-time notifications.
 *
 * This is an ADDITIVE module: it does not touch Strapi core. A single shared
 * hub instance keeps the set of currently connected clients (one per open SSE
 * request) and broadcasts notification events to the relevant recipients.
 *
 * LIMITATION: the hub lives in process memory, so it only works for a SINGLE
 * Strapi instance. Running multiple instances behind a load balancer would
 * require an external pub/sub (e.g. Redis) to fan events across processes.
 */

/** A real-time event payload pushed to connected clients. */
export interface RealtimeEvent {
  /** Logical event name, e.g. `notification.created`. */
  readonly event: string;
  /** Arbitrary JSON-serialisable data describing what changed. */
  readonly data: Record<string, unknown>;
}

/**
 * Identifies which connected users should receive an event. When `userId` is
 * set, only that user's connections receive it; otherwise the event is a
 * broadcast delivered to everyone (e.g. announcements with `targetAudience`).
 */
export interface EventAudience {
  /** Numeric user-profile id of the single recipient, when targeted. */
  readonly userId?: number | null;
  /** Coarse audience (`all` | `admins` | `drivers`) for broadcast events. */
  readonly targetAudience?: string | null;
}

/** A single connected SSE client. */
export interface HubClient {
  /** Numeric user-profile id this connection authenticated as. */
  readonly userId: number;
  /** Coarse role used to match broadcast `targetAudience`. */
  readonly role: string | null;
  /** Writes a pre-formatted SSE frame to the client's stream. */
  readonly send: (frame: string) => void;
}

/**
 * Decides whether a given client should receive an event, given the event's
 * intended audience. Pure function so it can be unit-tested in isolation.
 */
export function audienceMatchesClient(
  audience: EventAudience,
  client: Pick<HubClient, 'userId' | 'role'>
): boolean {
  // Targeted event: only the named recipient receives it.
  if (audience.userId !== undefined && audience.userId !== null) {
    return audience.userId === client.userId;
  }

  // Broadcast event: match the coarse audience against the client's role.
  const target = audience.targetAudience ?? 'all';
  if (target === 'all' || target === '') {
    return true;
  }
  if (target === 'admins') {
    return client.role === 'admin' || client.role === 'super-admin';
  }
  if (target === 'drivers') {
    return client.role !== 'admin' && client.role !== 'super-admin';
  }
  return false;
}

/**
 * Formats a `RealtimeEvent` as a wire-ready SSE frame. Each frame ends with a
 * blank line, per the SSE spec. Pure function (testable).
 */
export function formatSseFrame(payload: RealtimeEvent): string {
  const data = JSON.stringify(payload.data);
  return `event: ${payload.event}\ndata: ${data}\n\n`;
}

/** The SSE hub: tracks connections and broadcasts events to matching clients. */
export class NotificationEventHub {
  private readonly clients = new Set<HubClient>();

  /** Registers a connection. Returns an unsubscribe function. */
  register(client: HubClient): () => void {
    this.clients.add(client);
    return () => {
      this.clients.delete(client);
    };
  }

  /** Number of currently connected clients (useful for tests/diagnostics). */
  get size(): number {
    return this.clients.size;
  }

  /**
   * Broadcasts an event to every connected client whose audience matches.
   * Returns the number of clients the event was delivered to.
   */
  publish(payload: RealtimeEvent, audience: EventAudience): number {
    const frame = formatSseFrame(payload);
    let delivered = 0;
    for (const client of this.clients) {
      if (audienceMatchesClient(audience, client)) {
        try {
          client.send(frame);
          delivered += 1;
        } catch {
          // A failed write means the client is gone; drop it defensively.
          this.clients.delete(client);
        }
      }
    }
    return delivered;
  }
}

/**
 * Singleton hub shared across the whole Strapi process. Lifecycles publish to
 * it and the SSE controller registers connections against it.
 */
export const notificationEventHub = new NotificationEventHub();
