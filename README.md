# yargs-schema

## Example

```ts
import * as assert from "assert";
import { Result } from "@marionebl/result";
import { configure } from "yargs-schema";

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
const {parse} = configure<Flags>(schema);

ae(parse(['--b', '3']), Result.Err(new Error('--a is required')));
ae(parse(['--b', 'something']), Result.Err(new Error('--b most be a number')));
ae(parse(['--a', '1']), Result.Ok({ a: 1 }));
```
