import { Result, Ok, Err } from "@marionebl/result";
import { configure } from "./yargs-schema";

const ok = async <T>(p: T): Promise<Ok<T>> => Result.Ok(p).sync();
const err = async <T = unknown>(m: string, c?: T): Promise<Err<T>> =>
  Result.Err(m, c).sync();

test("accepts empty schema and flags", async () => {
  const { parse } = configure();
  expect(await parse([]).sync()).toEqual(await ok({ _: [] }));
});

test("empty schema passes flags", async () => {
  const { parse } = configure();
  const result = parse(["-a", "1", "-b", "2", "something"]);
  expect(await result.sync()).toEqual(
    await ok({ _: ["something"], a: "1", b: "2" })
  );
});

test("empty schema forbidding additional props returns Err for -a", async () => {
  const { parse } = configure({ schema: { additionalProperties: false } });
  const result = parse(["-a"]);
  expect(await result.sync()).toEqual(
    await err("unknown flag -a is not allowed")
  );
});

test("empty schema forbidding additional props returns Err for input", async () => {
  const { parse, config } = configure({ schema: { additionalProperties: false } });

  const result = parse(["a"]);
  expect(await result.sync()).toEqual(
    await err('unknown positional "a" is not allowed')
  );
});

test("schema defining _ items returns Ok for valid input", async () => {
  const { parse } = configure({
    schema: {
      properties: {
        _: {
          type: "array",
          items: [
            { type: "string", enum: ["a", "b", "c"], additionalItems: false }
          ]
        }
      }
    }
  });
  const result = parse(["a", "b", "c"]);
  expect(await result.sync()).toEqual(
    await ok({
      _: ["a", "b", "c"]
    })
  );
});

test("schema defining _ items returns Err for single invalid input", async () => {
  const { parse } = configure({
    schema: {
      properties: {
        _: {
          type: "array",
          items: [{ type: "string", enum: ["a", "b", "c"] }],
          additionalItems: false
        }
      }
    }
  });

  const result = parse(["a", "b", "c", "d"]);

  expect(await result.sync()).toEqual(
    await err('unknown positional "d" is not allowed')
  );
});

test("schema defining _ items returns Err for multiple invalid inputs", async () => {
  const { parse } = configure({
    schema: {
      properties: {
        _: {
          type: "array",
          items: [{ type: "string", enum: ["a", "b", "c"] }],
          additionalItems: false
        }
      }
    }
  });

  const result = parse(["a", "0", "b", "c", "d"]);

  expect(await result.sync()).toEqual(
    await err('unknown positionals "0, d" are not allowed')
  );
});

test("schema defining number flag returns Err for string", async () => {
  const { parse } = configure({
    schema: {
      properties: {
        a: {
          type: "number"
        }
      }
    }
  });

  const result = parse(["-a", "Hello, World"]);

  expect(await result.sync()).toEqual(
    await err(
      'flag -a must be of type "number", received "Hello, World" of type "string"'
    )
  );
});

test("schema defining enum flag returns Err for mismatches", async () => {
  const { parse } = configure({
    schema: {
      properties: {
        a: {
          anyOf: [
            {
              type: "string",
              enum: ["a", "b", "c"]
            },
            {
              type: "number",
              enum: [0, 1, 2]
            }
          ]
        }
      }
    }
  });

  const result = parse(["-a", "3"]);

  expect(await result.sync()).toEqual(
    await err(
      'flag -a must be any of "a, b, c, 0, 1, 2", received "3" of type "string"'
    )
  );
});

test("schema defining plain flag returns Err for array", async () => {
  const { parse } = configure({
    schema: {
      properties: {
        a: {
          type: "string"
        }
      }
    }
  });

  const result = parse(["-a", "3", "-a", "Hello", "-a", "World"]);

  expect(await result.sync()).toEqual(
    await err(
      'flag -a must be of type "string", received ["3","Hello","World"] of type "array"'
    )
  );
});


test("schema defining array flag returns Ok for single pass", async () => {
  const { parse } = configure({
    schema: {
      properties: {
        a: {
          type: "array",
          items: [
            {
              type: "string"
            }
          ]
        }
      }
    }
  });

  const result = parse(["-a", "3"]);

  expect(await result.sync()).toEqual(
    await ok({
      _: [],
      a: ["3"]
    })
  );
});

test("schema defining array flag returns Ok for multiples passes", async () => {
  const { parse } = configure({
    schema: {
      properties: {
        a: {
          type: "array",
          items: [
            {
              type: "string"
            }
          ]
        }
      }
    }
  });

  const result = parse(["-a", "3", "-a", "4"]);

  expect(await result.sync()).toEqual(
    await ok({
      _: [],
      a: ["3", "4"]
    })
  );
});

test("schema defining number array flag returns Ok for multiples passes", async () => {
  const { parse } = configure({
    schema: {
      properties: {
        a: {
          type: "array",
          items: [
            {
              type: "number"
            }
          ]
        }
      }
    }
  });

  const result = parse(["-a", "3", "-a", "4"]);

  expect(await result.sync()).toEqual(
    await ok({
      _: [],
      a: [3, 4]
    })
  );
});

test("schema defining numbers flag returns Ok for passed number", async () => {
  const { parse } = configure({
    schema: {
      properties: {
        a: {
          type: "number"
        }
      }
    }
  });

  const result = parse(["-a", "3"]);

  expect(await result.sync()).toEqual(
    await ok({
      _: [],
      a: 3
    })
  );
});

test("schema defining boolean flag parses number value as input", async () => {
  const { parse } = configure({
    schema: {
      properties: {
        a: {
          type: "boolean"
        }
      }
    }
  });

  const result = parse(["-a", "0"]);

  expect(await result.sync()).toEqual(
    await ok({
      _: ["0"],
      a: true
    })
  );
});

test("schema defining boolean flag returns Ok for --flag", async () => {
  const { parse } = configure({
    schema: {
      properties: {
        a: {
          type: "boolean"
        }
      }
    }
  });

  const result = parse(["-a"]);

  expect(await result.sync()).toEqual(
    await ok({
      _: [],
      a: true
    })
  );
});


test("schema defining boolean flag returns Ok for --flag=true", async () => {
  const { parse } = configure({
    schema: {
      properties: {
        a: {
          type: "boolean"
        }
      }
    }
  });

  const result = parse(["-a", "true"]);

  expect(await result.sync()).toEqual(
    await ok({
      _: [],
      a: true
    })
  );
});

test("schema defining boolean flag returns Ok for --flag=false", async () => {
  const { parse } = configure({
    schema: {
      properties: {
        a: {
          type: "boolean"
        }
      }
    }
  });

  const result = parse(["-a", "true"]);

  expect(await result.sync()).toEqual(
    await ok({
      _: [],
      a: true
    })
  );
});

test("schema defining boolean flag returns Ok for --no-flag", async () => {
  const { parse } = configure({
    schema: {
      properties: {
        a: {
          type: "boolean"
        }
      }
    }
  });

  const result = parse(["--no-a"]);

  expect(await result.sync()).toEqual(
    await ok({
      _: [],
      a: false
    })
  );
});
