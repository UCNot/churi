import { asArray } from '@proc7ts/primitives';
import { UcSchema } from '../schema/uc-schema.js';
import { DefaultUcSchemaDefinitions } from './default.uc-schema-definitions.js';
import { UcCodeAliases } from './impl/uc-code-aliases.js';
import { UcCodeDeclarations } from './impl/uc-code-declarations.js';
import { UcCodeImports } from './impl/uc-code-imports.js';
import { UcSchemaDefinitions } from './uc-schema-definitions.js';
import { UcSerializer } from './uc-serializer.js';

export class UcSchemaCompiler<in out T = unknown> {

  readonly #aliases: UcCodeAliases;
  readonly #imports: UcCodeImports;
  readonly #declarations: UcCodeDeclarations;
  readonly #schema: UcSchema<T>;
  readonly #definitions: Map<string, UcSchemaDefinitions>;
  #written = false;
  #code = '';

  constructor(schema: UcSchema<T>, options: UcSchemaCompiler.Options);

  constructor(
    readonly schema: UcSchema<T>,
    { definitions = DefaultUcSchemaDefinitions }: UcSchemaCompiler.Options = {},
  ) {
    this.#aliases = new UcCodeAliases('value', 'writer');
    this.#imports = new UcCodeImports(this.#aliases);
    this.#declarations = new UcCodeDeclarations(this.#aliases);
    this.#schema = schema;

    this.#definitions = new Map(
      asArray(definitions).map(definitions => [definitions.from, definitions]),
    );
  }

  import(from: string, name: string): string {
    return this.#imports.import(from, name);
  }

  declare(name: string, code: string): string {
    return this.#declarations.declare(name, code);
  }

  serialize(schema: UcSchema, value: string): void {
    const coder = this.#definitions.get(schema.from);

    if (!coder) {
      throw new TypeError(`Unknown source of "${schema.type}" type definition: "${schema.from}"`);
    }

    coder.write(this as UcSchemaCompiler, schema, value);
  }

  write(code: string): void {
    this.#code += `${code}\n`;
  }

  async generateFunction(functionName = ''): Promise<UcSerializer<T>> {
    // eslint-disable-next-line @typescript-eslint/no-implied-eval
    const factory = Function(`
return (async () => {
${this.#dynamicImports()}

return ${this.#fn(functionName)};
})();
`) as () => Promise<UcSerializer<T>>;

    return await factory();
  }

  #dynamicImports(): string {
    let imports = '';

    for (const [from, name, alias] of this.#imports) {
      imports += `const { ${name}: ${alias} } = await import('${from}');\n`;
    }

    return imports;
  }

  generateModule(functionName: string): string {
    return `
${this.#importStatements()}

export ${this.#fn(functionName)};
`;
  }

  #importStatements(): string {
    let imports = '';

    for (const [from, name, alias] of this.#imports) {
      imports += `import { ${name} as ${alias} } from '${from}';\n`;
    }

    return imports;
  }

  #fn(name: string): string {
    this.#write();

    return `
async function ${name}(value, writer) {
${this.#declarations}
${this.#code}
}
`;
  }

  #write(): void {
    if (!this.#written) {
      this.#written = true;
      this.serialize(this.#schema, 'value');
    }
  }

}

export namespace UcSchemaCompiler {
  export interface Options {
    readonly definitions?: UcSchemaDefinitions | readonly UcSchemaDefinitions[] | undefined;
  }
}
