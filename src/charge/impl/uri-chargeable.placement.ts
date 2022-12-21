import { URIChargeable } from '../uri-chargeable.js';

export const TOP_CHARGE_PLACEMENT: URIChargeable.Top = {
  as: 'top',
  opaque: undefined,
  omitParentheses: undefined,
};

export const ANY_CHARGE_PLACEMENT: URIChargeable.Any = {
  as: undefined,
  opaque: undefined,
  omitParentheses: undefined,
};

export const OPAQUE_CHARGE_PLACEMENT: URIChargeable.Any = {
  as: undefined,
  opaque: true,
  omitParentheses: undefined,
};
