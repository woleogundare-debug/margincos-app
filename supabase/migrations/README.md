# Supabase Migrations

Schema changes to MarginCOS Supabase projects (production and staging) are
version-controlled in this directory. The rule is strict: **no direct
dashboard SQL on production from 2026-04-15 forward.**

## Directory structure

This directory uses three naming conventions reflecting three distinct
artefact types. Understanding the difference matters for replay correctness.

```
supabase/migrations/
├── _baseline/
│   └── 0000_baseline_snapshot_20260415.sql      ← snapshot, see below
│
├── YYYYMMDD_historical_<name>.sql               ← reference only, do not replay
├── YYYYMMDD_<name>.sql                          ← canonical, dashboard-era
├── YYYYMMDDHHMMSS_<name>.sql                    ← canonical, MCP-era and forward
│
└── README.md                                    ← this file
```

## The three artefact types

### 1. `_baseline/0000_baseline_snapshot_20260415.sql`

A **snapshot** of production schema state as of 2026-04-15. Captured via
live introspection (pg_proc, pg_policies, pg_indexes, information_schema)
against `xdlcglpqyrbknirdjgbg`.

**Purpose:** bootstrap an empty Supabase project to match production state
in a single apply. Used to create the staging environment, and reusable
for future disaster recovery.

**Critical:** this file is NOT a forward migration. It does not represent
"changes applied on April 15." It represents the accumulated state on
April 15 after all prior migrations. Replaying it against a database that
already has any of the listed objects will fail.

**When to use:**
- Bootstrapping a fresh, empty Supabase project (staging, DR replica, dev)
- Reading as canonical schema documentation

**When NOT to use:**
- Re-applying to production (it would fail and isn't designed to)
- Replaying as part of a full migration sequence (the historical files
  represent prior states; the baseline supersedes them all)

The `_baseline/` subdirectory placement is deliberate: it signals
"don't include in normal migration enumeration." If/when Supabase CLI
is adopted in future, configure it to ignore this subdirectory.

### 2. Historical migrations: `YYYYMMDD_historical_<name>.sql`

Seven files dated 2026-03-29 through 2026-04-13. These were authored as
files but applied to production via dashboard SQL editor (not via MCP
`apply_migration`), so they are NOT in the production migration tracker.

**Purpose:** historical record of intent. They document what changed and
when, in the words of the engineer who wrote them.

**Critical:** these files are NOT replayable as forward migrations. The
schema state they describe is incomplete (subsequent dashboard SQL changed
things they reference) and the baseline snapshot supersedes all of them.

**When to use:**
- Historical context: "what was the original intent of the divisions table?"
- Audit trail: "when was X added?"

**When NOT to use:**
- Applying to any database (use the baseline instead)
- Treating as authoritative for current schema (the baseline is)

### 3. Canonical migrations

Files without the `historical` infix represent schema changes that:
- Are committed to the repo
- Are tracked in production's `supabase_migrations.schema_migrations`
- Match between repo content and production tracker (verified
  byte-for-byte on 2026-04-15)

Two naming conventions co-exist by accident of history:

**`YYYYMMDD_<name>.sql`** (date-only, dashboard era):
- `20260410_section_b_division_access.sql`
- `20260411_sku_rows_unique_constraint.sql`

These were authored as files, applied via MCP, and survive as canonical.
Date-only naming reflects the convention used at the time.

**`YYYYMMDDHHMMSS_<name>.sql`** (full timestamp, MCP era - going forward):
- `20260411170734_gap1_division_aware_rls.sql`
- `20260411172815_gap1_narrow_write_policies_drop_self_escape_hatch.sql`

The two `gap1_*` files were originally applied via MCP without a repo file;
their SQL was recovered from the production tracker on 2026-04-15 and
committed with full-timestamp filenames matching their tracker version IDs.

**All new migrations from 2026-04-15 forward use full-timestamp naming**
(`YYYYMMDDHHMMSS_<name>.sql`) to match Supabase's own convention, sort
deterministically when multiple migrations land same day, and integrate
cleanly with `apply_migration` MCP calls.

## Workflow for any new schema change

1. **Author** a new file: `supabase/migrations/<full timestamp>_<descriptive_name>.sql`
   - Timestamp format: `YYYYMMDDHHMMSS` (UTC)
   - Get current timestamp: `date -u +%Y%m%d%H%M%S`
   - Name: lowercase, underscores, descriptive (e.g. `add_periods_archived_flag`)

2. **Write idempotently** where possible:
   - `CREATE TABLE IF NOT EXISTS`
   - `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`
   - `DO $$ BEGIN ... IF NOT EXISTS (...) THEN ... END IF; END $$`
   - Wrap in `BEGIN; ... COMMIT;` for multi-statement migrations
   - Include pre-flight assertions and post-flight verifications where the
     change is non-trivial (the `gap1_*` files are good templates)

3. **Apply to staging FIRST** via MCP:

   ```
   Tool:   Supabase:apply_migration
   Params:
     project_id: <staging project id>
     name:       "<full timestamp>_<descriptive_name>"
     query:      <file contents>
   ```

4. **Test on the staging Netlify deploy** against the staging Supabase.
   This is the entire reason staging exists. Skipping this step nullifies
   the value of the workflow.

5. **Apply to production** via the same MCP call against the production
   project ID, **during off-hours only** (no production schema changes
   during business hours once live clients exist).

6. **Commit** the migration file to `main`. Push to `origin/staging` first,
   then `origin/main` after staging deploy validates.

## Bootstrapping a new empty Supabase project

If you ever need to create a new Supabase project that mirrors production
schema (new staging environment, disaster recovery, dev sandbox):

1. Create the project via `Supabase:create_project` (region: us-east-2)
2. Apply the baseline:

   ```
   Tool:   Supabase:apply_migration
   Params:
     project_id: <new project id>
     name:       "0000_baseline_snapshot_20260415"
     query:      <contents of _baseline/0000_baseline_snapshot_20260415.sql>
   ```

3. Apply any canonical migrations (non-historical, non-baseline) authored
   AFTER the baseline date in chronological order.
4. As of 2026-04-15: no migrations exist after the baseline date, so
   step 3 is a no-op until the next migration is authored.

## Project IDs

- Production: `xdlcglpqyrbknirdjgbg` (region: us-east-2, Postgres 17)
- Staging:    `hxwjhvmesyiqiwgdgmvu` (region: us-east-2, Postgres 17)

## Reconciliation history

On 2026-04-15, the migrations directory was reconciled against production
state. Four findings:

1. Repo had 9 dated migration files (2026-03-29 through 2026-04-13).
2. Production tracker had 4 entries: 2 matching repo files, 2 with no repo
   counterpart.
3. The 2 missing tracker entries (`gap1_division_aware_rls`,
   `gap1_narrow_write_policies_drop_self_escape_hatch`) had their SQL
   bodies recovered from the production tracker and committed with
   full-timestamp filenames.
4. The 7 repo files with no tracker entry were renamed with the
   `_historical_` infix to mark them non-replayable. Their original intent
   is preserved in the file content; their schema effects are captured in
   the baseline snapshot.

After reconciliation: 12 files in this directory (1 baseline, 7 historical,
2 dashboard-era canonical, 2 MCP-era canonical). Production state matches
the baseline snapshot exactly.
