#!/usr/bin/env node
// design-qa init — onboarding CLI
// Requires Node 18+ (uses native fetch + readline/promises)

import { createInterface } from 'node:readline/promises'
import { readFileSync, writeFileSync, existsSync, appendFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { stdin, stdout, cwd } from 'node:process'

// ── ANSI helpers ───────────────────────────────────────
const c = {
  reset: '\x1b[0m',
  bold:  '\x1b[1m',
  dim:   '\x1b[2m',
  blue:  '\x1b[34m',
  cyan:  '\x1b[36m',
  green: '\x1b[32m',
  yellow:'\x1b[33m',
  red:   '\x1b[31m',
  white: '\x1b[37m',
}
const bold   = (s) => `${c.bold}${s}${c.reset}`
const dim    = (s) => `${c.dim}${s}${c.reset}`
const blue   = (s) => `${c.blue}${s}${c.reset}`
const cyan   = (s) => `${c.cyan}${s}${c.reset}`
const green  = (s) => `${c.green}${s}${c.reset}`
const yellow = (s) => `${c.yellow}${s}${c.reset}`
const red    = (s) => `${c.red}${s}${c.reset}`

// ── Tiny 1×1 transparent PNG (for key validation) ─────
const TINY_PNG = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='

// ── Framework detection ────────────────────────────────
function detectFramework(projectRoot) {
  const pkgPath = join(projectRoot, 'package.json')
  if (!existsSync(pkgPath)) return 'generic'
  try {
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'))
    const allDeps = { ...pkg.dependencies, ...pkg.devDependencies }
    if (allDeps['next'])          return 'next'
    if (allDeps['@remix-run/react'] || allDeps['@remix-run/node']) return 'remix'
    if (allDeps['react-scripts']) return 'cra'
    if (allDeps['vite'])          return 'vite'
    return 'generic'
  } catch {
    return 'generic'
  }
}

// ── .env file helpers ──────────────────────────────────
function envFileName(framework) {
  if (framework === 'next') return '.env.local'
  return '.env'
}

function envVarName(framework) {
  if (framework === 'next' || framework === 'remix') return 'NEXT_PUBLIC_DESIGN_QA_IMGBB_KEY'
  if (framework === 'vite') return 'VITE_DESIGN_QA_IMGBB_KEY'
  return 'DESIGN_QA_IMGBB_KEY'
}

function writeEnvKey(projectRoot, framework, apiKey) {
  const file = join(projectRoot, envFileName(framework))
  const varName = envVarName(framework)
  const line = `${varName}=${apiKey}`

  if (existsSync(file)) {
    const contents = readFileSync(file, 'utf8')
    // Replace existing value if already set
    if (contents.includes(`${varName}=`)) {
      const updated = contents.replace(new RegExp(`^${varName}=.*$`, 'm'), line)
      writeFileSync(file, updated, 'utf8')
      return { file, varName, existed: true }
    }
    // Append to end
    appendFileSync(file, `\n${line}\n`, 'utf8')
  } else {
    writeFileSync(file, `${line}\n`, 'utf8')
  }
  return { file, varName, existed: false }
}

// ── .gitignore helper ──────────────────────────────────
function ensureGitignore(projectRoot, framework) {
  const gitignore = join(projectRoot, '.gitignore')
  const envFile = envFileName(framework)
  if (existsSync(gitignore)) {
    const contents = readFileSync(gitignore, 'utf8')
    const lines = contents.split('\n').map(l => l.trim())
    if (lines.includes(envFile) || lines.includes(`/${envFile}`)) return false
    appendFileSync(gitignore, `\n# design-qa env\n${envFile}\n`, 'utf8')
    return true
  } else {
    writeFileSync(gitignore, `# design-qa env\n${envFile}\n`, 'utf8')
    return true
  }
}

// ── imgBB validation ───────────────────────────────────
async function validateImgbbKey(apiKey) {
  const body = new FormData()
  body.append('image', TINY_PNG)
  const res = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
    method: 'POST',
    body,
    signal: AbortSignal.timeout(8000),
  })
  const json = await res.json()
  if (!res.ok || !json.success) {
    const msg = json?.error?.message ?? `HTTP ${res.status}`
    throw new Error(msg)
  }
}

