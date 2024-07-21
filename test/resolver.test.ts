import { describe, expect, it } from "vitest";
import { ResolverCompiler } from "../src/lib/resolver";

describe("Basic resolver handing", () => {
  it("Should compile from a string", () => {
    const field = {
      name: "test",
      type: "custom",
      autogroq: "{{name}}",
    };
    const compiler = new ResolverCompiler(field.autogroq);
    const groq = compiler.get(field.name);
    expect(groq).toBe("test");
  });

  it("Should compile from a factory function", () => {
    const field = {
      name: "test",
      type: "custom",
      autogroq: () => "{{name}}",
    };
    const compiler = new ResolverCompiler(field.autogroq);
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
    expect(queries.some(Boolean)).toBe(!false);
  });

  it("Should add name to anonymous object", () => {
    const field = {
      name: "test",
      type: "custom",
      autogroq: () => "{ _id, name }",
    };
    const compiler = new ResolverCompiler(field.autogroq);
    const groq = compiler.get(field.name);
    expect(groq).toBe("test { _id, name }");
  });

  it("Should unwrap object", () => {
    const field = {
      name: "test",
      type: "custom",
      autogroq: () => "test { _id, name }",
    };
    const compiler = new ResolverCompiler(field.autogroq);
    const groq = compiler.getUnwrapped(field.name);
    expect(groq).toBe("_id, name");
  });
});
