import { URIUncharger } from '../charge/uri-uncharger.js';

/**
 * Uncharges URI directive.
 *
 * URI directive is a kind of {@link UcEntity URI entity} with predefined format.
 *
 * Directive has one of two forms:
 *
 * 1. Directive with value: `${prefix}${delimiter}${value}`,
 * 2. Directive with attributes: `${prefix}(${attributes})${value}`.
 *
 * Here:
 *
 * - `prefix` has to start with _exclamation mark_ (`"!" (U+0021)`) typically.
 * - `delimiter` defaults to _colon_ (`":" (U+003A)`).
 *   When empty or equal to _opening parenthesis_ (`"(" (U+0028)`), the first directive form is unsupported.
 * - `attributes` is arbitrary URI charge (including list), which is absent in the first directive form.
 *
 * @typeParam TValue - Base value type contained in URI charge.
 * @typeParam TCharge - URI charge representation type.
 * @param init - Either directive `prefix`, or directive options.
 * @param uncharger - Directive uncharger function that recognizes directive.
 *
 * @returns URI uncharger factory.
 */
export function unchargeDirective<TValue, TCharge>(
  init: string | DirectiveUncharger.Options,
  uncharger: DirectiveUncharger<TValue, TCharge>,
): URIUncharger.Factory<TValue, TCharge> {
  let prefix: string;
  let delimiter = ':';

  if (typeof init === 'string') {
    prefix = init;
  } else {
    ({ prefix, delimiter = ':' } = init);
  }

  return target => {
    const prefixes: Record<string, URIUncharger.PrefixHandler<TCharge>> = {
      [prefix + '(']: (suffix, prefix) => {
        const { charge: attributes, end } = target.parse(suffix);

        return uncharger({ target, prefix, value: suffix.slice(end + 1), attributes });
      },
    };

    if (delimiter && delimiter !== '(') {
      prefixes[prefix + delimiter] = (value, prefix) => uncharger({ target, prefix, value });
    }

    return {
      prefixes,
    };
  };
}

/**
 * Directive uncharger function signature.
 *
 * Used by {@link unchargeDirective} to recognized directive.
 *
 * @typeParam TValue - Base value type contained in URI charge.
 * @typeParam TCharge - URI charge representation type.
 * @param input - An input of directive to recognize.
 *
 * @returns Either recognized directive representation, or `undefined` if directive can not be recognized.
 */
export type DirectiveUncharger<out TValue, out TCharge> = {
  unchargeDirective(input: DirectiveUncharger.Input<TValue, TCharge>): TCharge | undefined;
}['unchargeDirective'];

export namespace DirectiveUncharger {
  /**
   * Detailed URI directive options.
   */
  export interface Options {
    /**
     * Directive prefix.
     *
     * Has to start with _exclamation mark_ (`"!" (U+0021)`) typically.
     */
    readonly prefix: string;

    /**
     * Value delimiter.
     *
     * When empty string or equal to _opening parenthesis_ (`"(" (U+0028)`), the directive has to have attributes.
     *
     * Defaults to _colon_ (`":" (U+003A)`).
     */
    readonly delimiter?: string | undefined;
  }

  /**
   * URI directive input.
   *
   * Contains parts of directive to recognize by {@link DirectiveUncharger uncharger}.
   *
   * @typeParam TValue - Base value type contained in URI charge.
   * @typeParam TCharge - URI charge representation type.
   */
  export interface Input<out TValue, out TCharge> {
    /**
     * URI uncharge target.
     *
     * May be used e.g. to further uncharge the {@link value}.
     */
    readonly target: URIUncharger.Target<TValue, TCharge>;

    /**
     * Directive prefix.
     */
    readonly prefix: string;

    /**
     * Directive value.
     *
     * A string following either delimiter or attributes.
     *
     * May be empty.
     */
    readonly value: string;

    /**
     * Uncharged directive attributes, if any.
     */
    readonly attributes?: TCharge;
  }
}
