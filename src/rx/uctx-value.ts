import { AllUcrx } from './all.ucrx.js';
import {
  UctxMode$AsItem,
  UctxMode$Default,
  UctxMode$Default as UctxMode$TopLevel,
} from './uctx-mode.impl.js';
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
export function uctxValue(rx: AllUcrx, value: unknown, mode: UctxMode = UctxMode$TopLevel): void {
  UCTX_CHARGERS[typeof value](rx, value, mode);
}

const UCTX_CHARGERS: {
  readonly [type in string]: { toUC(rx: AllUcrx, value: any, mode: UctxMode): void }['toUC'];
} = {
  bigint(rx: AllUcrx, value: bigint) {
    rx.big(value);
  },
  boolean(rx: AllUcrx, value: boolean) {
    rx.bol(value);
  },
  function: uctxFunction,
  number(rx: AllUcrx, value: number) {
    rx.num(value);
  },
  object: uctxObject,
  string(rx: AllUcrx, value: string) {
    rx.str(value);
  },
  undefined: () => undefined,
};

function uctxFunction(rx: AllUcrx, value: Uctx, mode: UctxMode): void {
  if (typeof value.toUC === 'function') {
    value.toUC(rx, mode);
  } else if (typeof value.toJSON === 'function') {
    uctxValue(rx, value.toJSON());
  }
}

function uctxObject(rx: AllUcrx, value: Uctx, mode: UctxMode): void {
  if (!value) {
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
export function uctxArray(rx: AllUcrx, list: unknown[], { asItem }: UctxMode): void {
  if (asItem) {
    rx = rx.nls();
  }
  rx.and();

  for (const item of list) {
    uctxValue(rx, item ?? null, UctxMode$AsItem);
  }

  rx.end();
}

/** @internal */
export function uctxMap(rx: AllUcrx, entries: Iterable<[PropertyKey, unknown]>): void {
  for (const [key, value] of entries) {
    if (value !== undefined) {
      uctxValue(rx.for(key), value, UctxMode$Default);
    }
  }

  rx.map();
}
