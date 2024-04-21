import _ from "lodash";
import { Documentlike } from "../types";

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

type TemplateVariables = {
  name: string;
};

export class ResolverCompiler {
  private groq = "";

  constructor(private readonly field: Documentlike, resolver?: Resolver) {
    const template = this.getTemplate(resolver);
    const groqRaw = this.compileTemplate(template, { name: this.field.name });
    this.groq = this.trim(groqRaw);
  }

  get() {
    return this.isAnonymouseObject()
      ? `${this.field.name} ${this.groq}`
      : this.groq;
  }

  getUnwrapped() {
    if(this.isObject()) {
      const [start, end]= [this.groq.indexOf("{"), this.groq.lastIndexOf("}")];
      return this.trim(this.groq.substring(start + 1, end));
    } else {
      throw new Error("The field is not an object");
    }
  }

  isAnonymouseObject() {
    return this.groq.startsWith("{") && this.groq.endsWith("}");
  }

  isObject() {
    return this.groq.endsWith("}");
  }

  private getTemplate(rOverride?: Resolver) {
    const resolver = rOverride ?? this.field.resolver;
    const name = typeof resolver === "object" ? resolver?.rename : "";
    const groq = typeof resolver === "object" ? resolver.selector : resolver;

    let selector = name ? `"${name}": ` : "";
    selector += typeof groq === "function" ? groq() : groq;

    return selector;
  }

  private compileTemplate(template: string, data: TemplateVariables) {
    _.templateSettings.interpolate = /{{([\s\S]+?)}}/g;
    return _.template(template)(data);
  }

  private trim(str: string) {
    // https://sanity-io.github.io/GROQ/draft/#sec-White-Space
    const whiteSpacePattern =
      /^[\u0009\u000A\u000B\u000C\u000D\u0020\u0085\u00A0]+|[\u0009\u000A\u000B\u000C\u000D\u0020\u0085\u00A0]+$/g;
    const comaPattern = /,$/;

    return str
      .replace(whiteSpacePattern, "")
      .replace(comaPattern, "")
      .replace(whiteSpacePattern, "");
  }
}
