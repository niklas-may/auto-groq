import _ from "lodash";
import type {
  AbstractFieldHandler,
  FieldHandlerArgs,
} from "./field-handler-interface";

type Args = FieldHandlerArgs;

export class GroqFieldHandler implements AbstractFieldHandler {
  public onArray(args: Args) {
    const groq = this.compileArray({
      content: args.field.content,
      name: args.field.name,
      seperate: !args.field.isLastProperty,
    });

    return this.concat(args, groq);
  }
  public onObject(args: Args) {
    const groq = this.compileObject({
      content: args.field.content,
      name: args.field.name,
      seperate: !args.field.isLastProperty,
    });

    return this.concat(args, groq);
  }
  public onObjectInArray(args: Args) {
    let groq = this.compilePrimitive({
      name: args.field.content,
      seperate: !args.field.isLastProperty,
    });

    if (args.parent.length > 1) {
      groq = this.compileConditional({
        content: groq,
        name: args.field.name,
        seperate: !args.field.isLastProperty,
      });
    }

    return this.concat(args, groq);
  }
  public onPrimitive(args: Args) {
    const groq = this.compilePrimitive({
      name: args.field.name,
      seperate: !args.field.isLastProperty,
    });

    return this.concat(args, groq);
  }

  public onResolvable(args: Args) {
    return this.concat(args, "todoCustom");
  }

  public onSpread(args: Args) {
    return this.concat(args, "...,");
  }

  private concat(args: Args, groq: string) {
    const prev = args.parent.result ?? "";
    return prev + groq;
  }

  private compileObject = createCompiler<{ name: string; content: string }>(`
    {{name}} {
        {{content}}
    }`);

  private compileArray = createCompiler<{ name: string; content: string }>(`
    {{name}}[] {
        {{content}}
    }`);

  private compileConditional = createCompiler<{
    name: string;
    content: string;
  }>(`
    _type == "{{name}}" => {
        {{content}}
    }`);

  private compilePrimitive = createCompiler<{ name: string }>(`{{name}}`);
}

function createCompiler<TData extends Record<string, any>>(
  str: string
): (data: TData & { seperate: boolean }) => string {
  _.templateSettings.interpolate = /{{([\s\S]+?)}}/g;
  return _.template(`${str} {{ seperate === true ? ',' : '' }}`);
}
