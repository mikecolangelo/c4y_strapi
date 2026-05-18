import { errors } from '@strapi/utils';
import type { Context } from 'koa';
import type { Role } from '../roles/role-permissions';

const { ForbiddenError } = errors; // eslint-disable-line @typescript-eslint/no-unsafe-member-access

type PolicyConfig = {
  allowed: Role[];
};

export default (config: PolicyConfig) => {
  return async (ctx: Context, next: () => Promise<unknown>) => {
    const role = getRoleFromState(ctx);

    if (!role || !config.allowed.includes(role)) {
      throw new ForbiddenError('No tienes permisos suficientes para esta acción.');
    }

    return next();
  };
};

const getRoleFromState = (ctx: Context): Role | null => {
  const profileRole = ctx.state?.user?.role as Role | undefined;
  return profileRole ?? null;
};
