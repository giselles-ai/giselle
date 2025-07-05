# ADR-0004: Giselle Storage

Giselle aims to be an AI flow builder that can run on local, Vercel, and AWS environments, allowing developers to freely configure storage for persisting flows and files. To achieve this, we used [unstorage](http://unstorage.unjs.io/) during the prototyping phase. However, as development progressed, the unstorage interface no longer aligned with our product requirements, so we will implement our own storage solution.

## Interface of Giselle Storage

```ts
interface GetJsonParams<T extends z.ZodObject> {
  path: string;
  schema?: T;
}
interface SetJsonParams<T extends z.ZodObject> {
  path: string;
  schema?: T;
  data: z.infer<T>;
}

interface GiselleStorage {
  // json
  getJson<T extends z.ZodObject>(
    params: GetJsonParams<T>,
  ): Promise<z.infer<T>>;
  setJson<T extends z.ZodObject>(
    params: SetJsonParams<T>,
  ): Promise<void>;

  // blob
  getBlob(path: string): Promise<Uint8Array>;
  setBlob(path: string, data: Uint8Array): Promise<void>;

  // management
  copy(source: string, destination: string): Promise<void>;
  remove(path: string): Promise<void>;
}
```

## Migration Plan

Since Giselle is already a running system, we need to migrate from unstorage to GiselleStorage carefully without breaking existing functionality. Since both the old and new implementations use the same Supabase Storage backend, we will use the UnstorageAdapter strategy for a seamless migration.

### Phase 1: Preparation
- Implement GiselleStorage interface and drivers
- Create UnstorageAdapter that wraps GiselleStorage to provide unstorage-compatible interface
- Implement basic unit tests
- Verify functionality in integration test environment

### Phase 2: Gradual Migration
- Deploy UnstorageAdapter to production with feature flag
- Switch to new GiselleStorage implementation through adapter
- Monitor error rates and performance
- Verify adapter works correctly with existing functionality

### Phase 3: Complete Migration
- Confirm stable operation of new storage implementation
- Perform final verification of all functionality

### Phase 4: Cleanup
- Remove old unstorage-related code
- Remove adapter code
- Refactor to use GiselleStorage directly

### Implementation Strategy

```ts
// Factory function for backward compatibility
export function createCompatibleStorage(options: StorageFactoryOptions): Storage {
  const { unstorageConfig, giselleStorageConfig, migrationConfig } = options;

  const legacyStorage = unstorageConfig
    ? createStorage({ driver: unstorageConfig.driver, ...unstorageConfig.options })
    : null;

  const giselleStorage = giselleStorageConfig
    ? createGiselleStorage(giselleStorageConfig)
    : null;

  // Feature flag based switching
  if (migrationConfig?.useGiselleStorage && giselleStorage) {
    return new UnstorageAdapter(giselleStorage);
  }

  return legacyStorage!;
}
```

This migration strategy ensures zero-downtime migration while maintaining the ability to rollback quickly if issues occur. Since both implementations use the same Supabase Storage backend, data consistency is maintained automatically. The existing codebase remains unchanged during the migration process, as the UnstorageAdapter provides full compatibility with the current unstorage interface.
