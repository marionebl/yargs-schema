# yargs-schema

## Example

```ts
import * as assert from "assert";
import { Result } from "@marionebl/result";
import { yargsSchema } from "yargs-schema";

interface Flags {
    a?: boolean;
    b: number;
    c: string;
}

const schema = {
    additionalProperties:
    properties: {
        a: {
            type: "number";
        },
        b: {
            type: "number";
        },
        c: {
            type: "string"
        }
    },
    required: [
        "b",
        "c"
    ]
};

const ae = assert.deepStrictEqual;

ae(yargsSchema<Flags>(['--b', '3'], schema), Result.Err(new Error('--a is required')));
ae(yargsSchema<Flags>(['--b', 'something'], schema), Result.Err(new Error('--b most be a number')));
ae(yargsSchema<Flags>(['--a', '1'], schema), Result.Ok({ a: 1 }));
```
