import { UcLexer } from '../syntax/uc-lexer.js';
import { UcToken } from '../syntax/uc-token.js';
import { UcrxContext } from './ucrx-context.js';

export type UcrxInsetLexer = UcLexer;

/**
 * Inset syntax is a function that creates a {@link UcrxInsetLexer lexer} for _inset_. I.e. for the input chunks
 * enclosed into {@link churi!UC_TOKEN_PREFIX_INSET inset bounds}.
 *
 * Once an inset is encountered, the deserializer would try to use the lexer defined by {@link Ucrx#ins
 * charge receiver}. If the latter is not defined, it will try to use the one created by this method.
 * If that fails, an error will be reported.
 *
 * @param id - Inset format identifier.
 * @param emit - Emitter function called each time a token is found.
 * @param cx - Charge processing context.
 *
 * @returns Either input lexer factory, or `undefined` if an inset is not expected.
 */
export type UcrxInsetSyntax = (
  this: void,
  id: number | string,
  emit: (token: UcToken) => void,
  cx: UcrxContext,
) => UcrxInsetLexer | undefined;
