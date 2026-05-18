/**
 * setup-fleet-permissions.js
 * 
 * Script limpio para configurar permisos de API pública y autenticada
 * sobre los content-types vehicle-state y fleet-mileage-history.
 * 
 * NO utiliza SQL crudo. Opera exclusivamente a través de la API REST
 * oficial de Strapi v5 (Admin Login + Users-Permissions Plugin).
 * 
 * Uso:
 *   ADMIN_EMAIL=admin@example.com ADMIN_PASSWORD=supersecret \
 *     STRAPI_BASE_URL=http://127.0.0.1:1337 \
 *     node backend/scripts/setup-fleet-permissions.js
 */

const STRAPI_BASE_URL = process.env.STRAPI_BASE_URL || 'http://127.0.0.1:1337';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

const CONTENT_TYPES = [
  {
    uid: 'api::vehicle-state.vehicle-state',
    apiName: 'vehicle-state',
    controller: 'vehicle-state',
  },
  {
    uid: 'api::fleet-mileage-history.fleet-mileage-history',
    apiName: 'fleet-mileage-history',
    controller: 'fleet-mileage-history',
  },
];

const REQUIRED_ACTIONS = ['find', 'create', 'update', 'delete'];

async function adminLogin() {
  const res = await fetch(`${STRAPI_BASE_URL}/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Admin login failed (${res.status}): ${text}`);
  }

  const json = await res.json();
  const token = json.data?.token;
  if (!token) {
    throw new Error('Admin login response did not contain a token');
  }
  return token;
}

async function getRoles(adminToken) {
  const res = await fetch(`${STRAPI_BASE_URL}/users-permissions/roles`, {
    headers: {
      Authorization: `Bearer ${adminToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to fetch roles (${res.status}): ${text}`);
  }

  const json = await res.json();
  return json.roles || [];
}

async function getRoleDetails(adminToken, roleId) {
  const res = await fetch(`${STRAPI_BASE_URL}/users-permissions/roles/${roleId}`, {
    headers: {
      Authorization: `Bearer ${adminToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to fetch role ${roleId} (${res.status}): ${text}`);
  }

  const json = await res.json();
  return json.role;
}

async function updateRole(adminToken, roleId, permissionsPayload) {
  const res = await fetch(`${STRAPI_BASE_URL}/users-permissions/roles/${roleId}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${adminToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ permissions: permissionsPayload }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to update role ${roleId} (${res.status}): ${text}`);
  }

  return res.json();
}

function ensurePermission(permissions, apiName, controller, action) {
  if (!permissions[apiName]) {
    permissions[apiName] = { controllers: {} };
  }
  if (!permissions[apiName].controllers[controller]) {
    permissions[apiName].controllers[controller] = {};
  }
  permissions[apiName].controllers[controller][action] = { enabled: true, policy: '' };
}

async function main() {
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
    console.error('Error: ADMIN_EMAIL and ADMIN_PASSWORD environment variables are required.');
    process.exit(1);
  }

  console.log(`[setup-fleet-permissions] Connecting to ${STRAPI_BASE_URL}...`);
  const adminToken = await adminLogin();
  console.log('[setup-fleet-permissions] Admin authenticated.');

  const roles = await getRoles(adminToken);
  const targetRoles = roles.filter((r) => r.type === 'public' || r.type === 'authenticated');

  if (targetRoles.length === 0) {
    throw new Error('Could not find Public or Authenticated roles');
  }

  for (const role of targetRoles) {
    console.log(`[setup-fleet-permissions] Processing role: ${role.name} (${role.type})...`);
    const roleDetails = await getRoleDetails(adminToken, role.id);
    const permissions = roleDetails.permissions || {};

    for (const ct of CONTENT_TYPES) {
      for (const action of REQUIRED_ACTIONS) {
        ensurePermission(permissions, ct.apiName, ct.controller, action);
      }
    }

    await updateRole(adminToken, role.id, permissions);
    console.log(`[setup-fleet-permissions] Role ${role.name} updated successfully.`);
  }

  console.log('[setup-fleet-permissions] All done.');
}

main().catch((err) => {
  console.error('[setup-fleet-permissions] Fatal error:', err.message);
  process.exit(1);
});
