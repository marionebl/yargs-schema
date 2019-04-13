import { Result, Ok, Err } from "@marionebl/result";
import { configure } from "./yargs-schema";

const ok = async <T>(p: T): Promise<Ok<T>> => Result.Ok(p).sync();
const err = async <T = unknown>(m: string, c?: T): Promise<Err<T>> => Result.Err(m, c).sync();

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

test("empty schema forbdding additional props returns Err", async () => {
  const { parse } = configure({ schema: { additionalProperties: false } });
  const result = parse(["-a"]);
  expect(await result.sync()).toEqual(
    await err("unknown flag -a is not allowed")
  );
});
