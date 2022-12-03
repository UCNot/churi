import { asis } from '@proc7ts/primitives';
import { EndURICharge } from '../uri-charge-rx.js';

export type PassURICharge<TCharge> = <TResult extends TCharge>(
  this: void,
  charge: TResult,
) => TCharge;

export function PassURICharge<TCharge>(
  endCharge: EndURICharge<TCharge> | undefined,
): PassURICharge<TCharge> {
  return endCharge
    ? charge => {
        endCharge(charge);

        return charge;
      }
    : asis;
}
