/**
 * Utility functions for consultation type styling
 * Provides consistent color schemes for appointments across the application
 */

/**
 * Get styling for a consultation type based on its location
 * @param {string} location - The consultation location (ONSITE, ONLINE, ATHOME)
 * @returns {object} Style object with colors and labels
 */
export const getConsultationTypeStyles = (location) => {
  switch (location) {
    case "ONLINE":
      return {
        bgColor: "bg-blue-500",
        bgColorLight: "bg-blue-100",
        textColor: "text-blue-700",
        textColorLight: "text-blue-800",
        borderColor: "border-blue-500",
        hoverBg: "hover:bg-blue-600",
        badgeBg: "bg-blue-100",
        badgeText: "text-blue-700",
        label: "Téléconsultation",
        icon: "💻",
      };
    case "ATHOME":
      return {
        bgColor: "bg-red-500",
        bgColorLight: "bg-red-100",
        textColor: "text-red-700",
        textColorLight: "text-red-800",
        borderColor: "border-red-500",
        hoverBg: "hover:bg-red-600",
        badgeBg: "bg-red-100",
        badgeText: "text-red-700",
        label: "Visite à domicile",
        icon: "🏠",
      };
    case "ONSITE":
    default:
      return {
        bgColor: "bg-green-500",
        bgColorLight: "bg-green-100",
        textColor: "text-green-700",
        textColorLight: "text-green-800",
        borderColor: "border-green-500",
        hoverBg: "hover:bg-green-600",
        badgeBg: "bg-green-100",
        badgeText: "text-green-700",
        label: "Cabinet",
        icon: "🏥",
      };
  }
};

/**
 * Get the color classes for appointment display in calendar views
 * @param {object} appointment - The appointment object
 * @returns {object} Object containing CSS classes for styling
 */
export const getAppointmentColorClasses = (appointment) => {
  const location = appointment.consultationType?.location;
  const styles = getConsultationTypeStyles(location);

  // Handle cancelled/completed status overrides
  if (appointment.status === "CANCELLED") {
    return {
      bgColor: "bg-gray-400",
      textColor: "text-white",
      bgColorLight: "bg-gray-200",
      textColorLight: "text-gray-600",
      hoverBg: "hover:bg-gray-500",
    };
  }

  if (appointment.status === "COMPLETED") {
    return {
      bgColor: "bg-green-600",
      textColor: "text-white",
      bgColorLight: "bg-green-100",
      textColorLight: "text-green-800",
      hoverBg: "hover:bg-green-700",
    };
  }

  return {
    bgColor: styles.bgColor,
    textColor: "text-white",
    bgColorLight: styles.bgColorLight,
    textColorLight: styles.textColorLight,
    hoverBg: styles.hoverBg,
  };
};
