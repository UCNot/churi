import { URICharge } from './charge/uri-charge.js';
import { UcMatrixParams$splitter } from './impl/uc-search-params.splitter.js';
import { UcPrimitive } from './schema/uc-value.js';
import { UcSearchParams } from './uc-search-params.js';

/**
 * Charged matrix URI parameters representation.
 *
 * In contrast to {@link UcSearchParams search parameters}, uses `";" (U+003B)` as separator.
 *
 * @typeParam TValue - Base value type contained in URI charge.
 * @typeParam TCharge - URI charge representation type.
 */
export class UcMatrixParams<
  out TValue = UcPrimitive,
  out TCharge = URICharge<TValue>,
> extends UcSearchParams<TValue, TCharge> {

  /**
   * Matrix parameters splitter.
   *
   * Splits parameters separated by `";" (U+003B)` symbol.
   */
  override get splitter(): UcSearchParams.Splitter {
    return UcMatrixParams$splitter;
  }

}
