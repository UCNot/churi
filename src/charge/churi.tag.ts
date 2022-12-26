import { chargeURI, chargeURIArgs } from './charge-uri.js';

/**
 * Tagged template for Charged URI string.
 *
 * - Removes leading and trailing whitespace.
 * - Removes whitespace around charges.
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
  let args = false;

  for (const value of values) {
    const prefix = templates[index];
    const nextIndex = index + 1;

    const handleTopLevel = (): void => {
      args = nextIndex < values.length && !templates[nextIndex];
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
            } else {
              args = false;
            }
          }

          break;
        default:
          args = true;
      }
    } else if (!index) {
      handleTopLevel();
    }

    uri += args ? chargeURIArgs(value) : chargeURI(value);
    index = nextIndex;
  }

  return uri + templates[index];
}

const SPACES_AROUND_NL_PATTERN = /\s*[\r\n]+\s*/g;
