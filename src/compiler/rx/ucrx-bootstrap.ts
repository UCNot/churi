import { EsSignature } from 'esgen';
import { UcSchema } from '../../schema/uc-schema.js';
import { UccBootstrap } from '../bootstrap/ucc-bootstrap.js';
import { UcrxBeforeMod, UcrxMethod } from './ucrx-method.js';
import { UcrxClassMod, UcrxProto } from './ucrx.class.js';

/**
 * Bootstrap of {@link UcrxProcessor charge receiver} code generation.
 *
 * @typeParam TBoot - Type of schema processing bootstrap.
 */
export interface UcrxBootstrap<in out TBoot extends UcrxBootstrap<TBoot>>
  extends UccBootstrap<TBoot> {
  /**
   * Assigns {@link churi!Ucrx Ucrx} class to use for `target` value type or schema processing.
   *
   * The class prototype provided for particular schema takes precedence over the one provided for the type.
   *
   * @typeParam T - Implied data type.
   * @param target - Name or class of target value type, or target schema instance.
   * @param proto - Ucrx class prototype.
   *
   * @returns `this` instance.
   */
  useUcrxClass<T>(target: UcSchema<T>['type'] | UcSchema<T>, proto: UcrxProto<T>): this;

  /**
   * Applies modifier to {@link useUcrxClass Ucrx class} created for the given schema.
   *
   * @typeParam T - Implied data type.
   * @param schema - Target schema instance.
   * @param mod - Ucrx class modifier.
   *
   * @return `this` instance.
   */
  modifyUcrxClass<T>(schema: UcSchema<T>, mod: UcrxClassMod<T>): this;

  /**
   * Declares `method` to present in all {@link churi!Ucrx charge receiver} implementations.
   *
   * @typeParam TArgs - Type of method arguments definition.
   * @typeParam TMod - Type of method modifier.
   * @param method - Declaration of method to add to charge receiver template.
   *
   * @returns `this` instance.
   */
  declareUcrxMethod<TArgs extends EsSignature.Args, TMod extends UcrxBeforeMod<TArgs>>(
    method: UcrxMethod<TArgs, TMod>,
  ): this;

  /**
   * Modifies the `method` of the target `type` receiver.
   *
   * @typeParam TArgs - Type of method arguments definition.
   * @typeParam TMod - Type of method modifier.
   * @param schema - Target schema.
   * @param method - Method to modify.
   * @param mod - Modifier to apply to target `method`.
   *
   * @returns `this` instance.
   */
  modifyUcrxMethod<TArgs extends EsSignature.Args, TMod extends UcrxBeforeMod<TArgs>>(
    schema: UcSchema,
    method: UcrxMethod<TArgs, TMod>,
    mod: TMod,
  ): this;
}
