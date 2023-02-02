import { URIUncharger } from '../charge/uri-uncharger.js';
import { unchargeNonFinite } from './uncharge-non-finite.js';

/**
 * Uncharges URI charge entities supported by default.
 *
 * This uncharger enabled in {@link URIChargeParser parsers}, unless {@link URIChargeParser.Options#and explicitly
 * overridden}.
 *
 * Enables support for:
 *
 * - {@link unchargeNonFinite Non-finite numbers}.
 *
 * @typeParam TValue - Base value type contained in URI charge.
 * @typeParam TCharge - URI charge representation type.
 */
export function unchargeEntities<TValue = unknown, TCharge = unknown>(
  target: URIUncharger.Target<TValue, TCharge>,
): URIUncharger<TValue, TCharge> {
  return unchargeEntities$(target);
}

const unchargeEntities$: URIUncharger.Factory<any, any> =
  /*#__PURE__*/ URIUncharger(unchargeNonFinite);
