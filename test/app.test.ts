import { describe, expect, it, vi } from "vitest";
import { App } from "../src/app";
import { createConfig } from "../src/lib/config";
import { simpleSchema } from "./fixtures/schemas/simple-schema";
import { simpleSmallSchema } from "./fixtures/schemas/simple-small-schema";

describe("[App]", () => {
  it("Query should match snapshot ", async () => {
    const { config, options } = createConfig(
      {
        schemas: {
          post: simpleSchema,
        },
        resolvers: {
          localeString: /* groq */ `"{{name}}": coalesce({{name}}[$lang], {{name}}.en)`,
          myObject: /* groq */ '"{{name}}_my_object_type" { {{name}} }',
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

    // @ts-ignore
    const res = Array.from(app.context.file.store.values()).find((f) => f.name === "getPostById").content;
    expect(res).toMatchInlineSnapshot(`
      "export const getPostByIdQuery = /* groq */ \`
      *[_id == $id] {
        ...,
        "globalResolver": coalesce(globalResolver[$lang], globalResolver.en),
        arrayWithMultipleTypes[] {
          ...,
          _type == "globalResolver" => {
            "globalResolver": coalesce(globalResolver[$lang], globalResolver.en)
          },
          _type == "obj3" => {
            ...,
            "globalResolver": coalesce(globalResolver[$lang], globalResolver.en)
          }
        },
        arrayWithOneType[] {
          ...,
          "globalResolver": coalesce(globalResolver[$lang], globalResolver.en)
        },
        arrayWithOneObjectType[] {
          ...,
          inlineResolver {
            "inlineResolver_new": inlineResolver
          }
        },
        nestedObject {
          ...,
          objectChild {
            ...,
            inlineResolver {
              "inlineResolver_property": inlineResolver
            }
          }
        }
      }
      \`;
      "
    `);
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
  });
});
