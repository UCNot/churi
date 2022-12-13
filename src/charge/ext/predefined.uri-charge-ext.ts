import { URIChargeExt } from '../uri-charge-ext.js';
import { NumberValuesURIChargeExt } from './number-values.uri-charge-ext.js';

export const PredefinedURIChargeExt: URIChargeExt.Factory =
  /*#__PURE__*/ URIChargeExt(NumberValuesURIChargeExt);
