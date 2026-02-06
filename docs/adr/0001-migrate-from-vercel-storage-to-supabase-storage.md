# ADR-0001: Migrate from Vercel Storage to Supabase Storage

## Status
Accepted

## Context
We need reliable file storage for managing Generation Node states and workflow execution states. The application requires immediate access to updated files after write operations. However, with Vercel Storage, we've been experiencing frequent issues where updated file content isn't retrievable even after disabling caching.

## Decision
We will migrate our application storage from Vercel Storage to Supabase Storage.

## Alternatives Considered
We evaluated several alternatives:
- AWS S3
- Cloudflare R2
- InstantDB and other newer storage services

We chose Supabase Storage for the following reasons:
1. Our current storage needs are simple - primarily JSON and BLOB persistence without requiring advanced features
2. Supabase Storage is compatible with unstorage, which we're already using
3. We're already using Supabase for authentication in studio.giselles.ai

## Implementation

### Application

Since Supabase Storage cannot handle Japanese filenames, we will change to use file IDs instead.

Before|After
-------|----
`files/fl-abcdef/日本語.txt`|`files/fl-abcdef/fl-abcdef`

By not including the file extension, the file type information is lost. However, this isn't a direct issue since fileType is already included in the file data within the workspace.
While Supabase Storage allows specifying FileType during file upload, which we would like to use in the future, the unstorage library we currently use doesn't support this feature. For now, we will upload files without specifying FileType.

### Data Migration
The data migration has been completed. The migration tool (`tools/storage-migration`) was removed after successful migration.

## Consequences
### Positive
- More reliable file access immediately after write operations
- Consistent integration with our existing authentication system
- Simplified storage architecture by leveraging an already-used service provider

### Negative
- Migration effort required for existing data
- Potential need to update application code to work with the new storage backend
