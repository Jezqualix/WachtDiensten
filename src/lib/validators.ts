/**
 * Valideer telefoonnummer: moet beginnen met + en 10 of 11 cijfers bevatten.
 * Voorbeelden: +32471234567, +3212345678
 */
export function isValidPhone(phone: string): boolean {
  return /^\+\d{10,11}$/.test(phone.replace(/\s/g, ""));
}

/**
 * Sanitize string input: verwijder gevaarlijke karakters.
 */
export function sanitize(input: string): string {
  return input.replace(/[<>'";&]/g, "").trim();
}

/**
 * Valideer diensttype.
 */
export function isValidDienstType(type: string): boolean {
  return type === "Garage" || type === "App";
}
