import { EsDeclarationContext, EsSnippet } from 'esgen';
import { UcSchema } from '../../schema/uc-schema.js';
import { UcrxBootstrap } from '../rx/ucrx-bootstrap.js';
import { UcrxInsetSignature } from '../rx/ucrx-inset-method.js';
import { UcrxClass, UcrxSignature } from '../rx/ucrx.class.js';
import { UcdHandlerFeature } from './ucd-handler-feature.js';

/**
 * Schema {@link UcdCompiler deserializer} bootstrap.
 */
export interface UcdBootstrap extends UcrxBootstrap<UcdBootstrap> {
  /**
   * Assigns lexer to use for the given deserializer entry.
   *
   * @param entry - Deserializer entry name.
   * @param createLexer - Lexer factory code generator.
   *
   * @return `this` instance.
   */
  useLexer(entry: string, createLexer: (this: void, args: { emit: EsSnippet }) => EsSnippet): this;

  /**
   * Assigns default inset lexer to use for the given deserializer entry.
   *
   * @param entry - Deserializer entry name.
   * @param createLexer - Inset lexer factory code generator.
   *
   * @return `this` instance.
   */
  useInsetLexer(
    entry: string,
    createLexer: (this: void, args: UcrxInsetSignature.Values) => EsSnippet,
  ): this;

  /**
   * Requests the given `schema` to be compiled.
   *
   * Once compiled, an {@link UcrxClass} will be reported to the given `whenCompiled` callback. It can be used
   * to generated parser code for the input matching the schema.
   *
   * @typeParam T - Implied data type.
   * @param schema - Schema to compile.
   * @param whenCompiled - Callback function to call when schema compiled.
   *
   * @returns `this` instance.
   */
  compileSchema<T>(
    schema: UcSchema<T>,
    whenCompiled: (
      /**
       * Compiled charge receiver class.
       */
      ucrxClass: UcrxClass<UcrxSignature.Args, T>,
    ) => void,
  ): this;

  /**
   * Configures entity handler.
   *
   * @param entity - Matching entity name.
   * @param feature - Entity support feature.
   *
   * @returns `this` instance.
   */
  handleEntity(entity: string, feature: UcdHandlerFeature): this;

  /**
   * Configures data format handler.
   *
   * @param format - Matching format name.
   * @param feature - Format support feature.
   *
   * @returns `this` instance.
   */
  handleFormat(format: string, feature: UcdHandlerFeature): this;

  /**
   * Configures metadata attribute handler.
   *
   * @param attribute - Matching metadata attribute name.
   * @param feature - Metadata support feature.
   *
   * @returns `this` instance.
   */
  handleMeta(attribute: string, feature: UcdHandlerFeature): this;

  /**
   * Requests the given `attribute` value to be parsed with the given `schema`.
   *
   * @param attribute - Target attribute.
   * @param schema - Attribute value schema.
   * @param set - Emits code for attribute value assignment.
   *
   * By default, attribute will be added to metadata.
   *
   * @returns `this` instance.
   */
  parseMetaValue<T, TSchema extends UcSchema<T> = UcSchema<T>>(
    attribute: string,
    schema: TSchema,
    set?: (
      this: void,
      /**
       * Attribute value assignment arguments.
       */
      args: {
        /**
         * Charge processing context.
         */
        readonly cx: EsSnippet;

        /**
         * Charge receiver.
         */
        readonly rx: EsSnippet;

        /**
         * Attribute value.
         */
        readonly value: EsSnippet;
      },
      /**
       * Declaration context of attribute handler function.
       */
      context: EsDeclarationContext,
    ) => EsSnippet,
  ): this;
}
