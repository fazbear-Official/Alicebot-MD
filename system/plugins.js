import { readdirSync, existsSync, statSync, readFileSync, watch, mkdirSync } from 'fs'
import { join } from 'path'
import syntaxerror from 'syntax-error'
import { format } from 'util'
import { freddyJadiBot } from '../plugins/sockets-serbot.js'
import chalk from 'chalk'
export async function filesInit(pluginFolder) {
  const pluginFilter = (f) => /\.js$/.test(f)
  global.plugins = {}

  for (const filename of readdirSync(pluginFolder).filter(pluginFilter)) {
    try {
      const file = global.__filename(join(pluginFolder, filename))
      const module = await import(file)
      global.plugins[filename] = module.default || module
    } catch (e) {
      conn.logger.error(e)
      delete global.plugins[filename]
    }
  }
}

export function setupPluginWatcher(pluginFolder) {
  const pluginFilter = (f) => /\.js$/.test(f)

  global.reload = async (_ev, filename) => {
    if (!pluginFilter(filename)) return
    const dir = global.__filename(join(pluginFolder, filename), true)

    if (filename in global.plugins) {
      if (existsSync(dir)) conn.logger.info(`updated plugin - '${filename}'`)
      else {
        conn.logger.warn(`deleted plugin - '${filename}'`)
        return delete global.plugins[filename]
      }
    } else {
      conn.logger.info(`new plugin - '${filename}'`)
    }

    const err = syntaxerror(readFileSync(dir), filename, {
      sourceType: 'module',
      allowAwaitOutsideFunction: true
    })

    if (err) {
      conn.logger.error(`syntax error in '${filename}'\n${format(err)}`)
    } else {
      try {
        const module = await import(`${global.__filename(dir)}?update=${Date.now()}`)
        global.plugins[filename] = module.default || module
      } catch (e) {
        conn.logger.error(`error in plugin '${filename}'\n${format(e)}`)
      } finally {
        global.plugins = Object.fromEntries(
          Object.entries(global.plugins).sort(([a], [b]) => a.localeCompare(b))
        )
      }
    }
  }

  Object.freeze(global.reload)
  watch(pluginFolder, global.reload)
}

export function setupSerbot(rutaJadiBot) {
  if (!global.freddyJadibts) return

  if (!existsSync(rutaJadiBot)) {
    mkdirSync(rutaJadiBot, { recursive: true })
    console.log(chalk.bold.cyan(`🩸┊The folder was created: ${global.jadi} 🐻`))
  } else {
    console.log(chalk.bold.cyan(`🩸┊The folder already exists: ${global.jadi} 🐻`))
  }

  const entries = readdirSync(rutaJadiBot)
  for (const gjbts of entries) {
    const botPath = join(rutaJadiBot, gjbts)
    if (existsSync(botPath) && statSync(botPath).isDirectory()) {
      if (readdirSync(botPath).includes('creds.json')) {
        freddyJadiBot({ pathfreddyJadiBot: botPath, m: null, conn, args: '', usedPrefix: '/', command: 'serbot' })
      }
    }
  }
}