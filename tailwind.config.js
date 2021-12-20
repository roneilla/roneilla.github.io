module.exports = {
  content: [
    './components/**/*.{js,vue,ts}',
    './layouts/**/*.vue',
    './pages/**/*.vue',
    './plugins/**/*.{js,ts}',
    './nuxt.config.{js,ts}',
  ],
  purge: [],
  darkMode: false, // or 'media' or 'class'
  theme: {
    colors: {
      black: '#000000',
      'main-light': '#eeeeee',
      grey: '#666666',
    },
    extend: {},
  },
  variants: {
    extend: {},
  },
  plugins: [],
}
