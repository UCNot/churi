/**
 * Charge transfer mode.
 *
 * Passed to {@link Uctx#toUc charge transfer} instance to alter its behavior depending on which part of URI to charge.
 */
export interface UctxMode {
  /**
   * Whether the charge is an item.
   *
   * Set when charge is placed inside opened parentheses, i.e. inside list or entity.
   *
   * Affects lists. When set the list has to be reported as {@link Ucrx#nls nested one}. Otherwise, it is reported as
   * items.
   */
  readonly asItem: boolean;
}
