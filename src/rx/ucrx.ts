import { UcToken } from '../syntax/uc-token.js';
import { UcrxReject } from './ucrx-rejection.js';

/**
 * Charge receiver interface.
 *
 * Implementations of this interface typically generated by compiler.
 *
 * More methods could be added to this interface to reflect custom charges. It is expected that custom method names
 * to be at least four characters long.
 */
export interface Ucrx {
  /**
   * Array of expected value types.
   *
   * Used for error messages.
   */
  get types(): readonly string[];

  /**
   * Charges metadata attribute.
   *
   * @param attribute - Metadata attribute name.
   * @param reject  - Rejection callback.
   *
   * @returns Either metadata receiver, or `undefined` if metadata attribute is not recognized.
   */
  att(attribute: string, reject: UcrxReject): Ucrx | undefined;

  /**
   * Charges boolean value.
   *
   * Called directly for `true` value (`!`), or from {@link raw} when the raw value interpreted as `false`,
   * i.e. it is `-`.
   *
   * @param value - Charged value.
   * @param reject - Rejection callback.
   *
   * @returns Either `1` if charge succeed, or `0` for unexpected boolean.
   */
  bol(value: boolean, reject: UcrxReject): 0 | 1;

  /**
   * Charges big integer value.
   *
   * Typically called from {@link raw} when the raw value interpreted as bigint, i.e. when it starts with `0n` or
   * `-0n` prefix.
   *
   * @param value - Charged value.
   * @param reject - Rejection callback.
   *
   * @returns Either `1` if charge succeed, or `0` for unexpected big integer.
   */
  big(value: bigint, reject: UcrxReject): 0 | 1;

  /**
   * Charges opaque (unrecognized) entity.
   *
   * Called for unhandled entities.
   *
   * @param value - Charged entity tokens.
   * @param reject - Rejection callback.
   *
   * @returns Either `1` if charge succeed, or `0` for unexpected entity.
   */
  ent(value: readonly UcToken[], reject: UcrxReject): 0 | 1;

  /**
   * Charges nested list.
   *
   * @param reject - Rejection callback.
   *
   * @returns Either nested list charge receiver, or `undefined` for unexpected nested list.
   */
  nls(reject: UcrxReject): Ucrx | undefined;

  /**
   * Charges `null` value.
   *
   * Typically called from {@link raw} when the raw value interpreted as `null`, i.e. when it is `--`.
   *
   * @returns Either `1` if charge succeed, or ``0` for unexpected `null`.
   */
  nul(reject: UcrxReject): 0 | 1;

  /**
   * Charges number value.
   *
   * Typically called from {@link raw} when the raw value interpreted as number, i.e. when it starts with digit.
   *
   * @param value - Charged value.
   * @param reject - Rejection callback.
   *
   * @returns Either `1` if charge succeed, or `0` for unexpected number.
   */
  num(value: number, reject: UcrxReject): 0 | 1;

  /**
   * Charges raw value.
   *
   * In contrast to {@link str} method, this one is called for strings that look like numbers or start with
   * _hyphen_ (`"-" (U+002D)`).
   *
   * By default, calls {@link big}, {@link bol}, {@link nul}, {@link num}, or {@link str} depending on `value` prefix.
   *
   * @param value - Charged value.
   * @param reject - Rejection callback.
   *
   * @returns Either `1` if charge succeed, or `0` for unexpected number.
   */
  raw(value: string, reject: UcrxReject): 0 | 1;

  /**
   * Charges string value.
   *
   * Always called directly for quoted strings. May be called from {@link raw}, unless the raw value interpreted
   * otherwise.
   *
   * @param value - Charged value.
   * @param reject - Rejection callback.
   *
   * @returns Either `1` if charge succeed, or `0` for unexpected number.
   */
  str(value: string, reject: UcrxReject): 0 | 1;

  /**
   * Starts charging of map entry.
   *
   * @param key - Target entry key.
   * @param reject - Rejection callback.
   *
   * @returns Either entry receiver, `0` for unexpected map, or `undefined` for unexpected entry.
   */
  for(key: PropertyKey, reject: UcrxReject): Ucrx | 0 | undefined;

  /**
   * Finishes map charge.
   *
   * Called after all map entries {@link for charged}, unless the map is empty.
   *
   * The returned `0` makes sense for empty maps only. Otherwise, a preceding call to {@link for} has to return 0,
   * which prevents the map charge.
   *
   * @param reject - Rejection callback.
   *
   * @returns `1` if charge succeed, or `0` for unexpected map.
   */
  map(reject: UcrxReject): 0 | 1;

  /**
   * Starts charging of list.
   *
   * Always called _before_ the first item charge. In case of map item, always called _before_ {@link map map charge
   * finished}, but not necessarily before {@link for entries charged}.
   *
   * @param reject - Rejection callback.
   *
   * @returns `1` if charge succeed, or `0` for unexpected list.
   */
  and(reject: UcrxReject): 0 | 1;

  /**
   * Finishes list charge.
   *
   * Always called _after_ {@link and} call(s).
   *
   * May also be called for single values. I.e. without preceding call to {@link and}. This is not guaranteed though.
   *
   * @param reject - Rejection callback.
   */
  end(reject: UcrxReject): void;
}
