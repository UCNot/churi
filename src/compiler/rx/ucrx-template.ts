import { UcSchema } from '../../schema/uc-schema.js';
import { UccMethod } from '../codegen/ucc-method.js';
import { BaseUcrxTemplate } from './base.ucrx-template.js';
import { UcrxCore } from './ucrx-core.js';
import { UcrxLib } from './ucrx-lib.js';
import { UcrxMethod } from './ucrx-method.js';
import { UcrxArgs } from './ucrx.args.js';

export abstract class UcrxTemplate<
  out T = unknown,
  out TSchema extends UcSchema<T> = UcSchema<T>,
> extends BaseUcrxTemplate {

  abstract get schema(): TSchema;

}

export interface UcrxTemplate<out T = unknown, out TSchema extends UcSchema<T> = UcSchema<T>>
  extends BaseUcrxTemplate {
  get base(): BaseUcrxTemplate;
}

export namespace UcrxTemplate {
  export interface Options {
    readonly lib: UcrxLib;
    readonly args?: UcrxArgs.Spec | undefined;
  }

  export type MethodDecls = {
    readonly [key in keyof UcrxCore]?:
      | UccMethod.Body<UcrxMethod.ArgType<UcrxCore[key]>>
      | undefined;
  } & {
    readonly custom?: Method<any>[] | undefined;
  };

  export type Methods = {
    readonly [key in keyof UcrxCore]?: Method<UcrxMethod.ArgType<UcrxCore[key]>> | undefined;
  } & {
    readonly [key in Exclude<string, keyof UcrxCore>]: Method;
  };

  export interface Method<in out TArg extends string = string> {
    readonly method: UcrxMethod<TArg>;
    readonly body: UccMethod.Body<TArg>;
  }
}