// ── Integration snippets ───────────────────────────────
function snippet(framework, varName) {
  const envAccess = {
    vite:    `import.meta.env.${varName}`,
    next:    `process.env.${varName}`,
    remix:   `process.env.${varName}`,
    cra:     `process.env.REACT_APP_DESIGN_QA_IMGBB_KEY`,
    generic: `process.env.${varName}`,
  }[framework]

  const base = [
    `import { DesignQA } from 'design-qa'`,
    `import 'design-qa/dist/style.css'`,
    ``,
    `// Inside your root component:`,
    `<DesignQA imgbbApiKey={${envAccess}} />`,
  ]

  if (framework === 'next') {
    return [
      `// In app/layout.tsx or pages/_app.tsx:`,
      `import dynamic from 'next/dynamic'`,
      `const DesignQA = dynamic(() => import('design-qa').then(m => m.DesignQA), { ssr: false })`,
      `import 'design-qa/dist/style.css'`,
      ``,
      `// Inside your root component:`,
      `<DesignQA imgbbApiKey={${envAccess}} />`,
    ]
  }

  return base
}

// ── Masked input (hides key while typing) ─────────────
function promptPassword(query) {
  return new Promise((resolve) => {
    stdout.write(query)
    stdin.setRawMode(true)
    stdin.resume()
    stdin.setEncoding('utf8')
    let key = ''
    const handler = (ch) => {
      if (ch === '\u0003') { // Ctrl-C
        stdout.write('\n')
        process.exit(0)
      } else if (ch === '\r' || ch === '\n') {
        stdin.setRawMode(false)
        stdin.pause()
        stdin.removeListener('data', handler)
        stdout.write('\n')
        resolve(key)
      } else if (ch === '\u007f' || ch === '\b') { // backspace
        if (key.length > 0) {
          key = key.slice(0, -1)
          stdout.write('\b \b')
        }
      } else {
        key += ch
        stdout.write('*')
      }
    }
    stdin.on('data', handler)
  })
}

// ── Main ───────────────────────────────────────────────
async function main() {
  const projectRoot = cwd()

  stdout.write('\n')
  stdout.write(`  ${bold('✦ Design QA')}  ${dim('— project setup')}\n`)
  stdout.write('\n')

  const framework = detectFramework(projectRoot)
  const frameworkLabel = { vite: 'Vite', next: 'Next.js', remix: 'Remix', cra: 'Create React App', generic: 'React' }[framework]
  stdout.write(`  ${dim('Detected:')} ${cyan(frameworkLabel)}\n`)
  stdout.write('\n')

  // ── Step 1: imgBB API key ──────────────────────────
  stdout.write(`  ${dim('Get a free key at')} ${blue('https://api.imgbb.com')}\n`)
  stdout.write(`  ${dim('(leave blank to skip image hosting — uses base64 instead)')}\n`)
  stdout.write('\n')

  let apiKey = ''
  try {
    apiKey = (await promptPassword(`  ${bold('imgBB API key:')} `)).trim()
  } catch {
    // stdin.setRawMode not available (e.g. piped input) — fall back to readline
    const rl = createInterface({ input: stdin, output: stdout })
    apiKey = (await rl.question(`  ${bold('imgBB API key:')} `)).trim()
    rl.close()
  }

  if (apiKey) {
    stdout.write(`  ${dim('Validating key…')}`)
    try {
      await validateImgbbKey(apiKey)
      stdout.write(`\r  ${green('✓')} Key validated                \n`)
    } catch (err) {
      stdout.write(`\r  ${yellow('⚠')} Validation failed: ${yellow(err.message)}\n`)
      stdout.write(`  ${dim('Key saved anyway — double-check it if uploads fail.')}\n`)
    }
    stdout.write('\n')

    // Write to .env
    const { file, varName } = writeEnvKey(projectRoot, framework, apiKey)
    const relFile = file.replace(projectRoot + '/', '')
    stdout.write(`  ${green('✓')} ${bold(varName)} written to ${cyan(relFile)}\n`)

    // Update .gitignore
    const added = ensureGitignore(projectRoot, framework)
    if (added) {
      stdout.write(`  ${green('✓')} ${cyan(envFileName(framework))} added to ${cyan('.gitignore')}\n`)
    } else {
      stdout.write(`  ${dim('✓')} ${cyan(envFileName(framework))} already in .gitignore\n`)
    }
  } else {
    stdout.write(`  ${dim('Skipped — screenshots will be embedded as base64.')}\n`)
  }

  // ── Step 2: Install snippet ────────────────────────
  stdout.write('\n')
  stdout.write(`  ${bold('Add to your app root:')}\n`)
  stdout.write('\n')

  const varName = envVarName(framework)
  const lines = snippet(framework, varName)
  for (const line of lines) {
    stdout.write(`  ${dim('│')} ${cyan(line)}\n`)
  }

  stdout.write('\n')
  stdout.write(`  ${bold(green('Done!'))} Press ${bold('Cmd+Shift+A')} (Mac) or ${bold('Ctrl+Shift+A')} (Win) to activate.\n`)
  stdout.write('\n')
}

main().catch((err) => {
  console.error(red(`\n  Error: ${err.message}\n`))
  process.exit(1)
})
