import { chargeURI } from './charge-uri.js';
import { UctxMode$AsItem } from './uctx-mode.impl.js';

/**
 * Tagged template for Charged URI string.
 *
 * - Removes leading and trailing whitespace.
 * - Removes whitespace around charges.
 * - Removes spaces around new lines within template strings.
 * - _Does not_ alter template strings otherwise. It is up to the user to URI-encode them.
 * - Applies {@link chargeURI} to substituted values.
 *
 * @param strings - Template strings.
 * @param values - Substituted values.
 *
 * @returns String containing charged URI string.
 */
export function churi(strings: TemplateStringsArray, ...values: unknown[]): string {
  const templates = strings.map(str => str.trim().replaceAll(SPACES_AROUND_NL_PATTERN, ''));

  const chunks: string[] = [];
  let index = 0;
  let asItem = false;
  let commaRequired = false;

  for (const value of values) {
    const prefix = templates[index];
    const nextIndex = index + 1;
    let omitComma = false;

    const checkForNextItem = (): void => {
      const suffix = templates[nextIndex];

      if (suffix) {
        const suffixChar = suffix[0];

        if (suffixChar === ',' || suffixChar === '(') {
          // There is a next item in the list.
          asItem = true;

          // No need to place prefix comma.
          omitComma = true;
        } else {
          // No next item.
          asItem = false;

          // Reset for the next list.
          commaRequired = false;
        }
      } else if (nextIndex < values.length) {
        // There is a next item in the list, but comma is unspecified.
        asItem = true;

        // No need to place prefix comma.
        omitComma = true;
      }
    };

    if (prefix) {
      chunks.push(prefix);
      switch (prefix[prefix.length - 1]) {
        case '(':
        case ',':
          omitComma = true; // No need for comma for first item or because it is part of template.
          asItem = true;

          break;
        default:
          checkForNextItem();
      }
    } else if (!index) {
      checkForNextItem();
    }

    if (asItem) {
      // Substitute `null` for undefined item.
      const itemCharge = chargeURI(value, UctxMode$AsItem) ?? '--';

      if (!omitComma && commaRequired) {
        if (
          !(chunks.length && chunks[chunks.length - 1].endsWith(')') && itemCharge.startsWith('('))
        ) {
          // No need for comma before nested list
          chunks.push(',');
        }
      }

      chunks.push(itemCharge);

      commaRequired = true;
    } else {
      // Substitute `null` for undefined value.
      chunks.push(chargeURI(value) ?? '--');
    }

    index = nextIndex;
  }

  chunks.push(templates[index]);

  return chunks.join('');
}

const SPACES_AROUND_NL_PATTERN = /\s*[\r\n]+\s*/g;
