import type { FieldDefinition, FieldError } from "./form";

export const validateResourceFields = async (
  state: Record<string, unknown>,
  fields: Iterable<FieldDefinition>,
  name?: string,
): Promise<FieldError[]> => {
  const errors: FieldError[] = [];
  for (const field of fields) {
    if (!field.name || (name && name !== field.name)) continue;
    const value = state[field.name];
    for (const rule of field.rules) {
      const empty =
        value == null ||
        value === "" ||
        (Array.isArray(value) && value.length === 0);
      const valid =
        rule.required && empty
          ? false
          : rule.validator
            ? await rule.validator(value)
            : rule.regex
              ? rule.regex.test(String(value ?? ""))
              : true;
      if (!valid) {
        errors.push({
          prop: field.name,
          message: rule.message || "请检查此项",
        });
        break;
      }
    }
  }
  return errors;
};
