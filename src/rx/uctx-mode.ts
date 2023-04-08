/**
 * Charge transfer mode.
 *
 * Passed to {@link Uctx#toUC charge transfer} instance to alter its behavior depending on which part of URI to charge.
 */
export interface UctxMode {
  /**
   * Whether the charge is an item.
   *
   * Set when charge is placed inside a list.
   *
   * Affects lists. When set the list has to be reported as {@link Ucrx#nls nested one}. Otherwise, it is reported as
   * items.
   */
  readonly asItem: boolean;
}
