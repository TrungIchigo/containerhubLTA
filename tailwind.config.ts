import type { Config } from 'tailwindcss'

const config: Config = {
    darkMode: ['class'],
    content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
  	extend: {
  		colors: {
  			// Primary Colors - Green Logistics Theme
  			primary: {
  				DEFAULT: '#4CAF50', // Modern green for main actions
  				dark: '#388E3C',    // Hover state for primary buttons
  				light: '#C8E6C9',   // Success notification backgrounds
  				foreground: '#FFFFFF' // Text on primary backgrounds
  			},
  			// Secondary Colors - Navy Blue for Professional Feel
  			secondary: {
  				DEFAULT: '#2C3E50', // Navy blue for professional elements
  				dark: '#212F3D',    // Sidebar, header backgrounds
  				light: '#8592A0',   // Secondary text, inactive icons
  				foreground: '#FFFFFF' // Text on secondary backgrounds
  			},
  			// Accent Colors - Amber for Attention
  			accent: {
  				DEFAULT: '#FFC107', // Amber for pending/warning states
  				dark: '#FFA000',    // Hover state for accent elements
  				light: '#FFECB3',   // Warning notification backgrounds
  				foreground: '#111827' // Text on accent backgrounds
  			},
  			// Feedback & Status Colors
  			success: '#4CAF50',   // Same as primary for consistency
  			warning: '#FFC107',   // Same as accent for pending states
  			danger: '#F44336',    // Clear red for decline/error actions
  			info: '#2196F3',      // Blue for general information
  			
  			// Neutral Colors for Layout
  			background: '#F4F7F9', // Light gray background
  			foreground: '#FFFFFF', // White for cards, modals, inputs
  			border: '#E5E7EB',     // Light border color
  			
  			// Text Colors
  			'text-primary': '#111827',   // Almost black for main text
  			'text-secondary': '#6B7280', // Gray for secondary text
  			
  			// Shadcn/ui compatible colors (using CSS variables)
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			destructive: {
  				DEFAULT: '#F44336', // Use our danger color
  				foreground: '#FFFFFF'
  			},
  			input: 'hsl(var(--input))',
  			ring: '#4CAF50', // Use primary color for focus rings
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			}
  		},
  		// Typography - Inter font as specified in Design System
  		fontFamily: {
  			sans: ['var(--font-sans)', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif']
  		},
  		// Font sizes - more reasonable sizes
  		fontSize: {
  			'h1': ['28px', { lineHeight: '1.2', fontWeight: '700' }], // Slightly smaller
  			'h2': ['22px', { lineHeight: '1.3', fontWeight: '700' }], // Reduced from 24px
  			'h3': ['18px', { lineHeight: '1.4', fontWeight: '600' }], // Reduced from 20px
  			'body': ['14px', { lineHeight: '1.5', fontWeight: '400' }], // Reduced from 16px
  			'body-small': ['12px', { lineHeight: '1.5', fontWeight: '400' }], // Reduced from 14px
  			'label': ['13px', { lineHeight: '1.4', fontWeight: '500' }], // Reduced from 14px
  		},
  		// Border radius for modern feel
  		borderRadius: {
  			'card': '8px',       // Reduced from 12px
  			'button': '6px',     // Reduced from 8px
  			'input': '4px',      // Reduced from 6px
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
  		// Box shadows for depth - more subtle
  		boxShadow: {
  			'card': '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px 0 rgba(0, 0, 0, 0.03)',
  			'card-hover': '0 2px 4px -1px rgba(0, 0, 0, 0.08), 0 1px 2px -1px rgba(0, 0, 0, 0.04)',
  			'button': '0 1px 2px 0 rgba(0, 0, 0, 0.03)',
  		}
  	}
  },
  plugins: [require("tailwindcss-animate")],
}
export default config 