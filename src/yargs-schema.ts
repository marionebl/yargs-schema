import { Result } from "@marionebl/result";
import * as jsonschema from "jsonschema";
import { Arguments } from "yargs-parser";
import * as yargsParser from "yargs-parser";
import { format } from "./format";

export type YargsSchema = jsonschema.Schema;

export interface YargsSchemaOptions {
  schema?: YargsSchema;
}

export interface YargsSchemaParser<T = Arguments> {
  parse(argv: string[]): Result<T, unknown>;
}

export function configure<T>(rawOptions?: YargsSchemaOptions): YargsSchemaParser<T> {
  const options = typeof rawOptions === 'undefined' ? {} : rawOptions;
  const schema = typeof options.schema === 'undefined' ? {} : options.schema;

  if (schema.additionalProperties === false) {
    const _ = typeof schema.properties !== 'undefined' ? schema.properties._ : undefined; 
    schema.properties = { ...schema.properties, _: _ || { type: 'array', items: [], additionalItems: false } }
  }

  const config = {
    configuration: {
      "parse-numbers": false
    }
  };

  const parse = (argv: string[]) => yargsParser(argv, config);

  return {
    parse(argv) {
        const parsed = parse(argv) as unknown;
        const validation = jsonschema.validate(parsed, schema);

        return validation.valid 
            ? Result.Ok(parsed as T) 
            : Result.Err(format(validation));
    }
  };
}
