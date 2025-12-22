export const formatPhoneNumber = (value) => {
  // Remove all non-digit characters
  const digits = value.replace(/\D/g, '');
  // Limit to 10 digits
  const limitedDigits = digits.slice(0, 10);
  // Format with dots every 2 digits
  const formatted = limitedDigits.replace(/(\d{2})(?=\d)/g, '$1.');
  return formatted;
};
