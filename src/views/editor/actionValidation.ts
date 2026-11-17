export const isOptionalPositiveInteger = (
  value: string | number | undefined,
) => {
  if (value === undefined || String(value).trim() === "") return true;
  return (
    /^\d+$/.test(String(value)) &&
    Number.isSafeInteger(Number(value)) &&
    Number(value) > 0
  );
};

export const isOptionalNonNegativeNumber = (
  value: string | number | undefined,
) => {
  if (value === undefined || String(value).trim() === "") return true;
  return Number.isFinite(Number(value)) && Number(value) >= 0;
};

export const getRegexError = (expression: string): string | undefined => {
  try {
    new RegExp(expression);
  } catch (error) {
    if (error instanceof SyntaxError) return error.message;
    throw error;
  }
};

export type ScriptArgument = { key: string; value: unknown };
export const getScriptArgumentError = (
  rows: ScriptArgument[],
  index: number,
) => {
  const row = rows[index];
  if (
    !row.key.trim() &&
    row.value !== "" &&
    row.value !== undefined &&
    row.value !== null
  )
    return "argumentNameRequired";
};

export const isScriptSourceValid = (content: string) => {
  const fragments = content.split("#");
  try {
    for (const fragment of fragments.slice(1)) decodeURIComponent(fragment);
  } catch (error) {
    if (error instanceof URIError) return false;
    throw error;
  }
  const source = fragments[0].trim();
  if (!source || source.startsWith("/") || /^[a-zA-Z]:[\\/]/.test(source))
    return true;
  try {
    const url = new URL(source);
    return (
      ["http:", "https:", "file:"].includes(url.protocol) &&
      (url.protocol === "file:" || !!url.hostname)
    );
  } catch (error) {
    if (error instanceof TypeError) return false;
    throw error;
  }
};
