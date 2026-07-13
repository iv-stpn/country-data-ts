// "US-NY" -> "NY"; leaves codes without a 2-letter country prefix untouched.
const COUNTRY_CODE_PREFIX_REGEX = /^[A-Z]{2}-/;
export function stripPrefix(code: string): string {
  return code.replace(COUNTRY_CODE_PREFIX_REGEX, '');
}
