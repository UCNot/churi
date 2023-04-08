import { Ucrx } from './ucrx.js';
import { UctxMode$AsItem, UctxMode$Default as UctxMode$TopLevel } from './uctx-mode.impl.js';
import { UctxMode } from './uctx-mode.js';
import { Uctx } from './uctx.js';

/**
 * Represents arbitrary value as charge and transfers it to the given charge receiver.
 *
 * Handles primitive values, {@link Uctx custom charge transfers}, as well as arbitrary arrays and object literals.
 *
 * @param rx - Charge receiver.
 * @param value - Value to charge with.
 * @param mode - Transfer mode. Top-level by default.
 */
export function uctxValue(rx: Ucrx, value: unknown, mode: UctxMode = UctxMode$TopLevel): void {
  UCTX_CHARGERS[typeof value](rx, value, mode);
}

const UCTX_CHARGERS: {
  readonly [type in string]: { toUC(rx: Ucrx, value: any, mode: UctxMode): void }['toUC'];
} = {
  bigint(rx: Ucrx, value: bigint) {
    rx.big(value);
  },
  boolean(rx: Ucrx, value: boolean) {
    rx.bol(value);
  },
  function: uctxFunction,
  number(rx: Ucrx, value: number) {
    rx.num(value);
  },
  object: uctxObject,
  string(rx: Ucrx, value: string) {
    rx.str(value);
  },
  undefined: () => undefined,
};

function uctxFunction(rx: Ucrx, value: Uctx, mode: UctxMode): void {
  if (typeof value.toUC === 'function') {
    value.toUC(rx, mode);
  } else if (typeof value.toJSON === 'function') {
    uctxValue(rx, value.toJSON());
  }
}

function uctxObject(rx: Ucrx, value: Uctx, mode: UctxMode): void {
  if (!value) {
    // null
    rx.nul();

    return;
  }
  if (typeof value.toUC === 'function') {
    value.toUC(rx, mode);
  } else if (typeof value.toJSON === 'function') {
    uctxValue(rx, value.toJSON(), mode);
  } else if (Array.isArray(value)) {
    uctxArray(rx, value, mode);
  } else {
    uctxMap(rx, Object.entries(value));
  }
}

/** @internal */
export function uctxArray(rx: Ucrx, list: unknown[], { asItem }: UctxMode): 0 | 1 {
  if (asItem) {
    const listRx = rx.nls();

    if (!listRx) {
      return 0;
    }

    rx = listRx;
  }
  rx.and();

  for (const item of list) {
    uctxValue(rx, item ?? null, UctxMode$AsItem);
  }

  rx.end();

  return 1;
}

/** @internal */
export function uctxMap(rx: Ucrx, entries: Iterable<[PropertyKey, unknown]>): 0 | 1 {
  for (const [key, value] of entries) {
    if (value !== undefined) {
      const entryRx = rx.for(key);

      if (entryRx) {
        uctxValue(entryRx, value, UctxMode$AsItem);
      } else if (entryRx != null) {
        return 0; // Unexpected map.
      }
    }
  }

  return rx.map();
}
