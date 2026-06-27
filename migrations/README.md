# Chronicle Editions Migration

## What This Creates

`0001_create_chronicle_editions.sql` creates the `chronicle_editions`
table used by permanent dated Manor Chronicle editions.

The table stores one sealed edition per calendar date:

- `edition_date`: primary key date in `YYYY-MM-DD` format.
- `horizon_date`: Council Watch horizon represented by the snapshot.
- `headline`: deterministic sealed headline.
- `lead`: deterministic sealed lead paragraph.
- `content_json`: complete normalized Chronicle snapshot.
- `format_version`: integer snapshot format version, starting at `1`.
- `created_at`: ISO-8601 timestamp when the edition was first sealed.
- `updated_at`: ISO-8601 timestamp when the edition was last regenerated.

The migration also creates `idx_chronicle_editions_updated_at` for
deterministic archive metadata ordering support.

## Why It Is Required

Permanent Chronicle editions need D1 storage so sealed snapshots do not
change when live Issues, Orders, projects, or milestones are later edited.
Without this table, the application can still display live Chronicle
reconstructions, but Seal Edition and Regenerate Edition cannot persist
snapshots.

## Inspect Before Applying

Review the SQL directly before running it:

```bash
cat migrations/0001_create_chronicle_editions.sql
```

Confirm that it only creates `chronicle_editions` and its index. It must not
drop, rename, or alter existing tables.

## Apply Through Cloudflare Dashboard

1. Open the Cloudflare dashboard.
2. Select the Lord Manor account and D1 database.
3. Open the SQL console.
4. Paste the contents of `migrations/0001_create_chronicle_editions.sql`.
5. Run the SQL.
6. Save the query result for deployment notes if desired.

Do not paste credentials, tokens, or secrets into the repository.

## Apply Through Wrangler

Use this template, replacing the database name with the production D1
database configured for Lord Manor:

```bash
wrangler d1 execute <DATABASE_NAME> \
  --remote \
  --file migrations/0001_create_chronicle_editions.sql
```

If your deployment uses a Wrangler config file with a D1 binding, use the
database identifier/name from that config. Do not commit account IDs,
tokens, or secrets.

## Verify The Table Exists

Run:

```sql
SELECT name
FROM sqlite_master
WHERE type = 'table'
  AND name = 'chronicle_editions';
```

Expected result: one row named `chronicle_editions`.

## Verify Columns

Run:

```sql
PRAGMA table_info(chronicle_editions);
```

Expected columns:

- `edition_date`
- `horizon_date`
- `headline`
- `lead`
- `content_json`
- `format_version`
- `created_at`
- `updated_at`

## Confirm Existing Tables Were Not Changed

Before and after the migration, compare:

```sql
SELECT name
FROM sqlite_master
WHERE type = 'table'
ORDER BY name;
```

The migration should only add `chronicle_editions`; existing tables should
remain present with their previous names.

## Safe Deployment Order

1. Review the pull request.
2. Inspect `migrations/0001_create_chronicle_editions.sql`.
3. Apply the migration to production D1.
4. Verify the table exists.
5. Verify the expected columns.
6. Confirm no existing tables were changed.
7. Merge the pull request.
8. Wait for Cloudflare Pages deployment.
9. Open Lord Manor and test Seal Edition on a safe date.

## If The Migration Was Not Applied Before Deployment

The frontend falls back to live Chronicle reconstructions when permanent
edition storage is unavailable. Apply the migration, verify the table, then
reload the application. Seal Edition and Regenerate Edition should become
available without changing application code.

## Rollback

Destructive rollback SQL is not recommended for this migration because
sealed Chronicle editions are user data. If a rollback is required, first
export or back up the `chronicle_editions` table through Cloudflare D1, then
decide manually whether to preserve or remove the stored editions.
