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

test("empty schema forbdding additional props returns Err for -a", async () => {
  const { parse } = configure({ schema: { additionalProperties: false } });
  const result = parse(["-a"]);
  expect(await result.sync()).toEqual(
    await err("unknown flag -a is not allowed")
  );
});

test("empty schema forbdding additional props returns Err for input", async () => {
  const { parse } = configure({ schema: { additionalProperties: false } });
  const result = parse(["a"]);
  expect(await result.sync()).toEqual(
    await err('unknown positional "a" is not allowed')
  );
});

test("schema defining _ items returns Ok for valid input", async () => {
  const { parse } = configure({
    schema: {
      properties: {
        _: { type: "array", items: [{ type: "string", enum: ["a", "b", "c"], additionalItems: false }] }
      }
    }
  });
  const result = parse(["a", "b", "c"]);
  expect(await result.sync()).toEqual(
    await ok({
      _: [
        "a",
        "b",
        "c"
      ]
    })
  );
});

test("schema defining _ items returns Error for single invalid input", async () => {
  const { parse } = configure({
    schema: {
      properties: {
        _: { type: "array", items: [{ type: "string", enum: ["a", "b", "c"] }], additionalItems: false }
      }
    }
  });
  
  const result = parse(["a", "b", "c", "d"]);

  expect(await result.sync()).toEqual(
    await err('unknown positional "d" is not allowed')
  );
});

test("schema defining _ items returns Error for multiple invalid inputs", async () => {
  const { parse } = configure({
    schema: {
      properties: {
        _: { type: "array", items: [{ type: "string", enum: ["a", "b", "c"] }], additionalItems: false }
      }
    }
  });
  
  const result = parse(["a", "0", "b", "c", "d"]);

  expect(await result.sync()).toEqual(
    await err('unknown positionals "0, d" are not allowed')
  );
});