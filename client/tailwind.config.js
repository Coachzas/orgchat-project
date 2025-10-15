/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      backgroundImage: {
        "chat-background": "url('/org-bg.png')",
      },
      colors: {
        secondary: "#8696a0",
        "teal-light": "#3b82f6",
        "photopicker-overlay-background": "rgba(30,42,49,0.8)",
        "dropdown-background": "#233138",
        "dropdown-background-hover": "#182229",
        "input-background": " #2a3942",
        "primary-strong": "#e9edef",
        "panel-header-background": "#202c33",
        "panel-header-icon": "#2563eb",
        "icon-lighter": "#8696a0",
        "icon-green": "#00a884",
        "search-input-container-background": "#111b21",
        "conversation-border": "rgba(134,150,160,0.15)",
        "conversation-panel-background": "#0b141a",
        "background-default-hover": "#ffffff",
        "incoming-background": "#202c33",
        "outgoing-background": "#3b82f6",
        "bubble-meta": "hsla(0,0%,100%,0.6)",
        "icon-ack": "#53bdeb",
      },
      gridTemplateColumns: {
        main: "1fr 2.4fr",
      },
    },
  },
  plugins: [],
};
