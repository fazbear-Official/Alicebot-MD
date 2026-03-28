import { watchFile, unwatchFile } from "fs"
import chalk from "chalk"
import { fileURLToPath } from "url"
import fs from "fs"
import fetch from "node-fetch"
import { watchFile, unwatchFile } from "fs"
import chalk from "chalk"
import { fileURLToPath } from "url"
import fs from "fs"
import fetch from "node-fetch"

// ─────────────────────────────
const API_URL = "https://alice-bot-one.vercel.app/api/v3/config"
const STATIC_OWNER = "010xxxxxxxxx@s.whatsapp.net" // ← حط رقمك هنا
//════════════════════════════════════════════════
async function loadConfig() {
  try {
    console.log(chalk.cyan("[System] loading config..."))
    const response = await fetch(API_URL)
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
