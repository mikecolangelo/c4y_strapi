/**
 * SSE (Server-Sent Events) controller for real-time notifications.
 *
 * ADDITIVE custom controller: it does not override any Strapi core behaviour.
 * The endpoint authenticates the connected user, registers the response stream
 * with the in-memory hub, emits an initial comment plus periodic keep-alive
 * pings, and cleans up on disconnect.
 */
import type { Context } from 'koa';
import { notificationEventHub, type HubClient } from '../../../extensions/realtime/event-hub';

/** Interval between keep-alive pings (ms). Keeps proxies from closing idle connections. */
const KEEP_ALIVE_MS = 25_000;

/**
 * Resolves the numeric user-profile id and coarse role for the authenticated
 * users-permissions user. SSE auth relies on the standard `users-permissions`
 * policy having populated `ctx.state.user`; we then map that to the matching
 * user-profile (the recipient relation target).
 */
async function resolveProfile(
  ctx: Context
): Promise<{ userId: number; role: string | null } | null> {
  const authUser = ctx.state.user as { email?: string } | undefined;
  if (!authUser?.email) {
    return null;
  }

  const profiles = await strapi.entityService.findMany('api::user-profile.user-profile', {
    filters: { email: { $eq: authUser.email } },
    fields: ['id', 'role'],
    limit: 1,
  });

  const profile = Array.isArray(profiles) ? profiles[0] : null;
  if (!profile?.id) {
    return null;
  }
  return { userId: Number(profile.id), role: (profile.role as string) ?? null };
}

export default {
  async stream(ctx: Context) {
    const profile = await resolveProfile(ctx);
    if (!profile) {
      return ctx.unauthorized('Not authenticated');
    }

    const res = ctx.res;

    // Switch the connection to an SSE stream and take over the raw response.
    ctx.request.socket.setTimeout(0);
    ctx.req.socket.setNoDelay(true);
    ctx.req.socket.setKeepAlive(true);
    ctx.respond = false; // tell Koa not to handle the response body
    ctx.status = 200;

    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    });

    // Initial comment so the browser fires `onopen` immediately.
    res.write(': connected\n\n');

    const client: HubClient = {
      userId: profile.userId,
      role: profile.role,
      send: (frame: string) => {
        res.write(frame);
      },
    };
    const unregister = notificationEventHub.register(client);

    const keepAlive = setInterval(() => {
      // SSE comment frames are ignored by clients but keep the socket alive.
      res.write(': ping\n\n');
    }, KEEP_ALIVE_MS);

    const cleanup = () => {
      clearInterval(keepAlive);
      unregister();
    };

    ctx.req.on('close', cleanup);
    ctx.req.on('error', cleanup);

    // Keep the controller pending until the client disconnects.
    await new Promise<void>((resolve) => {
      ctx.req.on('close', resolve);
      ctx.req.on('error', resolve);
    });
  },
};
