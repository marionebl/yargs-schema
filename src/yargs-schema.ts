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

export function configure<T>(
  rawOptions?: YargsSchemaOptions
): YargsSchemaParser<T> {
  const options = typeof rawOptions === "undefined" ? {} : rawOptions;
  const schema = typeof options.schema === "undefined" ? {} : options.schema;

  if (schema.additionalProperties === false) {
    const _ =
      typeof schema.properties !== "undefined"
        ? schema.properties._
        : undefined;
    schema.properties = {
      ...schema.properties,
      _: _ || { type: "array", items: [], additionalItems: false }
    };
  }

  const properties = schema.properties || {};

  const config = {
    array: getTypedPropNames("array", schema),
    number: getTypedPropNames("number", schema),
    boolean: getTypedPropNames("boolean", schema),
    configuration: {
      "parse-numbers": false,
      "dot-notation": false
    }
  };

  const parse = (argv: string[]) => yargsParser(argv, config);

  return {
    parse(argv) {
      const parsed = parse(argv) as unknown;
      const validation = jsonschema.validate(parsed, schema);

      return validation.valid
        ? Result.Ok(parsed as T)
        : Result.Err(
            format({
              errors: validation.errors,
              argv
            })
          );
    }
  };
}

function getTypedPropNames(type: string, schema: jsonschema.Schema): string[] {
  const props = schema.properties || {};

  return Object.keys(props)
    .map(propName => [propName, props[propName]])
    .filter(entry => {
      const s = entry[1];
      return typeof s !== "string" && s.type === type;
    })
    .map(entry => entry[0])
    .filter((name): name is string => typeof name === "string");
}
