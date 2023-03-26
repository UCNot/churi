import { UcrxContext } from '../../rx/ucrx-context.js';
import { ucrxEntry } from '../../rx/ucrx-value.js';
import { UcrxHandle } from './ucrx-handle.js';

export interface UcdEntryCache {
  readonly rxs: Record<string, UcrxHandle>;
  end: UcrxHandle[] | null;
}

export function cacheUcdEntry(cache: UcdEntryCache, key: string, entryRx: UcrxHandle): void {
  cache.rxs[key] = entryRx;

  (cache.end ??= []).push(entryRx);
}

export function startUcdEntry(
  context: UcrxContext,
  rx: UcrxHandle,
  key: string,
  cache: UcdEntryCache,
): UcrxHandle {
  const cached = cache.rxs[key];

  if (cached) {
    if (!cached.and(context)) {
      cached.makeOpaque(context);
    }

    return cached;
  }

  const created = new UcrxHandle(
    // This is never called for the first entry,
    // so it should not return `undefined`.
    ucrxEntry(context, rx.rx, key)!,
  );

  cacheUcdEntry(cache, key, created);

  return created;
}
