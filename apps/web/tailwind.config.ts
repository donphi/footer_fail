import type { Config } from 'tailwindcss'
export default {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}'
  ],
  theme: {
    extend: {
      fontFamily: {
        sohne: ['Sohne', 'system-ui', 'sans-serif'],
        display: ['Sohne', 'system-ui', 'sans-serif'],
        body: ['Sohne', 'system-ui', 'sans-serif']
      },
      fontWeight: {
        'thin': '300',    // Sohne Buch - thin version
        'medium': '600',  // Sohne Kraftig - medium weight
        'thick': '800',   // Sohne Dreivietelfett - thick version
      }
    }
  },
  plugins: []
} satisfies Config