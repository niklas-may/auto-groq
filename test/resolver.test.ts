import { describe, expect, it } from "vitest";
import { ResolverCompiler } from "../src/lib/resolver";
import { Documentlike } from "../src/types";

describe("Basic resolver handing", () => {
  it("Should compile from a string", () => {
    const field: Documentlike = {
      name: "test",
      type: "custom",
      resolver: "{{name}}",
    };
    const compiler = new ResolverCompiler(field.resolver);
    const groq = compiler.get(field.name);
    expect(groq).toBe("test");
  });

  it("Should compile from a factory function", () => {
    const field: Documentlike = {
      name: "test",
      type: "custom",
      resolver: () => "{{name}}",
    };
    const compiler = new ResolverCompiler(field.resolver);
    const groq = compiler.get(field.name);
    expect(groq).toBe("test");
  });

});

describe("Modify groq string", () => {
  it("Should find anymous objects", () => {
    const queries = [
      /* groq */ `
        {
          fieldName
        }
      `,
      /* groq */ `
        {
          fieldName
        },
      `,
      /* groq */ `
        {
          fieldName
        } ,
      `,
    ].map((groq) => new ResolverCompiler(groq).isAnonymouseObject);
    expect(queries.some((query) => query)).toBe(!false);
  });

  it("Should add name to anonymous object", () => {
    const field: Documentlike = {
      name: "test",
      type: "custom",
      resolver: () => "{ _id, name }",
    };
    const compiler = new ResolverCompiler(field.resolver);
    const groq = compiler.get(field.name);
    expect(groq).toBe("test { _id, name }");
  });

  it("Should unwrap object", () => {
    const field: Documentlike = {
      name: "test",
      type: "custom",
      resolver: () => "test { _id, name }",
    };
    const compiler = new ResolverCompiler(field.resolver);
    const groq = compiler.getUnwrapped(field.name);
    expect(groq).toBe("_id, name");
  });
});
