import { ucrxUnexpectedTypeError } from '../../rx/ucrx-errors.js';
import { ucrxEntry } from '../../rx/ucrx-value.js';
import { Ucrx } from '../../rx/ucrx.js';
import { UcdReader } from '../ucd-reader.js';

export interface UcdEntryCache {
  readonly rxs: Record<string, Ucrx>;
  end: Ucrx[] | null;
}

export function cacheUcdEntry(cache: UcdEntryCache, key: string, entryRx: Ucrx): void {
  cache.rxs[key] = entryRx;

  if (cache.end) {
    cache.end.push(entryRx);
  } else {
    cache.end = [entryRx];
  }
}

export function startUcdEntry(
  reader: UcdReader,
  rx: Ucrx,
  key: string,
  cache: UcdEntryCache,
): Ucrx {
  const cached = cache.rxs[key];

  if (cached) {
    if (!cached.em()) {
      reader.error(ucrxUnexpectedTypeError('list', cached));

      return (cache.rxs[key] = reader.opaqueRx);
    }

    return cached;
  }

  // This is never called for the first entry,
  // so it should not return `undefined`.
  const created = ucrxEntry(reader, rx, key)!;

  cacheUcdEntry(cache, key, created);

  return created;
}
