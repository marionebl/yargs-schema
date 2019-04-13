import * as jsonschema from "jsonschema";

export interface Formatable {
    errors: jsonschema.ValidationError[]
}

export function format(formatable: Formatable): string {
    return formatable.errors
        .map(error => {
            switch (error.name) {
                case 'additionalProperties':
                    return `unknown flag ${formatFlag(error.argument)} is not allowed`;
                default:
                    return `Unknown validation error: ${error.message}`;
            }
        })
        .join('\n');
}

export function formatFlag(flag: string) {
    return flag.length === 1
        ? `-${flag}`
        : `--${flag}`;
}