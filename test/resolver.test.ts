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
    const compiler = new ResolverCompiler(field);
    const groq = compiler.get();
    expect(groq).toBe("test");
  });

  it("Should compile from a factory function", () => {
    const field: Documentlike = {
      name: "test",
      type: "custom",
      resolver: () => "{{name}}",
    };
    const compiler = new ResolverCompiler(field);
    const groq = compiler.get();
    expect(groq).toBe("test");
  });

  it("Should allow to override resolver", () => {
    const field: Documentlike = {
      name: "test",
      type: "custom",
      resolver: () => "{{name}}",
    };
    const compiler = new ResolverCompiler(field, "override");
    const groq = compiler.get();
    expect(groq).toBe("override");
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
    ].map((groq) =>
      new ResolverCompiler({
        name: "test",
        type: "custom",
        resolver: groq,
      }).isAnonymouseObject()
    );
    expect(queries.some((query) => query)).toBe(!false);
  });

  it("Should add name to anonymous object", () => {
    const field: Documentlike = {
      name: "test",
      type: "custom",
      resolver: () => "{ _id, name }",
    };
    const compiler = new ResolverCompiler(field);
    const groq = compiler.get();
    expect(groq).toBe("test { _id, name }");
  });

  it("Should unwrap object", () => {
    const field: Documentlike = {
      name: "test",
      type: "custom",
      resolver: () => "test { _id, name }",
    };
    const compiler = new ResolverCompiler(field);
    const groq = compiler.getUnwrapped();
    console.log(groq);
    expect(groq).toBe("_id, name");
  });
});