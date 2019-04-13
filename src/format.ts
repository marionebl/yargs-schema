import * as jsonschema from "jsonschema";

export interface Formatable {
    errors: jsonschema.ValidationError[]
}

export function format(formatable: Formatable): string {
    return formatable.errors
        .map(error => {
            return error.property === 'instance._' ? formatPositionalError(error) : formatFlagError(error)
        })
        .join('\n');
}

function formatFlagError(error: jsonschema.ValidationError): string {
    switch (error.name) {
        case 'additionalProperties':
            return `unknown flag ${formatFlag(error.argument)} is not allowed`;
        default:
            return `unknown validation error "${error.name}": ${error.message}`;
    }
}

function formatPositionalError(error: jsonschema.ValidationError): string {
    switch (error.name) {
        case 'items':
            const mulitple = Array.isArray(error.argument) && error.argument.length > 0;
            const subject = mulitple ? 'positionals' : 'positional';
            const verb = mulitple ? 'are' : 'is';
            return `unknown ${subject} "${error.instance.join(', ')}" ${verb} not allowed`;
        default:
            return `unknown validation error "${error.name}": ${error.message}`;
    }
}

function formatFlag(flag: string) {
    return flag.length === 1
        ? `-${flag}`
        : `--${flag}`;
}