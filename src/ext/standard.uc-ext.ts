import { URIChargeExt } from '../charge/uri-charge-ext.js';
import { NonFiniteUcExt } from './non-finite.uc-ext.js';

/**
 * Standard URI charge extension used by default.
 *
 * Enables support for:
 *
 * - {@link NonFiniteUcExt non-finite numbers}.
 */
export const StandardUcExt: URIChargeExt.Factory = /*#__PURE__*/ URIChargeExt(NonFiniteUcExt);
