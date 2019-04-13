import * as jsonschema from "jsonschema";

export interface Formatable {
  errors: jsonschema.ValidationError[];
}

export function format(formatable: Formatable): string {
  return formatable.errors
    .map(error => {
      return error.property === "instance._"
        ? formatPositionalError(error)
        : formatFlagError(error);
    })
    .join("\n");
}

function formatFlagError(error: jsonschema.ValidationError): string {
  switch (error.name) {
    case "additionalProperties":
      return `unknown flag ${formatFlag(error.argument)} is not allowed`;
    case "type":
      const prop = error.property.replace('instance.', '');
      return `flag ${formatFlag(prop)} must be of type "${error.argument.join(', ')}", received ${JSON.stringify(error.instance)} of type "${typeof error.instance}"`;
    default:
      return `unknown validation error "${error.name}": ${error.message}`;
  }
}

function formatPositionalError(error: jsonschema.ValidationError): string {
  switch (error.name) {
    case "items":
      const offending = error.instance.filter((value: unknown) => !jsonschema.validate([value], error.schema).valid);
      const mulitple = offending.length > 1;
      const subject = mulitple ? "positionals" : "positional";
      const verb = mulitple ? "are" : "is";
      return `unknown ${subject} "${offending.join(", ")}" ${verb} not allowed`;
    default:
      return `unknown validation error "${error.name}": ${error.message}`;
  }
}

function formatFlag(flag: string) {
  return flag.length === 1 ? `-${flag}` : `--${flag}`;
}
