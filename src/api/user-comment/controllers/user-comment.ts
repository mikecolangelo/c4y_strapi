/**
 * user-comment controller
 *
 * Adds light validation on top of the core controller: a comment must always
 * carry a non-empty `authorDocumentId` so the timeline can resolve its author.
 */

import { factories } from '@strapi/strapi';

function assertAuthor(value: unknown): string | null {
  if (typeof value !== 'string' || value.trim() === '') {
    return 'authorDocumentId is required and cannot be empty';
  }
  return null;
}

export default factories.createCoreController('api::user-comment.user-comment', () => ({
  async create(ctx) {
    const { data } = ctx.request.body ?? {};
    const error = assertAuthor(data?.authorDocumentId);
    if (error) {
      return ctx.badRequest(error);
    }
    return super.create(ctx);
  },

  async update(ctx) {
    const { data } = ctx.request.body ?? {};
    // Only validate when the field is part of the update payload.
    if (data?.authorDocumentId !== undefined) {
      const error = assertAuthor(data.authorDocumentId);
      if (error) {
        return ctx.badRequest(error);
      }
    }
    return super.update(ctx);
  },
}));
