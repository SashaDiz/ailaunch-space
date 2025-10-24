/* eslint-env node */
import daisyui from 'daisyui';

export default {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        'sans': ['TikTok Sans', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'pulse-slow': 'pulse 3s infinite',
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
  plugins: [
    daisyui
  ],
  daisyui: {
    themes: [
      {
        light: {
          'primary': '#ED0D79',
          'secondary': '#7c3aed',
          'accent': '#06b6d4',
          'neutral': '#1f2937', // Darker for better contrast
          'base-100': '#ffffff',
          'base-200': '#f9fafb',
          'base-300': '#f3f4f6',
          'base-content': '#1f2937', // Darker base content for better contrast
          'info': '#0ea5e9',
          'success': '#059669', // Darker green for better contrast
          'warning': '#d97706', // Darker orange for better contrast
          'error': '#dc2626', // Darker red for better contrast
        },
        dark: {
          'primary': '#ED0D79',
          'secondary': '#8b5cf6',
          'accent': '#06b6d4',
          'neutral': '#e5e7eb', // Lighter for better contrast on dark
          'base-100': '#111827',
          'base-200': '#1f2937',
          'base-300': '#374151',
          'base-content': '#f9fafb', // Lighter content for better contrast
          'info': '#0ea5e9',
          'success': '#22c55e', // Lighter green for better contrast
          'warning': '#fbbf24', // Lighter orange for better contrast
          'error': '#f87171', // Lighter red for better contrast
        },
        abyss: {
          'primary': '#ED0D79',
          'secondary': '#64748b',
          'accent': '#0ea5e9',
          'neutral': '#334155',
          'base-100': '#0f172a',
          'base-200': '#1e293b',
          'base-300': '#334155',
          'info': '#38bdf8',
          'success': '#22d3ee',
          'warning': '#fbbf24',
          'error': '#ef4444',
        },
      }
    ],
    darkTheme: 'dark',
    base: true,
    styled: true,
    utils: true,
    logs: false,
    rtl: false,
    prefix: '',
  },
}; 