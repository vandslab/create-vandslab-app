<script setup lang="ts">
const system = [
	{ k: "framework", v: "Nuxt 4" },
	{ k: "runtime", v: "Vue 3 · TypeScript" },
	{ k: "styling", v: "Tailwind 4" },
	{ k: "rendering", v: "SSR · Nitro" },
];

const colorMode = useColorMode();
function toggleTheme() {
	colorMode.preference = colorMode.value === "dark" ? "light" : "dark";
}
</script>

<template>
	<main
		class="min-h-screen bg-paper text-ink font-sans flex items-center px-6 py-16"
	>
		<div class="mx-auto w-full max-w-xl">
			<!-- top bar: wordmark + live status -->
			<header class="flex items-center justify-between">
				<div class="text-2xl font-display font-extrabold tracking-tight">
					<span>Vands</span
					><span class="ml-px rounded-md bg-ink px-1.5 text-paper">LAB</span>
				</div>

				<button
					type="button"
					aria-label="Toggle theme"
					class="inline-flex size-9 items-center justify-center rounded-lg border border-line bg-panel text-ink/70 transition hover:border-ink/20 hover:text-ink hover:cursor-pointer"
					@click="toggleTheme"
				>
					<ClientOnly>
						<svg
							v-if="colorMode.value === 'dark'"
							width="18"
							height="18"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
						>
							<circle cx="12" cy="12" r="4" />
							<path
								d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"
							/>
						</svg>
						<svg
							v-else
							width="18"
							height="18"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
						>
							<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
						</svg>
						<template #fallback>
							<span class="size-[18px]" />
						</template>
					</ClientOnly>
				</button>
			</header>

			<!-- hero thesis -->
			<h1
				class="mt-16 font-display text-5xl sm:text-6xl font-extrabold leading-[0.95] tracking-tight"
			>
				Your stack
				<br />
				is live.
			</h1>
			<p class="mt-5 text-lg text-ink/55 max-w-md">
				A Vandslab starter, rendered with Nuxt. Wired and ready — now make it
				yours.
			</p>

			<!-- signature: system readout -->
			<section
				class="mt-12 overflow-hidden rounded-xl border border-line bg-panel"
			>
				<div class="h-0.5 bg-linear-to-r from-aqua to-aqua-deep" />
				<div class="px-5 pt-4 pb-5">
					<p
						class="font-mono text-[11px] uppercase tracking-widest text-ink/35"
					>
						// system
					</p>
					<dl class="mt-3 font-mono text-sm">
						<div
							v-for="row in system"
							:key="row.k"
							class="flex items-center justify-between border-b border-line/70 py-2.5 last:border-0"
						>
							<dt class="text-ink/45">{{ row.k }}</dt>
							<dd class="text-ink">{{ row.v }}</dd>
						</div>
					</dl>
				</div>
			</section>

			<!-- orient: next step -->
			<p
				class="mt-8 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-ink/55"
			>
				<span>Edit</span>
				<code class="rounded bg-ink/5 px-1.5 py-0.5 font-mono text-ink/80">
					app/pages/welcome.vue
				</code>
				<span>to begin.</span>
				<a
					href="https://nuxt.com/docs"
					target="_blank"
					rel="noopener"
					class="ml-auto inline-flex items-center gap-1 font-medium text-aqua-deep underline decoration-aqua/40 underline-offset-4 transition hover:decoration-aqua"
				>
					Nuxt docs
					<span aria-hidden="true">↗</span>
				</a>
			</p>
		</div>
	</main>
</template>
