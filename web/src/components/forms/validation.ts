/** Small, shared field validators for the join and contribute forms. */

export function isBlank(value: string): boolean {
  return value.trim().length === 0
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function isValidEmail(value: string): boolean {
  return EMAIL_RE.test(value.trim())
}

/** Accepts blank (year is optional) or a plausible 4-digit programme-era year. */
export function isValidYear(value: string): boolean {
  if (isBlank(value)) return true
  if (!/^\d{4}$/.test(value.trim())) return false
  const year = Number(value)
  return year >= 1975 && year <= 2030
}
