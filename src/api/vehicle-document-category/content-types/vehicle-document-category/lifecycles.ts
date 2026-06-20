/**
 * Lifecycle hooks for vehicle-document-category.
 *
 * The `slug` attribute is a required `uid`, but Strapi does not auto-generate
 * uid fields when creating through the REST/content API (only the admin panel
 * does). Without this hook, creating a category via the app fails with a
 * validation error ("slug must be defined"). Here we derive the slug from the
 * name whenever it is missing, so the frontend only needs to send the name.
 */
import { slugify } from './slugify';

export default {
  beforeCreate(event: any) {
    const { data } = event.params;
    if (data && !data.slug && data.name) {
      data.slug = slugify(data.name);
    }
  },

  beforeUpdate(event: any) {
    // Keep the slug in sync when the name is renamed and no slug is provided.
    const { data } = event.params;
    if (data && data.name && !data.slug) {
      data.slug = slugify(data.name);
    }
  },
};
