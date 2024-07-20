import { Resolver } from "src/lib/resolver";

export type AutoGroqFieldConfigObject = {
  resolver: Resolver;
  followReference: boolean | string;
};

export type AutoGroqFieldConfig = Resolver | AutoGroqFieldConfigObject;

export type Documentlike = {
  name: string;
  type: string;
  of?: Documentlike[];
  to?: Documentlike[];
  fields?: Documentlike[];
  autogroq?: AutoGroqFieldConfig;
};
