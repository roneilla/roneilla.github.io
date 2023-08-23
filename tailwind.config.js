/** @type {import('tailwindcss').Config} */
module.exports = {
	content: ['./src/**/*.{js,jsx,ts,tsx}'],
	theme: {
		colors: {
			'primary': '#222222',
			'background': '#FEFEFE',
			'schroeder': '#FFF3F3',
			'tpol': '#F9F4E9',
			'splinter': '#FCF2F7',
			'tippt': '#F1FFF0'

		},
		fontFamily: {
			sans: ['Neue Montreal', 'sans-serif'],
			serif: ['PP Migra', 'serif'],
		},
		extend: {},
	},
	plugins: [],
};
