import type { IntrinsicDefinitions } from "sanity";


export type SanitySchemaTypes = keyof IntrinsicDefinitions;

export type Documentlike = {
  name: string;
  type: SanitySchemaTypes[number] | string;
  resolver?: boolean | any;
  of?: Documentlike[];
  fields?: Documentlike[];
};

/**
 * @description A valid groq statement either containing of a left and a right side
 * (leftSide { rightSide}) or just aright side. The string can contain the schema field
 * name as a template variable in the mustache syntax: Eg. "{{name}}".
 *
 * When the statement has only a right side, the shema field name will be used for the
 * left side. If the field is an object, and it it needs to be resolved as such, it needs
 * to wrapped into brackets. If the field is an object, and it is a direct child of an
 * array, it will be unwraped.
 */
type GroqExpressionString = string;

/**
 * @description A factory function that returns a valid groq statement. The function
 * will be evaluated when the schmema is parsed at build / development time.
 */
type GroqExpressionFactory = (args?: any) => GroqExpressionString;
type GroqExpression = GroqExpressionString | GroqExpressionFactory;

type GroqObject = {
  rename?: string;
  selector: GroqExpression;
};

export type Resolver = GroqExpression | GroqObject;


export type StringLike = ((...args: any) => string) | string;
