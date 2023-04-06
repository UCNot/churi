import { Ucrx } from './ucrx.js';
import { Uctx } from './uctx.js';

/**
 * Represents arbitrary value as charge and transfers it to the given charge receiver.
 *
 * Handles primitive values, {@link Uctx custom charge transfers}, as well as arbitrary arrays and object literals.
 *
 * @param rx - Charge receiver.
 * @param value - Value to charge with.
 */
export function ucrxValue(rx: Ucrx, value: unknown): void {
  UCRX_CHARGERS[typeof value](rx, value);
}

const UCRX_CHARGERS: {
  readonly [type in string]: (rx: Ucrx, value: any) => void;
} = {
  bigint(rx: Ucrx, value: bigint) {
    rx.big(value);
  },
  boolean(rx: Ucrx, value: boolean) {
    rx.bol(value);
  },
  function: ucrxFunction,
  number(rx: Ucrx, value: number) {
    rx.num(value);
  },
  object: ucrxObject,
  string(rx: Ucrx, value: string) {
    rx.str(value);
  },
  undefined: () => undefined,
};

function ucrxFunction(rx: Ucrx, value: Uctx): void {
  if (typeof value.toUc === 'function') {
    value.toUc(rx);
  } else if (typeof value.toJSON === 'function') {
    ucrxValue(rx, value.toJSON());
  }
}

function ucrxObject(rx: Ucrx, value: Uctx): void {
  if (!value) {
    // null
    rx.nul();

    return;
  }
  if (typeof value.toUc === 'function') {
    value.toUc(rx);
  } else if (typeof value.toJSON === 'function') {
    ucrxValue(rx, value.toJSON());
  } else if (Array.isArray(value)) {
    ucrxArray(rx, value);
  } else {
    ucrxMap(rx, Object.entries(value));
  }
}

/** @internal */
export function ucrxArray(rx: Ucrx, list: unknown[]): 0 | 1 {
  const listRx = rx.nls();

  if (!listRx) {
    return 0; // Unexpected list
  }
  rx.and();

  for (const item of list) {
    ucrxValue(rx, item ?? null);
  }

  rx.end();

  return 1;
}

/** @internal */
export function ucrxMap(rx: Ucrx, entries: Iterable<[PropertyKey, unknown]>): 0 | 1 {
  for (const [key, value] of entries) {
    if (value !== undefined) {
      const entryRx = rx.for(key);

      if (entryRx) {
        ucrxValue(entryRx, value);
      } else if (entryRx != null) {
        return 0; // Unexpected map.
      }
    }
  }

  return rx.map();
}
