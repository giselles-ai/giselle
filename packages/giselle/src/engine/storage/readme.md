# Experimental Storage

This directory contains the experimental implementation of **Giselle Storage** as described in [ADR-0004](../../../docs/adr/0004-giselle-storage.md). The goal is to migrate from the legacy unstorage system to a new storage layer while maintaining backward compatibility during the transition.

## Migration Plan Progress

### Phase 1: Preparation
- [ ] Implement GiselleStorage interface and drivers
- [ ] Create UnstorageAdapter that wraps GiselleStorage to provide unstorage-compatible interface
- [ ] Implement basic unit tests
- [ ] Verify functionality in integration test environment

### Phase 2: Gradual Migration
- [ ] Deploy UnstorageAdapter to production with feature flag
- [ ] Switch to new GiselleStorage implementation through adapter
- [ ] Monitor error rates and performance
- [ ] Verify adapter works correctly with existing functionality

### Phase 3: Complete Migration
- [ ] Confirm stable operation of new storage implementation
- [ ] Perform final verification of all functionality

### Phase 4: Cleanup
- [ ] Remove old unstorage-related code
- [ ] Remove adapter code
- [ ] Refactor to use GiselleStorage directly
