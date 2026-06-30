/**
 * Commit message linting using the Conventional Commits standard.
 * Enforced by the Husky `commit-msg` hook.
 *
 * Format: <type>(<optional scope>): <subject>
 * Examples:
 *   feat(permissions): grant service catalog access to Authenticated role
 *   fix(invoice): correct duplicate billing document
 *   chore(deps): bump @strapi/strapi to 5.33.3
 */
module.exports = {
  extends: ['@commitlint/config-conventional'],
};
