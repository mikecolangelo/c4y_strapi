# Database & Content-Type Cleanup Report (proposal only)

> **Status: PROPOSAL — nothing has been deleted.**
> This document lists candidates for removal so the owner can approve them. No
> destructive change (dropping a table/column, deleting a content-type) has been
> applied. Apply only after taking the backups described below and approving the
> specific items.

Generated for Strapi 5.33.3, database `main_car4youpanama` (PostgreSQL), on the
`chore/servicios-cleanup-refactor` branch.

---

## 1. Take backups first (required before ANY deletion)

```bash
# Full SQL dump of the database
pg_dump "postgresql://<user>:<pass>@127.0.0.1:5432/main_car4youpanama" \
  -Fc -f car4you-backup-$(date +%Y%m%d).dump

# Strapi data export (content + media), encrypted
cd backend && npx strapi export --file car4you-strapi-$(date +%Y%m%d)
```

Keep both artifacts off the server before proceeding.

---

## 2. How candidates were identified

For each of the 49 API content-types we measured:

- **rows** — live row count in the PostgreSQL table.
- **FErefs** — frontend files referencing the REST endpoint (`/api/<plural>`) or
  the UID (`api::<name>.<name>`).
- **BErefs** — backend files referencing the UID **outside** the content-type's
  own folder.

A content-type with `0 rows`, `0 FErefs` and `0 BErefs` is a strong removal
candidate. Anything with data or references is kept or flagged for review.

> **Caveats (read before deleting anything):**
>
> - `0 rows` does **not** always mean "unused" — it can be a feature that is not
>   live yet. Confirm with product before removing.
> - The frontend scan keys on the **plural** endpoint name. Content-types whose
>   route is singular (e.g. `company-info` → `/api/company-info`) can show
>   `0 FErefs` as a **false negative**. `company-info` is such a case and is
>   **kept**.

---

## 3. Strong removal candidates (no data of value, no references)

| Content-type       | rows | FErefs | BErefs | Notes                                                                                     |
| ------------------ | ---: | -----: | -----: | ----------------------------------------------------------------------------------------- |
| `singin`           |    2 |      0 |      0 | Misspelled "signin"; legacy/experimental auth. Replaced by `users-permissions`.           |
| `signup`           |    2 |      0 |      0 | Legacy/experimental signup; real signup lives in the users-permissions extension.         |
| `dashboard`        |    2 |      0 |      0 | No code references; dashboard UI uses `/api/dashboard-metric`? (also unused — see below). |
| `dashboard-metric` |    0 |      0 |      0 | Fully unused.                                                                             |
| `stat-entry`       |    0 |      0 |      0 | Fully unused.                                                                             |

These 5 are the safest to delete after backup. Verify `singin`/`signup` are not
hit by any external client before dropping them.

## 4. Review candidates (empty + only backend self-wiring)

Empty tables referenced only by backend scaffolding (controllers/services that
exist but are never called from the app). Confirm each is not a
work-in-progress feature before acting:

`communication-log`, `contract-document`, `inventory-note`,
`fleet-mileage-history`, `service-note`, `payment-application`,
`supply-request`, `vehicle-state`, `inventory-movement`, `inventory-request`,
`penalty-debt`, `deal-clause`, `deal-discount`, `driver-history`,
`fleet-reminder`, `fleet-document`, `service-order-inventory-item`,
`weekly-collection`, `stat-entry`.

> Note: `fleet-mileage-history` is referenced by a ClickUp task (km integration)
> and may be WIP — do not remove without checking.

## 5. Keep (in active use)

All content-types with rows and/or references, including `service`,
`service-order`, `maintenance-kit(-item)`, `fleet*`, `inventory-item`,
`user-profile`, `notification`, `billing-*`, `invoice`, `deal`, `client`,
`appointment`, `financing`, `configuration`, `role-permission`,
`company-info` (false-negative above), `vehicle-document`,
`vehicle-document-category`.

---

## 6. Duplicate data found in `services`

The catalog has 4 rows but only 2 distinct services, because draft + published
copies coexist (`draftAndPublish: true`):

|  id | name                   | published |
| --: | ---------------------- | --------- |
|   1 | Cambio de Aceite       | draft     |
|   8 | Cambio de Aceite       | published |
|   3 | Rotación de Neumáticos | draft     |
|   4 | Rotación de Neumáticos | published |

The UI (default `find`) only returns published entries, so the drafts are
invisible noise. Recommendation: after backup, delete the orphan drafts (ids 1
and 3) once confirmed they are not pending edits.

---

## 7. Recommended procedure (deprecation-first)

1. Owner approves a specific subset from sections 3/4.
2. Take the backups in section 1.
3. For each approved content-type: remove its `src/api/<name>` folder and any
   relations pointing to it, then let Strapi drop the table on the next build in
   a **staging** copy first.
4. Verify the app still builds and the affected screens work.
5. Apply to production during a maintenance window.

Nothing in this list should be deleted directly against production without the
above.
