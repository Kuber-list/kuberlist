/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        navy:   '#022440', navyD:  '#011A30',
        gold:   '#CEAE5E', goldD:  '#B89A4F',
        olive:  '#677555', oliveD: '#566343',
        bg:     '#F8F9F6', bgW:    '#FFFFFF',
        text:   '#111827', muted:  '#6B7280',
        border: '#E2E4DF', dim:    '#9CA3AF',
      },
      fontFamily: {
        display: ['"Cormorant Garamond"', 'Georgia', 'serif'],
        body:    ['"DM Sans"', 'system-ui', 'sans-serif'],
        mono:    ['"JetBrains Mono"', 'monospace'],
      },
      boxShadow: {
        card:  '0 1px 4px rgba(2,36,64,0.07), 0 4px 16px rgba(2,36,64,0.04)',
        gold:  '0 2px 12px rgba(206,174,94,0.22)',
        navy:  '0 4px 24px rgba(2,36,64,0.14)',
        modal: '0 8px 40px rgba(2,36,64,0.18)',
      },
    },
  },
  plugins: [],
};
