import { describe, expect, it } from "vitest";
import { App } from "../src/app";
import { createConfig } from "../src/lib/config";
import { simpleSchema } from "./fixtures/schemas/simple-schema";

describe("[App]", () => {
  it("App should work", async () => {
    const { config, options } = createConfig(
      {
        schemas: {
          post: simpleSchema,
        },
        resolvers: {
          localeString: /* groq */ `"{{name}}": coalesce({{name}}[$lang], {{name}}.en)`,
          myObject: '"{{name}}_my_object_type" { {{name}} }',
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
});
