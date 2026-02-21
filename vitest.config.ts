import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// https://vitest.dev/config/
export default defineConfig({
	plugins: [react()],
	test: {
		environment: 'jsdom',
		globals: true,
		setupFiles: ['./src/test/setup.ts'],
		include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
		coverage: {
			provider: 'v8',
			reporter: ['text', 'json', 'html'],
			include: ['src/**/*'],
			exclude: [
			'src/**/*.d.ts',
			'src/main.tsx',
			'src/App.tsx',
			'src/index.css',
		],
		},
	},
})
