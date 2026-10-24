# AIHXO Guardian · Recovery and release checklist

**Scope:** This is a release runbook, not evidence that a backup or restore has already succeeded. Do not use production customer data for a rehearsal.

## Before approving a deployment
1. Confirm the pull request checks pass; review changed files and expected user flows.
2. Identify the currently deployed commit and preserve a rollback reference.
3. Verify the latest *actual* Supabase database backup exists, its timestamp, retention and whether point-in-time recovery is available for the plan. Do not assume these features are enabled.
4. Confirm that a restore to a separate non-production environment has been rehearsed. Record date, operator, restored schema/table counts and functional checks.
5. Review Supabase RLS and grants for inventory, purchases, customers, orders and storage; test using non-admin roles in a disposable environment.
6. Verify critical GitHub Actions secrets and GitHub Pages settings are accessible to maintainers, without copying secret values into issues or logs.
7. Verify errors and failed scheduled jobs have an owner and a tested notification destination.

## If a web release breaks
1. Stop further merges; identify the last known good Git commit.
2. Revert the problematic commit via a reviewed pull request or redeploy the known-good artifact.
3. Confirm public web and /gestion/ load, logins work, and order/stock reads are correct.
4. If any database migration was included, **do not blindly roll it back**; first assess forward compatibility and take a verified backup.
5. Record incident timeline and corrective tests.

## Recovery drill evidence (must be filled, never guessed)
- Last successful database backup timestamp: **NOT VERIFIED**
- Backup retention and PITR: **NOT VERIFIED**
- Last restore drill in isolated environment: **NOT PERFORMED**
- Last verified RLS permission matrix: **NOT VERIFIED**
- Last alert delivery test: **NOT VERIFIED**
- Last deployed commit: **NOT VERIFIED**

## Release gate
Guardian is only **partially implemented** until backup restore, permission checks, alert delivery and rollback rehearsal have been independently verified. Passing syntax and registry tests is necessary but not sufficient.
