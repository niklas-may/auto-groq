import type { SanitySchemaTypes } from "./../types";

function safelyGenerateAllSanityTypesArray<T extends SanitySchemaTypes[]>(keys: T & ([SanitySchemaTypes] extends [T[number]] ? T : never)) {
  return keys;
}

export const sanitySchemaTypes = safelyGenerateAllSanityTypesArray([
  "array",
  "block",
  "boolean",
  "crossDatasetReference",
  "date",
  "datetime",
  "document",
  "email",
  "file",
  "geopoint",
  "image",
  "number",
  "object",
  "reference",
  "slug",
  "string",
  "text",
  "url",
]);
