/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Custom green-based primary colors (HSL 89.3 80.4% variants)
        'primary-green': 'hsl(89.3, 80.4%, 25%)', // Main primary color
        'primary-green-light': 'hsl(89.3, 80.4%, 35%)', // Lighter variant
        'primary-green-dark': 'hsl(89.3, 80.4%, 10%)', // User's specified color
        // Keep blue colors for backward compatibility
        'primary-blue': '#1B365D',
        'primary-light': '#2E5BBA',
        'accent-green': 'hsl(89.3, 80.4%, 25%)',
        'accent-orange': '#FD7E14',
        'accent-red': '#DC3545',
        // Custom green palette based on user's color
        'green-50': 'hsl(89.3, 80.4%, 95%)',
        'green-100': 'hsl(89.3, 80.4%, 85%)',
        'green-200': 'hsl(89.3, 80.4%, 75%)',
        'green-300': 'hsl(89.3, 80.4%, 65%)',
        'green-400': 'hsl(89.3, 80.4%, 55%)',
        'green-500': 'hsl(89.3, 80.4%, 45%)',
        'green-600': 'hsl(89.3, 80.4%, 35%)',
        'green-700': 'hsl(89.3, 80.4%, 25%)',
        'green-800': 'hsl(89.3, 80.4%, 15%)',
        'green-900': 'hsl(89.3, 80.4%, 10%)', // User's specified color
      },
      fontFamily: {
        sans: ['Inter Tight', 'Inter', 'system-ui', 'sans-serif'],
        'inter-tight': ['Inter Tight', 'Inter', 'system-ui', 'sans-serif'],
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
