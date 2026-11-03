/**
 * Phone numbers are stored in one canonical form so that the same number
 * written differently ("09 421 895 204", "+959421895204", "959-421-895204")
 * can never create a second account.
 */
export function normalizePhone(input: string): string {
  let digits = input.replace(/\D/g, "")
  if (digits.startsWith("0095")) digits = digits.slice(2)
  if (digits.startsWith("95")) return digits
  if (digits.startsWith("0")) return `95${digits.slice(1)}`
  if (digits.startsWith("9")) return `95${digits}`
  return digits
}

export function isValidPhone(input: string) {
  const phone = normalizePhone(input)
  // Myanmar mobile numbers: 95 9 + 7–9 digits
  return /^959\d{7,9}$/.test(phone)
}

/** `959421895204` → `+95 9 421 895 204` */
export function formatPhone(phone: string) {
  if (!phone.startsWith("959")) return phone
  const rest = phone.slice(3)
  return `+95 9 ${rest.replace(/(\d{3})(?=\d)/g, "$1 ")}`
}
