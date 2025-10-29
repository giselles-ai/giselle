# System Migrations

This directory contains SQL migrations for Supabase system schemas (auth, storage, etc.).
These migrations are managed separately from application schema migrations (handled by Drizzle).

## Directory Structure
```
migrations/
  system/             # Supabase system schema migrations
    *.sql            # SQL migration files
  schema/            # Application schema migrations (managed by Drizzle)
```

## Naming Convention
Format: `YYYYMMDD_description.sql`
Example: `20250422_storage_patch_add_policy_to_public_bucket.sql`

## Migration Types
- Storage policies
- Auth policies
- Other Supabase system configurations

## Important Notes
- These migrations are NOT managed by Drizzle
- Must be executed manually through Supabase SQL Editor or CI/CD pipeline
- Should be reviewed carefully as they affect system-level configurations
- Version control helps track changes to Supabase system settings

## Execution
1. Copy the SQL content from the migration file
2. Navigate to the Supabase Dashboard
3. Open SQL Editor
4. Paste and execute the SQL commands
5. Verify the changes in the Dashboard's Policy section

## Example Migration
`20250422_storage_patch_add_policy_to_public_bucket.sql` adds storage policies for the public-assets bucket, specifically for avatar management.
