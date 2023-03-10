import { ucrxUnexpectedTypeError } from '../../rx/ucrx-errors.js';
import { ucrxEntry } from '../../rx/ucrx-value.js';
import { Ucrx, UcrxMap, UCRX_OPAQUE } from '../../rx/ucrx.js';
import { UcdReader } from '../ucd-reader.js';

export interface UcdEntryCache {
  readonly rxs: Record<string, Ucrx>;
  end: Ucrx[] | null;
}

export function cacheUcdEntry(cache: UcdEntryCache, key: string, entryRx: Ucrx): void {
  cache.rxs[key] = entryRx;

  if (entryRx.ls) {
    if (cache.end) {
      cache.end.push(entryRx);
    } else {
      cache.end = [entryRx];
    }
  }
}

export function startUcdEntry(
  reader: UcdReader,
  mapRx: UcrxMap,
  key: string,
  cache: UcdEntryCache,
): Ucrx {
  const cached = cache.rxs[key];

  if (cached) {
    if (!cached.em?.()) {
      reader.error(ucrxUnexpectedTypeError('list', cached));

      return (cache.rxs[key] = UCRX_OPAQUE);
    }

    return cached;
  }

  const created = ucrxEntry(reader, mapRx, key);

  cacheUcdEntry(cache, key, created);

  return created;
}
