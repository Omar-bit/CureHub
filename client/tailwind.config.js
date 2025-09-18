/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      // Custom spacing scale
      spacing: {
        18: '4.5rem',
        72: '18rem',
        80: '20rem',
        88: '22rem',
        96: '24rem',
      },

      // Typography scale
      fontSize: {
        xs: ['0.75rem', { lineHeight: '1rem' }],
        sm: ['0.875rem', { lineHeight: '1.25rem' }],
        base: ['1rem', { lineHeight: '1.5rem' }],
        lg: ['1.125rem', { lineHeight: '1.75rem' }],
        xl: ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
        '5xl': ['3rem', { lineHeight: '1' }],
      },

      // Custom font weights
      fontWeight: {
        medium: '500',
        semibold: '600',
        bold: '700',
        extrabold: '800',
      },

      // Custom border radius
      borderRadius: {
        sm: '0.25rem',
        md: '0.375rem',
        lg: '0.5rem',
        xl: '0.75rem',
        '2xl': '1rem',
        '3xl': '1.5rem',
      },

      // Box shadow for depth
      boxShadow: {
        soft: '0 2px 8px 0 rgba(99, 99, 99, 0.2)',
        medium: '0 4px 12px 0 rgba(99, 99, 99, 0.2)',
        strong: '0 8px 24px 0 rgba(99, 99, 99, 0.15)',
        sidebar: '2px 0 8px 0 rgba(99, 99, 99, 0.1)',
      },

      // Animation and transitions
      animation: {
        'slide-in-left': 'slideInLeft 0.3s ease-out',
        'slide-out-left': 'slideOutLeft 0.3s ease-in',
        'fade-in': 'fadeIn 0.2s ease-out',
        'fade-out': 'fadeOut 0.2s ease-in',
      },

      keyframes: {
        slideInLeft: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        slideOutLeft: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-100%)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeOut: {
          '0%': { opacity: '1' },
          '100%': { opacity: '0' },
        },
      },

      // Custom z-index scale
      zIndex: {
        1: '1',
        10: '10',
        20: '20',
        30: '30',
        40: '40',
        50: '50',
        sidebar: '100',
        modal: '200',
        tooltip: '300',
      },

      // Sidebar specific widths
      width: {
        sidebar: '16rem', // 256px - default sidebar width
        'sidebar-collapsed': '4rem', // 64px - collapsed sidebar width
      },

      // Custom max widths for content areas
      maxWidth: {
        content: '72rem', // 1152px - main content max width
        'sidebar-content': '80rem', // 1280px - with sidebar content
      },

      // Grid template columns for layout
      gridTemplateColumns: {
        sidebar: '16rem 1fr',
        'sidebar-collapsed': '4rem 1fr',
      },
    },
  },
  plugins: [],
};
