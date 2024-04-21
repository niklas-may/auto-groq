import { describe, it } from "vitest";

import { generate } from "../src/main";
import { simple } from "./fixtures/schemas/documents/test";

describe("generate", () => {
  it("should not fail", () => {
    generate(simple);
  });
});
