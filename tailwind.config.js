/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: "var(--primary)",
                "primary-hover": "var(--primary-hover)",
                secondary: "var(--secondary)",
                accent: "var(--accent)",
                background: "var(--background)",
                foreground: "var(--foreground)",
            },
            fontFamily: {
                sans: ["var(--font-main)", "sans-serif"],
            },
            animation: {
                'fade-up': 'fadeUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards',
                'glow': 'glow 2s ease-in-out infinite alternate',
                'float': 'float 6s ease-in-out infinite',
            },
            keyframes: {
                fadeUp: {
                    '0%': { opacity: '0', transform: 'translateY(20px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
                glow: {
                    '0%': { boxShadow: '0 0 10px rgba(34, 197, 94, 0.2), 0 0 20px rgba(34, 197, 94, 0.2)' },
                    '100%': { boxShadow: '0 0 20px rgba(34, 197, 94, 0.6), 0 0 40px rgba(34, 197, 94, 0.4)' },
                },
                float: {
                    '0%, 100%': { transform: 'translateY(0)' },
                    '50%': { transform: 'translateY(-10px)' },
                }
            }
        },
    },
    plugins: [],
};
