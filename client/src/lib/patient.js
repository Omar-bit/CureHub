/**
 * Utilities for patient name handling.
 *
 * The project stores the full name in the `name` field using a special
 * separator `!SP!` between firstName and lastName (e.g. "Omar !SP! Bouassida").
 * These helpers centralize parsing and building that format.
 */

const SEPARATOR = "!SP!";

/**
 * Split a stored full name into { firstName, lastName }.
 * If the special separator is present it will be used. Otherwise we fall
 * back to splitting on whitespace and taking the first token as firstName
 * and the rest as lastName.
 *
 * @param {string|undefined|null} name
 * @returns {{ firstName: string, lastName: string }}
 */
export function splitPatientName(name) {
  if (!name) return { firstName: "", lastName: "" };

  // Prefer the explicit separator when present
  if (name.includes(SEPARATOR)) {
    const parts = name.split(SEPARATOR).map((p) => p.trim());
    return {
      firstName: parts[0] || "",
      lastName: parts.slice(1).join(" ") || "",
    };
  }

  // Fallback: split on whitespace
  const tokens = name.trim().split(/\s+/);
  return {
    firstName: tokens[0] || "",
    lastName: tokens.slice(1).join(" ") || "",
  };
}

/**
 * Build the stored full name using the special separator. This ensures a
 * consistent format when sending data to the backend.
 *
 * @param {string} firstName
 * @param {string} lastName
 * @returns {string}
 */
export function buildPatientName(firstName = "", lastName = "") {
  const f = (firstName || "").trim();
  const l = (lastName || "").trim();

  if (!f && !l) return "";
  if (!l) return f;
  if (!f) return l;

  return `${f} ${SEPARATOR} ${l}`;
}

export default {
  splitPatientName,
  buildPatientName,
};
