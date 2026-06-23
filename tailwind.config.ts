import type { Config } from 'tailwindcss';
import tailwindcssAnimate from 'tailwindcss-animate';

const config: Config = {
  darkMode: ['class'],
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      screens: { xs: '480px' },
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: { DEFAULT: 'hsl(var(--primary))', foreground: 'hsl(var(--primary-foreground))' },
        secondary: { DEFAULT: 'hsl(var(--secondary))', foreground: 'hsl(var(--secondary-foreground))' },
        muted: { DEFAULT: 'hsl(var(--muted))', foreground: 'hsl(var(--muted-foreground))' },
        accent: { DEFAULT: 'hsl(var(--accent))', foreground: 'hsl(var(--accent-foreground))' },
        card: { DEFAULT: 'hsl(var(--card))', foreground: 'hsl(var(--card-foreground))' },
      },
      borderRadius: { lg: 'var(--radius)', md: 'calc(var(--radius) - 2px)', sm: 'calc(var(--radius) - 4px)' },
      backgroundImage: { 'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))' },
      keyframes: {
        'nebula-drift-1': { '0%,100%': { transform: 'translate(0,0) scale(1)' }, '50%': { transform: 'translate(30px,-20px) scale(1.05)' } },
        'nebula-drift-2': { '0%,100%': { transform: 'translate(0,0) scale(1)' }, '50%': { transform: 'translate(-25px,15px) scale(1.03)' } },
        'stars-drift-1': { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-10px)' } },
        'stars-drift-2': { '0%,100%': { transform: 'translateX(0)' }, '50%': { transform: 'translateX(8px)' } },
        'stars-twinkle': { '0%,100%': { opacity: '0.6' }, '50%': { opacity: '1' } },
        'planet-drift-1': { '0%,100%': { transform: 'translate(0,0)' }, '50%': { transform: 'translate(-15px,10px)' } },
      },
      animation: {
        'nebula-drift-1': 'nebula-drift-1 20s ease-in-out infinite',
        'nebula-drift-2': 'nebula-drift-2 25s ease-in-out infinite',
        'stars-drift-1': 'stars-drift-1 30s ease-in-out infinite',
        'stars-drift-2': 'stars-drift-2 40s ease-in-out infinite',
        'stars-twinkle': 'stars-twinkle 4s ease-in-out infinite',
        'planet-drift-1': 'planet-drift-1 35s ease-in-out infinite',
      },
    },
  },
  plugins: [tailwindcssAnimate],
};

export default config;
