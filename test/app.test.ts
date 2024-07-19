import { describe, expect, it, vi } from "vitest";
import { App } from "../src/app";
import { createConfig } from "../src/lib/config";
import { simpleSchema } from "./fixtures/schemas/simple-schema";
import { simpleSmallSchema } from "./fixtures/schemas/simple-small-schema";

describe("[App]", () => {
  it("App should work", async () => {
    const { config, options } = createConfig(
      {
        schemas: {
          post: simpleSchema,
        },
        resolvers: {
          localeString: /* groq */ `"{{name}}": coalesce({{name}}[$lang], {{name}}.en)`,
          myObject: /* groq */'"{{name}}_my_object_type" { {{name}} }',
        },
        queries: {
          getPostById: ({ post }) => `
          *[_id == $id] {
              ${post.projection} 
          }`,
        },
      },
      { outPath: "./.autogroq/app" },
    );

    const app = new App(config, options);
    await app.run();
  });

  it("Should warn on emplty visitor result", async () => {
    const { config, options } = createConfig(
      {
        schemas: {
          post: simpleSmallSchema,
        },
        queries: {
          getPostById: ({ post }) => `
          *[_id == $id] {
              ${post.projection} 
          }`,
        },
      },
      { outPath: "./.autogroq/app" },
    );

    const app = new App(config, options);
    // @ts-ignore
    const spy = vi.spyOn(app.logger, "warn");
    await app.run();
    expect(spy).toHaveBeenCalledWith('Schema visitor "projection" did not return a result for schema "post".');
  })
});
