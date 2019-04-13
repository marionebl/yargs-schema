import * as jsonschema from "jsonschema";
import * as yargsParser from "yargs-parser";

export interface Formatable {
  errors: jsonschema.ValidationError[];
  argv: string[];
}

export function format(formatable: Formatable): string {
  return formatable.errors
    .map(error => {
      return error.property === "instance._"
        ? formatPositionalError(error)
        : formatFlagError(error, formatable.argv);
    })
    .join("\n");
}

function formatFlagError(
  error: jsonschema.ValidationError,
  argv: string[]
): string {
  const prop = error.property.replace("instance.", "");

  switch (error.name) {
    case "additionalProperties":
      return `unknown flag ${formatFlag(error.argument)} is not allowed`;
    case "type":
      const instance = yargsParser(argv, {
        configuration: {
          "parse-numbers": false,
          "dot-notation": false
        }
      });
      return `flag ${formatFlag(prop)} must be of type "${error.argument.join(
        ", "
      )}", received ${JSON.stringify(instance[prop])} of type "${formatType(
        instance[prop]
      )}"`;
    case "anyOf":
      const types = (error.schema as any).anyOf.map(formatSchema);
      return `flag ${formatFlag(prop)} must be any of "${types.join(
        ", "
      )}", received ${JSON.stringify(error.instance)} of type "${formatType(
        error.instance
      )}"`;
    default:
      return `unknown validation error "${error.name}": ${error.message}`;
  }
}

function formatPositionalError(error: jsonschema.ValidationError): string {
  switch (error.name) {
    case "items":
      const offending = error.instance.filter(
        (value: unknown) => !jsonschema.validate([value], error.schema).valid
      );
      const mulitple = offending.length > 1;
      const subject = mulitple ? "positionals" : "positional";
      const verb = mulitple ? "are" : "is";
      return `unknown ${subject} "${offending.join(", ")}" ${verb} not allowed`;
    default:
      return `unknown validation error "${error.name}": ${error.message}`;
  }
}

function formatType(instance: unknown): string {
  if (Array.isArray(instance)) {
    return "array";
  }

  return typeof instance;
}

function formatFlag(flag: string) {
  return flag.length === 1 ? `-${flag}` : `--${flag}`;
}

function formatSchema(schema: jsonschema.Schema): string {
  if (Array.isArray(schema.enum)) {
    return schema.enum.join(", ");
  }

  return Array.isArray(schema.type) ? schema.type.join(", ") : schema.type!;
}
