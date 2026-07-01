// Lifecycle for user-profile.
//
// Creation logic lives in the frontend (API route) to avoid double-hashing the
// password — see frontend/app/api/user-profiles/route.ts.
//
// Deletion logic: when a user-profile is removed we must also cascade-delete its
// linked users-permissions account (the up_users row referenced by the
// `userAccount` relation). Otherwise the orphaned auth user keeps the
// email/username reserved and the contact can never be re-created with the same
// email ("email already taken"). Leads (role: 'lead') have no userAccount, so
// the cascade is a no-op for them.

/**
 * Delete the users-permissions account linked to a profile, if any.
 * Failures are logged but never thrown so they cannot block the profile deletion.
 */
async function deleteLinkedAccount(accountId: number) {
  if (!accountId) {
    return;
  }

  try {
    const userService = strapi.plugin('users-permissions').service('user');
    await userService.remove({ id: accountId });
    strapi.log.info(
      `Cascade-deleted users-permissions account ${accountId} for removed user-profile`
    );
  } catch (error) {
    strapi.log.warn(
      `Could not cascade-delete users-permissions account ${accountId} while deleting user-profile: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

/**
 * Load the profiles targeted by a (bulk) delete and cascade-delete their
 * linked userAccount. Wrapped so that any lookup failure is logged and never
 * blocks the underlying profile deletion.
 */
async function cascadeDeleteAccounts(where: unknown) {
  if (!where) {
    return;
  }

  try {
    const profiles = await strapi.db.query('api::user-profile.user-profile').findMany({
      where,
      populate: { userAccount: true },
    });

    for (const profile of profiles) {
      const account = profile?.userAccount;
      const accountId = account ? (typeof account === 'object' ? account.id : account) : null;

      if (accountId) {
        await deleteLinkedAccount(accountId);
      }
    }
  } catch (error) {
    strapi.log.error(
      `Error while cascading user-profile deletion to linked accounts: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

export default {
  // Single delete: DELETE /api/user-profiles/:id routes here.
  async beforeDelete(event: { params: { where?: unknown } }) {
    await cascadeDeleteAccounts(event.params?.where);
  },

  // Bulk delete: Strapi 5 may route some deletions through deleteMany.
  async beforeDeleteMany(event: { params: { where?: unknown } }) {
    await cascadeDeleteAccounts(event.params?.where);
  },
};
