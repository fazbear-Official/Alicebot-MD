
process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '1'
import './system/abyss-system.js'
import './plugins/_allfake.js'
import cfonts from 'cfonts'
import { createRequire } from 'module'
import { fileURLToPath, pathToFileURL } from 'url'
import { platform } from 'process'
import fs, { readdirSync, unlinkSync, existsSync, mkdirSync } from 'fs'
import yargs from 'yargs'
import chalk from 'chalk'
import path, { join, dirname } from 'path'
import { makeWASocket, protoType, serialize } from './lib/simple.js'
import { Low, JSONFile } from 'lowdb'
import lodash from 'lodash'
const { chain } = lodash
import readline from 'readline'
import pkg from 'google-libphonenumber'
import { createConnectionOptions, connectionUpdate, setupReloadHandler } from './system/connection.js'
import { filesInit, setupPluginWatcher, setupSerbot } from './system/plugins.js'
import { startTracker } from './system/tracker.js' 
const { PhoneNumberUtil } = pkg
const phoneUtil = PhoneNumberUtil.getInstance()
const PORT = process.env.PORT || process.env.SERVER_PORT || 3000

// ── Splash ──
console.log(chalk.magentaBright('\nLOADING........'))
cfonts.say('ABYSS BOT', { font: 'simple', align: 'left', gradient: ['green', 'white'] })
cfonts.say('Made with by radio', { font: 'console', align: 'center', colors: ['cyan', 'magenta', 'yellow'] })
protoType()
serialize()

// ── Globals ──
global.__filename = (pathURL = import.meta.url, rmPrefix = platform !== 'win32') =>
  rmPrefix ? /file:\/\/\//.test(pathURL) ? fileURLToPath(pathURL) : pathURL : pathToFileURL(pathURL).toString()
global.__dirname = (pathURL) => path.dirname(global.__filename(pathURL, true))
global.__require = (dir = import.meta.url) => createRequire(dir)
global.timestamp = { start: new Date() }
const __dirname = global.__dirname(import.meta.url)
const dbFolder = path.join(__dirname, './database')
const dbPath = path.join(dbFolder, 'database.json')
if (!fs.existsSync(dbFolder)) {
  fs.mkdirSync(dbFolder, { recursive: true })
}

if (!fs.existsSync(dbPath)) {
  fs.writeFileSync(dbPath, JSON.stringify({ users: {}, chats: {}, settings: {} }, null, 2))
}

global.opts = new Object(yargs(process.argv.slice(2)).exitProcess(false).parse())
global.prefix = new RegExp('^[#!./-]')


global.db = new Low(new JSONFile(dbPath))
global.DATABASE = global.db

global.loadDatabase = async function () {
  if (global.db.READ) {
    return new Promise(resolve => setInterval(async function () {
      if (!global.db.READ) {
        clearInterval(this)
        resolve(global.db.data ?? global.loadDatabase())
      }
    }, 1000))
  }

  if (global.db.data !== null) return

  global.db.READ = true
  await global.db.read().catch(console.error)
  global.db.READ = null

  global.db.data = {
    users: {},
    chats: {},
    settings: {},
    ...(global.db.data || {})
  }

  global.db.chain = chain(global.db.data)
}
global.loadDatabase()
if (!global.db.data) await global.loadDatabase()
// ── Auth & Login ──
const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
const question = (text) => new Promise(res => rl.question(text, res))
const methodCodeQR = process.argv.includes('qr')
const methodCode = !!global.botNumber || process.argv.includes('code')
global.methodCodeQR = methodCodeQR
global.MethodMobile = process.argv.includes('mobile')

let opcion
if (methodCodeQR) {
  opcion = '1'
} else if (!methodCode && !fs.existsSync(`./${global.sessions}/creds.json`)) {
  do {
    opcion = await question(
      chalk.bold.white('Choose an option:\n') +
      chalk.blueBright('1. Using QR Code\n') +
      chalk.cyan('2. Using 8-digit text code\n--> ')
    )
    if (!/^[1-2]$/.test(opcion))
      console.log(chalk.bold.redBright('Only numbers 1 or 2 are allowed.'))
  } while (opcion !== '1' && opcion !== '2')
}
global.opcion = opcion
console.info = () => {}

