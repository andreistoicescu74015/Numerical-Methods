import { readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import type { Plugin } from 'vite'
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { viteSingleFile } from 'vite-plugin-singlefile'

// Licentele a ce intra in dist/index.html: bibliotecile (React, KaTeX cu fonturile lui, CodeMirror,
// Motion...) sunt sub MIT, fonturile IBM Plex sub OFL, si amandoua cer ca textul licentei sa insoteasca
// orice copie. Pachetele se iau din modulele build-ului, inainte ca viteSingleFile (enforce: 'post')
// sa le topeasca in HTML; textele se pun la inceputul fisierului, intr-un comentariu.
function licente(): Plugin {
  const pachete = new Map<string, string>()
  let iesire = 'dist'
  return {
    name: 'licente',
    apply: 'build',
    configResolved(c) {
      iesire = resolve(c.root, c.build.outDir)
    },
    generateBundle(_, bundle) {
      for (const f of Object.values(bundle)) {
        if (f.type !== 'chunk') continue
        for (const id of f.moduleIds) {
          const cale = id.replace(/^\0/, '').replace(/\\/g, '/')
          const k = cale.lastIndexOf('node_modules/')
          if (k < 0) continue
          const rest = cale.slice(k + 'node_modules/'.length).split('/')
          const nume = rest[0].startsWith('@') ? `${rest[0]}/${rest[1]}` : rest[0]
          pachete.set(nume, cale.slice(0, k) + 'node_modules/' + nume)
        }
      }
    },
    writeBundle() {
      const texte = [...pachete].sort(([a], [b]) => a.localeCompare(b)).map(([nume, radacina]) => {
        const pj = JSON.parse(readFileSync(join(radacina, 'package.json'), 'utf8')) as { version: string; license?: string }
        const fisier = readdirSync(radacina).find((f) => /^(licen[cs]e|copying)(\.(md|txt))?$/i.test(f))
        if (!fisier) throw new Error(`pachetul ${nume} nu are fisier de licenta`)
        return `${nume} ${pj.version} (${pj.license})\n\n${readFileSync(join(radacina, fisier), 'utf8').trim()}`
      })
      texte.push(`Fonturile IBM Plex Sans si IBM Plex Mono (OFL-1.1)\n\n${readFileSync('src/fonturi/LICENSE', 'utf8').trim()}`)
      // "-->" ar inchide comentariul inainte de vreme
      const comentariu = `<!--\nLicentele bibliotecilor si fonturilor incluse in acest fisier.\n\n${texte.join('\n\n----\n\n').replaceAll('-->', '- ->')}\n-->\n`
      const html = join(iesire, 'index.html')
      writeFileSync(html, readFileSync(html, 'utf8').replace(/^(<!doctype html>\s*)/i, `$1${comentariu}`))
    },
  }
}

// viteSingleFile actioneaza doar la build: dist/index.html contine tot
// (script, stiluri, fonturi), ca sa se deschida din file:// la examen.
// VITE_POLL=1 e setat de containerul de dezvoltare, unde evenimentele de
// fisier nu trec prin volumul montat de pe Windows.
export default defineConfig({
  plugins: [react(), licente(), viteSingleFile()],
  server: {
    port: 5173,
    strictPort: true,
    watch: { usePolling: process.env.VITE_POLL === '1' },
  },
  test: {
    include: ['tests/**/*.test.{ts,tsx}'],
  },
})
