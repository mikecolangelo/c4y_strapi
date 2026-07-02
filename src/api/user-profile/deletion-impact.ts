/**
 * Non-destructive "deletion impact" computation for user-profiles (CONTACTOS).
 *
 * Given a list of profile `documentId` strings (the same ids the frontend
 * batch-delete sends to DELETE /api/user-profiles/:id), this resolves them to
 * numeric ids and COUNTS every related record that references those profiles.
 *
 * IMPORTANT: this module is strictly READ-ONLY. It never deletes or mutates a
 * single row — it only runs `count` queries so the UI can warn the operator
 * before they confirm a bulk delete.
 *
 * By Strapi 5 default, deleting a profile only removes the join/link rows; the
 * related deals/clients/comments/etc. PERSIST (their FK is nulled / the link is
 * dropped) — they are NOT cascade-deleted. The only cascade in this codebase is
 * the linked users-permissions account (see ../content-types/.../lifecycles.ts).
 * The counts here therefore describe records that would be ORPHANED, plus the
 * accounts that would actually be removed.
 */

import type { Core } from '@strapi/strapi';

/**
 * Map of response key -> { model uid, relation field on that model that points
 * back to api::user-profile }. Each count answers: "how many <model> rows
 * reference one of the target profiles through <field>?".
 *
 * Where a profile is referenced by more than one field on the same model (e.g.
 * supply-request has `requester` and `approvedBy`), we OR the fields so a row is
 * counted once even if it matches both.
 */
const RELATION_COUNTS: Record<string, { uid: string; fields: string[] }> = {
  deals: { uid: 'api::deal.deal', fields: ['seller'] },
  clients: { uid: 'api::client.client', fields: ['salesperson'] },
  appointments: { uid: 'api::appointment.appointment', fields: ['assignedTo'] },
  userComments: { uid: 'api::user-comment.user-comment', fields: ['subject'] },
  communicationLogs: {
    uid: 'api::communication-log.communication-log',
    fields: ['owner'],
  },
  serviceOrders: { uid: 'api::service-order.service-order', fields: ['driver'] },
  serviceNotes: { uid: 'api::service-note.service-note', fields: ['author'] },
  inventoryNotes: { uid: 'api::inventory-note.inventory-note', fields: ['author'] },
  // notification references a profile via recipient, author and assignedUsers.
  notifications: {
    uid: 'api::notification.notification',
    fields: ['recipient', 'author', 'assignedUsers'],
  },
  driverHistory: {
    uid: 'api::driver-history.driver-history',
    fields: ['driver'],
  },
  financings: { uid: 'api::financing.financing', fields: ['client'] },
  weeklyCollections: {
    uid: 'api::weekly-collection.weekly-collection',
    fields: ['client'],
  },
  billingRecords: {
    uid: 'api::billing-record.billing-record',
    fields: ['verifiedBy'],
  },
  invoices: { uid: 'api::invoice.invoice', fields: ['client'] },
  fleetReminders: {
    uid: 'api::fleet-reminder.fleet-reminder',
    fields: ['assignedUsers'],
  },
  inventoryRequests: {
    uid: 'api::inventory-request.inventory-request',
    fields: ['requester', 'approvedBy'],
  },
  supplyRequests: {
    uid: 'api::supply-request.supply-request',
    fields: ['requester', 'approvedBy'],
  },
};

export type DeletionImpact = {
  contacts: number;
  accounts: number;
  totalRelated: number;
  related: Record<keyof typeof RELATION_COUNTS, number>;
};

/**
 * Resolve incoming `documentId` strings to the matching profiles, returning
 * their numeric ids plus the count of linked userAccounts (up_users rows that
 * the delete cascade would actually remove).
 */
async function resolveProfiles(
  strapi: Core.Strapi,
  documentIds: string[]
): Promise<{ profileIds: number[]; accounts: number }> {
  const profiles = await strapi.db.query('api::user-profile.user-profile').findMany({
    where: { documentId: { $in: documentIds } },
    populate: { userAccount: true },
  });

  const profileIds: number[] = [];
  let accounts = 0;

  for (const profile of profiles) {
    profileIds.push(profile.id);
    if (profile.userAccount) {
      accounts += 1;
    }
  }

  return { profileIds, accounts };
}

/**
 * Count how many rows of a given model reference any of the target profiles
 * through one or more relation fields (fields are OR-ed so a row is counted
 * once even if it matches several of them).
 */
async function countForModel(
  strapi: Core.Strapi,
  uid: string,
  fields: string[],
  profileIds: number[]
): Promise<number> {
  const filter =
    fields.length === 1
      ? { [fields[0]]: { id: { $in: profileIds } } }
      : { $or: fields.map((field) => ({ [field]: { id: { $in: profileIds } } })) };

  return strapi.db.query(uid).count({ where: filter });
}

/**
 * Compute the full, READ-ONLY deletion impact for a set of profile documentIds.
 * Counts are parallelized. If no ids resolve to profiles, every count is 0.
 */
export async function computeDeletionImpact(
  strapi: Core.Strapi,
  documentIds: string[]
): Promise<DeletionImpact> {
  const keys = Object.keys(RELATION_COUNTS) as Array<keyof typeof RELATION_COUNTS>;
  const emptyRelated = Object.fromEntries(keys.map((k) => [k, 0])) as DeletionImpact['related'];

  const ids = Array.from(new Set((documentIds ?? []).filter((id) => typeof id === 'string')));
  if (ids.length === 0) {
    return { contacts: 0, accounts: 0, totalRelated: 0, related: emptyRelated };
  }

  const { profileIds, accounts } = await resolveProfiles(strapi, ids);

  if (profileIds.length === 0) {
    return { contacts: 0, accounts: 0, totalRelated: 0, related: emptyRelated };
  }

  const counts = await Promise.all(
    keys.map((key) => {
      const { uid, fields } = RELATION_COUNTS[key];
      return countForModel(strapi, uid, fields, profileIds);
    })
  );

  const related = { ...emptyRelated };
  let totalRelated = 0;
  keys.forEach((key, index) => {
    const value = counts[index] ?? 0;
    related[key] = value;
    totalRelated += value;
  });

  return {
    contacts: profileIds.length,
    accounts,
    totalRelated,
    related,
  };
}
