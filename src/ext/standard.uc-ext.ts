import { URIChargeExt } from '../charge/uri-charge-ext.js';
import { NumberValuesUcExt } from './number-values.uc-ext.js';

/**
 * Standard URI charge extension used by default.
 *
 * Enables:
 *
 * - {@link NumberValuesUcExt Number Values}.
 */
export const StandardUcExt: URIChargeExt.Factory = /*#__PURE__*/ URIChargeExt(NumberValuesUcExt);
