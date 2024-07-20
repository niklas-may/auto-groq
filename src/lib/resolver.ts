import _ from "lodash";
import { IContextModule, Context } from "./context";

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

export class ResolverService implements IContextModule {
  data = new Map<string, ResolverCompiler>();

  constructor(public context: Context) {}

  get(id: string): ResolverCompiler | undefined {
    if (this.data.has(id)) {
      return this.data.get(id);
    }
    const rawResolver = this.context.config.resolvers ? this.context.config.resolvers[id] : undefined;
    const res = rawResolver ? this.set(id, rawResolver).get(id) : undefined;

    return res;
  }

  set(id: string, resolver: Resolver) {
    return this.data.set(id, new ResolverCompiler(resolver));
  }

  has(id: string) {
    return this.data.has(id) || !!(this.context.config.resolvers && this.context.config.resolvers[id]);
  }
}

export class ResolverCompiler {
  private template = "";
  isObject: boolean;
  isAnonymouseObject: boolean;
  isRenamed: boolean;

  constructor(resolver: Resolver) {
    this.template = this.getTemplate(resolver);
    const groqRaw = this.compileTemplate(this.template, { name: "test" });
    const groq = this.trim(groqRaw);
    this.isObject = this.checkIsObject(groq);
    this.isAnonymouseObject = this.checkAnonymouseObject(groq);
    this.isRenamed = this.checkIsRenamed(groq);
  }

  get(name: string) {
    const groqRaw = this.compileTemplate(this.template, { name });
    const groq = this.trim(groqRaw);
    return this.isAnonymouseObject ? `${name} ${groq}` : groq;
  }

  getUnwrapped(name: string) {
    const groqRaw = this.compileTemplate(this.template, { name });
    const groq = this.trim(groqRaw);
    if (this.isObject) {
      const [start, end] = [groq.indexOf("{"), groq.lastIndexOf("}")];
      return this.trim(groq.substring(start + 1, end));
    } else {
      throw new Error("The field is not an object");
    }
  }

  private checkIsRenamed(groq: string) {
    return groq.startsWith('"');
  }

  private checkAnonymouseObject(groq: string) {
    return groq.startsWith("{") && groq.endsWith("}");
  }

  private checkIsObject(groq: string) {
    return groq.endsWith("}");
  }

  private getTemplate(resolver: Resolver) {
    const name = typeof resolver === "object" ? resolver?.rename : "";
    const groq = typeof resolver === "object" ? resolver.selector : resolver;

    let selector = name ? `"${name}": ` : "";
    selector += typeof groq === "function" ? groq() : groq;

    return selector;
  }

  private compileTemplate(template: string, data: TemplateVariables) {
    _.templateSettings.interpolate = /{{([\S\s]+?)}}/g;
    return _.template(template)(data);
  }

  private trim(str: string) {
    // https://sanity-io.github.io/GROQ/draft/#sec-White-Space
    // eslint-disable-next-line no-control-regex
    const whiteSpacePattern = /^[\u0009-\u000D \u0085\u00A0]+|[\u0009-\u000D \u0085\u00A0]+$/g;
    const comaPattern = /,$/;

    return str.replace(whiteSpacePattern, "").replace(comaPattern, "").replace(whiteSpacePattern, "");
  }
}
