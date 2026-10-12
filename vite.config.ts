import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { viteSingleFile } from 'vite-plugin-singlefile'

// viteSingleFile actioneaza doar la build: dist/index.html contine tot
// (script, stiluri, fonturi), ca sa se deschida din file:// la examen.
// VITE_POLL=1 e setat de containerul de dezvoltare, unde evenimentele de
// fisier nu trec prin volumul montat de pe Windows.
export default defineConfig({
  plugins: [react(), viteSingleFile()],
  server: {
    port: 5173,
    strictPort: true,
    watch: { usePolling: process.env.VITE_POLL === '1' },
  },
  test: {
    include: ['tests/**/*.test.{ts,tsx}'],
  },
})
