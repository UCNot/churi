import { ucdUnexpectedTypeError } from '../ucd-errors.js';
import { UcdReader } from '../ucd-reader.js';
import { ucdRxEntry } from '../ucd-rx-value.js';
import { UcdMapRx, UcdRx, UCD_OPAQUE_RX } from '../ucd-rx.js';

export interface UcdEntryCache {
  readonly rxs: Record<string, UcdRx>;
  end: UcdRx[] | null;
}

export function cacheUcdEntry(cache: UcdEntryCache, key: string, entryRx: UcdRx): void {
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
  mapRx: UcdMapRx,
  key: string,
  cache: UcdEntryCache,
): UcdRx {
  const cached = cache.rxs[key];

  if (cached) {
    if (!cached.em?.()) {
      reader.error(ucdUnexpectedTypeError('list', cached));

      return (cache.rxs[key] = UCD_OPAQUE_RX);
    }

    return cached;
  }

  const created = ucdRxEntry(reader, mapRx, key);

  cacheUcdEntry(cache, key, created);

  return created;
}
