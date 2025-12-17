/**
 * AI Service - Frontend client for AI message generation
 *
 * This service calls the backend AI endpoints to generate professional messages.
 * The actual AI processing happens securely on the server side.
 *
 * Usage:
 *   import { aiService } from './services/gemini';
 *
 *   // Generate a professional email
 *   const email = await aiService.generateProfessionalEmail({
 *     description: 'Remind about appointment',
 *     patientName: 'John Doe',
 *     doctorName: 'Dr. Smith',
 *     language: 'fr'
 *   });
 *
 *   // Generate a professional SMS
 *   const sms = await aiService.generateProfessionalSMS({
 *     description: 'Appointment reminder',
 *     patientName: 'John Doe',
 *     doctorName: 'Dr. Smith'
 *   });
 */

import { api } from './api';

/**
 * Generate a professional medical email via backend AI
 * @param {Object} params - Email generation parameters
 * @param {string} params.description - User description of what the email should contain
 * @param {string} params.patientName - Name of the patient
 * @param {string} params.doctorName - Name of the doctor
 * @param {string} params.clinicName - Name of the clinic (optional)
 * @param {string} params.language - Language code ('fr' or 'en', default: 'fr')
 * @returns {Promise<string>} Generated email content
 */
async function generateProfessionalEmail({
  description,
  patientName,
  doctorName,
  clinicName = '',
  language = 'fr',
}) {
  const response = await api.post('/ai/generate-message', {
    description,
    patientName,
    doctorName,
    clinicName,
    language,
    type: 'email',
  });

  if (!response.data?.success) {
    throw new Error(response.data?.message || 'Failed to generate email');
  }

  return response.data.message;
}

/**
 * Generate a professional SMS message via backend AI
 * @param {Object} params - SMS generation parameters
 * @param {string} params.description - User description of what the SMS should contain
 * @param {string} params.patientName - Name of the patient
 * @param {string} params.doctorName - Name of the doctor
 * @param {string} params.clinicName - Name of the clinic (optional)
 * @param {string} params.language - Language code ('fr' or 'en', default: 'fr')
 * @returns {Promise<string>} Generated SMS content
 */
async function generateProfessionalSMS({
  description,
  patientName,
  doctorName,
  clinicName = '',
  language = 'fr',
}) {
  const response = await api.post('/ai/generate-message', {
    description,
    patientName,
    doctorName,
    clinicName,
    language,
    type: 'sms',
  });

  if (!response.data?.success) {
    throw new Error(response.data?.message || 'Failed to generate SMS');
  }

  return response.data.message;
}

/**
 * Check if AI service is configured on the backend
 * @returns {Promise<boolean>} True if AI is configured
 */
async function isConfigured() {
  try {
    const response = await api.post('/ai/check-status');
    return response.data?.configured || false;
  } catch {
    return false;
  }
}

// Export the service object with all methods
export const geminiService = {
  generateProfessionalEmail,
  generateProfessionalSMS,
  isConfigured,
};

// Also export as aiService for clarity
export const aiService = geminiService;

export default geminiService;
