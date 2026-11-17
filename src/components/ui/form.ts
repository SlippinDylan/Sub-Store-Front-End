import type { InjectionKey, Ref } from "vue";
export type FieldRule = {
  required?: boolean;
  message?: string;
  regex?: RegExp;
  validator?: (value: unknown) => boolean | Promise<boolean>;
};
export type FieldDefinition = { name: string; rules: FieldRule[] };
export type FieldError = { prop: string; message: string };
export type FormContext = {
  register: (id: symbol, field: () => FieldDefinition) => void;
  unregister: (id: symbol) => void;
  errors: Ref<FieldError[]>;
};
export const formContextKey: InjectionKey<FormContext> =
  Symbol("resource-form");
