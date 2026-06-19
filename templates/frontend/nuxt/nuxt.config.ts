import tailwindcss from "@tailwindcss/vite";

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
	compatibilityDate: "2025-07-15",
	devtools: { enabled: true },
	modules: ["@nuxtjs/color-mode"],
	css: ["~/globals.css"],
	colorMode: {
		classSuffix: "",
		preference: "dark", // default theme
		fallback: "dark", // used when system preference is unavailable
	},
	vite: {
		plugins: [tailwindcss()],
	},
});
