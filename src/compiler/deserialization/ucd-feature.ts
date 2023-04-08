import { UcSchema } from '../../schema/uc-schema.js';
import { UcToken } from '../../syntax/uc-token.js';
import { UcrxMethod } from '../rx/ucrx-method.js';
import { UcrxTemplate } from '../rx/ucrx-template.js';
import { UcdEntityFeature } from './ucd-entity-feature.js';

/**
 * Deserializer feature.
 *
 * Configures deserializer when called.
 */
export type UcdFeature =
  | ((this: void, setup: UcdSetup) => void)
  | { configureDeserializer(setup: UcdSetup): void };

/**
 * Deserializer setup.
 *
 * Passed to {@link UcdFeature deserializer feature} when the latter enabled.
 */
export interface UcdSetup {
  /**
   * Enables the given deserializer `feature`, unless enabled already.
   *
   * @param feature - Deserializer feature to enable.
   *
   * @returns `this` instance.
   */
  enable(feature: UcdFeature): this;

  /**
   * Assigns template that generates a charge receiver code used to deserialize the given type.
   *
   * @param type - Target type name or class.
   * @param factory - Template factory.
   *
   * @returns `this` instance.
   */
  useUcrxTemplate<T, TSchema extends UcSchema<T> = UcSchema<T>>(
    type: UcSchema<T>['type'],
    factory: UcrxTemplate.Factory<T, TSchema>,
  ): this;

  /**
   * Declares `method` to charge receiver template.
   *
   * @param method - Declaration of method to add to charge receiver template.
   *
   * @returns `this` instance.
   */
  declareUcrxMethod<TArg extends string>(method: UcrxMethod<TArg>): this;

  /**
   * Configures entity handler.
   *
   * @param entity - Matching entity. Either string or array of entity tokens.
   * @param feature - Entity support feature.
   *
   * @returns `this` instance.
   */
  handleEntity(entity: string | readonly UcToken[], feature: UcdEntityFeature): this;

  /**
   * Configures entity prefix handler.
   *
   * @param entity - Matching entity prefix. Either string or array of entity tokens.
   * @param feature - Entity support feature.
   *
   * @returns `this` instance.
   */
  handleEntityPrefix(prefix: string | readonly UcToken[], feature: UcdEntityFeature): this;
}
