import { describe, expect, it, vi } from "vitest";
import { App } from "../src/app";
import { createConfig } from "../src/lib/config";
import { simpleSchema } from "./fixtures/schemas/simple-schema";
import { simpleSmallSchema } from "./fixtures/schemas/simple-small-schema";
import { simpleSmallSchemaAlt } from "./fixtures/schemas/simple-small-schema-alt";

describe("[App]", () => {
  it("Query should match snapshot ", async () => {
    const { config, options } = createConfig(
      {
        schemas: {
          simple: simpleSchema,
          small: simpleSmallSchema,
          smallAlt: simpleSmallSchemaAlt
        },
        resolvers: {
          localeString: /* groq */ `"{{name}}": coalesce({{name}}[$lang], {{name}}.en)`,
          myObject: /* groq */ '"{{name}}_my_object_type" { {{name}} }',
        },
        queries: {
          getSimpleById: ({ simple }) => `
          *[_id == $id] {
              ${simple.projection} 
          }`,
        },
      },
      { output: "./.autogroq/app" },
    );

    const app = new App(config, options);
    await app.run();

    // @ts-ignore
    const res = Array.from(app.context.file.data.values()).find((f) => f.name === "getSimpleById").content;
    expect(res).toMatchInlineSnapshot(`
      "export const getSimpleByIdQuery = /* groq */ \`
      *[_id == $id] {
        ...,
        "globalResolver": coalesce(globalResolver[$lang], globalResolver.en),
        singleTypeReferenceWithFollow[]-> {
          ...,
          "localString": coalesce(localString[$lang], localString.en)
        },
        multiTypeReferenceWithFollowSingleResolver[]-> {
          _type == "small" => {
            ...,
            "localString": coalesce(localString[$lang], localString.en)
          }
        },
        multiTypeReferenceWithFollowMultiResolver[]-> {
          _type == "small" => {
            ...,
            "localString": coalesce(localString[$lang], localString.en)
          },
          _type == "smallAlt" => {
            ...,
            "localString": coalesce(localString[$lang], localString.en)
          }
        },
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
      { output: "./.autogroq/app" },
    );

    const app = new App(config, options);
    // @ts-ignore
    const spy = vi.spyOn(app.logger, "warn");
    await app.run();
    expect(spy).toHaveBeenCalledWith('Schema visitor "projection" did not return a result for schema "post".');
  });
});
