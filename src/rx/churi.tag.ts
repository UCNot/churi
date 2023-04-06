import { chargeURI } from './charge-uri.js';

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

  let uri = '';
  let index = 0;
  let isItem = false;

  let commaRequired = false;
  let commaBefore = true;
  let commaAfter = true;

  for (const value of values) {
    const prefix = templates[index];
    const nextIndex = index + 1;
    let omitCommaPrefix = false;

    const checkForNextItem = (): void => {
      const suffix = templates[nextIndex];

      if (suffix) {
        const suffixChar = suffix[0];

        if (suffixChar === ',' || suffixChar === '(') {
          // There is a next item in the list.
          isItem = true;

          // No need to place prefix comma.
          omitCommaPrefix = true;
        } else {
          // No next item.
          isItem = false;

          // Reset for the next list.
          commaRequired = false;
        }
      } else if (nextIndex < values.length) {
        // There is a next item in the list, but comma is unspecified.
        isItem = true;

        // No need to place prefix comma.
        omitCommaPrefix = true;
      }
    };

    uri += prefix;
    if (prefix) {
      switch (prefix[prefix.length - 1]) {
        case '(':
        case ',':
          omitCommaPrefix = true; // No need for comma for first item or because it is part of template.
          isItem = true;

          break;
        default:
          checkForNextItem();
      }
    } else if (!index) {
      checkForNextItem();
    }

    if (isItem) {
      commaBefore = true;
      commaAfter = true;

      // Substitute `null` for undefined item.
      const itemCharge = chargeURI(value) ?? '--';

      if (!omitCommaPrefix && (commaRequired || commaBefore)) {
        uri += ',';
      }

      uri += itemCharge;

      commaRequired = commaAfter;
    } else {
      // Substitute `null` for undefined value.
      uri += chargeURI(value) ?? '--';
    }

    index = nextIndex;
  }

  return uri + templates[index];
}

const SPACES_AROUND_NL_PATTERN = /\s*[\r\n]+\s*/g;
