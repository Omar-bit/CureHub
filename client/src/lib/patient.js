/**
 * Utilities for patient name handling.
 *
 * The project stores the full name in the `name` field using a special
 * separator `!SP!` between firstName and lastName (e.g. "Omar !SP! Bouassida").
 * These helpers centralize parsing and building that format.
 */

const SEPARATOR = '!SP!';

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
  if (!name) return { firstName: '', lastName: '' };

  // Prefer the explicit separator when present
  if (name.includes(SEPARATOR)) {
    const parts = name.split(SEPARATOR).map((p) => p.trim());
    return {
      firstName: parts[0] || '',
      lastName: parts.slice(1).join(' ') || '',
    };
  }

  // Fallback: split on whitespace
  const tokens = name.trim().split(/\s+/);
  return {
    firstName: tokens[0] || '',
    lastName: tokens.slice(1).join(' ') || '',
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
export function buildPatientName(firstName = '', lastName = '') {
  const f = (firstName || '').trim();
  const l = (lastName || '').trim();

  if (!f && !l) return '';
  if (!l) return f;
  if (!f) return l;

  return `${f} ${SEPARATOR} ${l}`;
}

/**
 * Get formatted patient name from patient object
 * @param {Object} patient - Patient object with name or firstName/lastName
 * @returns {string} Formatted patient name
 */
export function getPatientDisplayName(patient) {
  if (!patient) return '';

  // If stored as single `name` field, split it using helper
  if (patient.name) {
    const { firstName, lastName } = splitPatientName(patient.name);
    const full = `${firstName} ${lastName}`.trim();
    if (full) return full;
  }

  // Fallback to separate fields if available
  if (patient.firstName || patient.lastName) {
    return `${patient.firstName || ''} ${patient.lastName || ''}`.trim();
  }

  return '';
}

/**
 * Get all patient names from an appointment (supports multi-patient appointments)
 * @param {Object} appointment - Appointment object
 * @returns {string} Comma-separated list of patient names
 */
export function getAppointmentPatientsDisplay(appointment) {
  if (!appointment) return '';

  const patients = [];

  // Get patients from appointmentPatients array (new multi-patient structure)
  if (
    appointment.appointmentPatients &&
    appointment.appointmentPatients.length > 0
  ) {
    const sortedPatients = [...appointment.appointmentPatients].sort((a, b) => {
      // Primary patient first
      if (a.isPrimary && !b.isPrimary) return -1;
      if (!a.isPrimary && b.isPrimary) return 1;
      return 0;
    });

    sortedPatients.forEach((ap) => {
      if (ap.patient) {
        const name = getPatientDisplayName(ap.patient);
        if (name) patients.push(name);
      }
    });
  }

  // Fallback to old single patient field for backward compatibility
  if (patients.length === 0 && appointment.patient) {
    const name = getPatientDisplayName(appointment.patient);
    if (name) patients.push(name);
  }

  // Fallback to appointment title
  if (patients.length === 0 && appointment.title) {
    return appointment.title;
  }

  return patients.join(', ') || '—';
}

export default {
  splitPatientName,
  buildPatientName,
  getPatientDisplayName,
  getAppointmentPatientsDisplay,
};
