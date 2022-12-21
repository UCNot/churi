import { chargeURI, chargeURIArgs } from './charge-uri.js';
import {
  ANY_CHARGE_PLACEMENT,
  OPAQUE_CHARGE_PLACEMENT,
  TOP_CHARGE_PLACEMENT,
} from './impl/uri-chargeable.placement.js';
import { URIChargeable } from './uri-chargeable.js';

/**
 * Tagged template for Charged URI string.
 *
 * - Removes leading and trailing whitespace.
 * - Removes whitespace preceding and following charges.
 * - Removes spaces around new lines within template strings.
 * - _Does not_ alter template strings otherwise. It is up to the user to URI-encode them.
 * - Applies {@link chargeURI} or {@link chargeURIArgs} to substituted values depending on placement.
 *
 * @param strings - Template strings.
 * @param values - Substituted values.
 *
 * @returns String containing charged URI string.
 */
export function churi(strings: TemplateStringsArray, ...values: unknown[]): string {
  const templates = strings.map(str => str.trim().replaceAll(SPACES_AROUND_NL_PATTERN, ''));

  let uri = '';
  let index = 0;
  let placement: URIChargeable.Placement = TOP_CHARGE_PLACEMENT;
  let args = false;

  for (const value of values) {
    const prefix = templates[index];
    const nextIndex = index + 1;

    const handleTopLevel = (): void => {
      if (nextIndex >= values.length || templates[nextIndex]) {
        args = false;
        placement = TOP_CHARGE_PLACEMENT;
      } else {
        args = true;
        placement = ANY_CHARGE_PLACEMENT;
      }
    };

    uri += prefix;
    if (prefix) {
      switch (prefix[prefix.length - 1]) {
        case '=':
          handleTopLevel();

          break;
        case '(':
          if (prefix !== ')(') {
            if (nextIndex < values.length && !templates[nextIndex]) {
              args = true;
              placement = ANY_CHARGE_PLACEMENT;
            } else {
              args = false;
              placement = DIRECTIVE_NAME_PATTERN.test(prefix)
                ? OPAQUE_CHARGE_PLACEMENT
                : ANY_CHARGE_PLACEMENT;
            }
          }

          break;
        default:
          args = true;
          placement = DIRECTIVE_NAME_PATTERN.test(prefix)
            ? OPAQUE_CHARGE_PLACEMENT
            : ANY_CHARGE_PLACEMENT;
      }
    } else if (!index) {
      handleTopLevel();
    }

    uri += args ? chargeURIArgs(value, placement.opaque) : chargeURI(value, placement);
    index = nextIndex;
  }

  return uri + templates[index];
}

const SPACES_AROUND_NL_PATTERN = /\s*[\r\n]+\s*/g;
const DIRECTIVE_NAME_PATTERN = /![^/?#()=&,;]*\(?$/;
