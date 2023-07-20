import { UcInputLexer } from '../syntax/uc-input-lexer.js';
import { UcToken } from '../syntax/uc-token.js';
import { UcrxContext } from './ucrx-context.js';

export type UcrxInsetLexer = UcInputLexer;

/**
 * Inset syntax is a function that creates a {@link UcrxInsetLexer lexer} for _inset_. I.e. the input chunks enclosed
 * into {@link churi!UC_TOKEN_INSET inset bounds}.
 *
 * Once an inset is encountered, the deserializer would try to use the lexer defined by {@link Ucrx#ins
 * charge receiver}. If the latter is not defined, it will try to use the one created by this method.
 * If that fails, an error will be reported.
 *
 * @param emit - Emitter function called each time a token is found.
 * @param cx - Charge processing context.
 *
 * @returns Either input lexer factory, or `undefined` if an inset is not expected.
 */
export type UcrxInsetSyntax = (
  emit: (token: UcToken) => void,
  cx: UcrxContext,
) => UcrxInsetLexer | undefined;