// ── Connection ──
const { connectionOptions, saveCreds } = await createConnectionOptions()
global.conn = makeWASocket(connectionOptions)
conn.ev.on('creds.update', saveCreds)
conn.isInit = false
conn.well = false
conn.logger.info('DONE ✅\n')
conn.ev.on('connection.update', async ({ connection }) => {
  if (connection === 'open') {
    await startTracker(conn)
  }
})
// ── Pairing Code ──
if (!fs.existsSync(`./${global.sessions}/creds.json`) && (opcion === '2' || methodCode)) {
  if (!conn.authState.creds.registered) {
    let phoneNumber = global.botNumber?.replace(/[^0-9]/g, '')
    if (!phoneNumber) {
      do {
        phoneNumber = await question(chalk.bgBlack(chalk.bold.greenBright(`Enter WhatsApp number:\n${chalk.bold.magentaBright('---> ')}`)))
        phoneNumber = phoneNumber.replace(/\D/g, '')
        if (!phoneNumber.startsWith('+')) phoneNumber = `+${phoneNumber}`
      } while (!await isValidPhoneNumber(phoneNumber))
      rl.close()
      phoneNumber = phoneNumber.replace(/\D/g, '')
    }
    setTimeout(async () => {
      let code = await conn.requestPairingCode(phoneNumber)
      code = code.match(/.{1,4}/g)?.join('-') || code
      console.log(chalk.bgMagenta(chalk.bold.white('CODE:')), chalk.bold.white(code))
    }, 3000)
  }
}

// ── DB Auto-Save ──
if (!global.opts['test'] && global.db) {
  setInterval(async () => {
    if (global.db.data && !global.db.READ) await global.db.write()
  }, 30 * 1000)
}

// ── Reload Handler ──
await setupReloadHandler(connectionOptions, saveCreds)
await global.reloadHandler()

// ── Plugins ──
const pluginFolder = global.__dirname(join(__dirname, './plugins/index'))
await filesInit(pluginFolder).then(() => Object.keys(global.plugins)).catch(console.error)
setupPluginWatcher(pluginFolder)

// ── Serbot ──
global.rutaJadiBot = join(__dirname, `./${global.jadi}`)
setupSerbot(global.rutaJadiBot)

// ── Quick Test ──
async function _quickTest() {
  const { spawn } = await import('child_process')
  const tests = await Promise.all([
    'ffmpeg', 'ffprobe', 'convert', 'magick', 'gm'
  ].map(cmd => new Promise(res => {
    const p = spawn(cmd)
    p.on('close', code => res(code !== 127))
    p.on('error', () => res(false))
  })))
  const [ffmpeg, ffprobe, convert, magick, gm] = tests
  global.support = Object.freeze({ ffmpeg, ffprobe, convert, magick, gm })
}
_quickTest().catch(console.error)

// ── TMP Cleaner ──
setInterval(async () => {
  const tmpDir = join(__dirname, 'tmp')
  try {
    readdirSync(tmpDir).forEach(f => unlinkSync(join(tmpDir, f)))
    console.log(chalk.gray('→ TMP folder cleared 🐻'))
  } catch {
    console.log(chalk.gray('→ Could not clear TMP folder 🐻'))
  }
}, 30 * 1000)

// ── Helpers ──
async function isValidPhoneNumber(number) {
  try {
    number = number.replace(/\s+/g, '').replace(/^\+521/, '+52')
    const parsed = phoneUtil.parseAndKeepRawInput(number)
    return phoneUtil.isValidNumber(parsed)
  } catch { return false }
}

process.on('uncaughtException', console.error)
process.on('unhandledRejection', (reason) => {
  console.error('⚠️ Unhandled rejection • Fazbear Alert 🐻', reason)
})