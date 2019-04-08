import { Result } from "@marionebl/result";
import * as Ajv from "ajv";
import { Arguments } from "yargs-parser";
import * as yargsParser from "yargs-parser";
import { JSONSchema } from "./json-schema";

export interface YargsSchemaParser<T = Arguments> {
  parse(argv: string[]): Result<T>;
}

export function configure<T>(schema: JSONSchema): YargsSchemaParser<T> {
  const config = {
    configuration: {
      "parse-numbers": false
    }
  };

  const ajv = new Ajv();
  const validate = ajv.compile(schema);

  const parse = (argv: string[]) => yargsParser(argv, config);

  return {
    parse(argv) {
        const parsed = parse(argv) as unknown;
        const valid = validate(parsed);
        return valid 
            ? Result.Ok(parsed as T) 
            : Result.Err(new Error(ajv.errorsText()));
    }
  };
}
