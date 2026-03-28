import { smsg } from "./lib/simple.js"
import { fileURLToPath } from "url"
import path, { join } from "path"
import { unwatchFile, watchFile } from "fs"
import chalk from "chalk"
import ws from "ws"
import { ensureData } from "./system/db.js"
import { antiSpam } from "./system/antiSpam.js"

const { proto } = (await import("baileys-pro")).default
const isNumber = x => typeof x === "number" && !isNaN(x)
const delay = ms => isNumber(ms) && new Promise(resolve => setTimeout(function() { clearTimeout(this); resolve() }, ms))
const strRegex = str => str.replace(/[|\\{}()[\]^$+*?.]/g, "\\$&")

export async function handler(chatUpdate) {
  this.msgqueque = this.msgqueque || []
  this.uptime = this.uptime || Date.now()
  if (!chatUpdate) return

  this.pushMessage(chatUpdate.messages).catch(console.error)
  let m = chatUpdate.messages[chatUpdate.messages.length - 1]
  if (!m) return

  if (global.db.data == null) await global.loadDatabase()

  try {
    m = smsg(this, m) || m
    if (!m) return
    m.exp = 0

    try { await ensureData(m, this) } catch (e) { console.error(e) }

    if (typeof m.text !== "string") m.text = ""

    const user = global.db.data.users[m.sender]

    try {
      const actual = user.name || ""
      const nuevo = m.pushName || await this.getName(m.sender)
      if (typeof nuevo === "string" && nuevo.trim() && nuevo !== actual) user.name = nuevo
    } catch {}

    const chat = global.db.data.chats[m.chat]
    const settings = global.db.data.settings[this.user.jid]

    const ownerJids = global.owner.map(n => n.replace(/[^0-9]/g, "") + "@s.whatsapp.net")
    const isROwner = ownerJids.includes(m.sender)
    const isOwner = isROwner
    const isOwners = isROwner
    const isPrems = isROwner || global.prems.map(v => v.replace(/[^0-9]/g, "") + "@s.whatsapp.net").includes(m.sender) || user.premium == true

    if (opts["queque"] && m.text && !isPrems) {
      const queque = this.msgqueque, time = 1000 * 5
      const previousID = queque[queque.length - 1]
      queque.push(m.id || m.key.id)
      // ✅ fix setInterval
      const interval = setInterval(() => {
        if (!queque.includes(previousID)) clearInterval(interval)
      }, time)
    }
    if (m.isBaileys) return
    m.exp += Math.ceil(Math.random() * 10)
    const rawMeta = m.isGroup ? (conn.chats[m.chat]?.metadata || await this.groupMetadata(m.chat).catch(_ => null) || {}) : {}
    const groupMetadata = m.isGroup ? {
      ...rawMeta,
      participants: (rawMeta.participants || []).map(p => ({ ...p, id: p.jid, jid: p.jid, lid: p.lid }))
    } : {}
    const participants = (m.isGroup ? groupMetadata.participants : []).map(p => ({
      id: p.jid, jid: p.jid, lid: p.lid, admin: p.admin
    }))
    const userGroup = (m.isGroup ? participants.find(u => conn.decodeJid(u.jid) === m.sender) : {}) || {}
    const botGroup  = (m.isGroup ? participants.find(u => conn.decodeJid(u.jid) === this.user.jid) : {}) || {}
    const isRAdmin   = userGroup?.admin === "superadmin"
    const isAdmin    = isRAdmin || userGroup?.admin === "admin"
    const isBotAdmin = !!botGroup?.admin

    const ___dirname = path.join(path.dirname(fileURLToPath(import.meta.url)), "./plugins")

    const globalPrefix = conn.prefix || global.prefix

    for (const name in global.plugins) {
      const plugin = global.plugins[name]
      if (!plugin || plugin.disabled) continue

      const __filename = join(___dirname, name)

      if (typeof plugin.all === "function") {
        try {
          await plugin.all.call(this, m, { chatUpdate, __dirname: ___dirname, __filename, user, chat, settings })
        } catch (err) { console.error(err) }
      }
     await antiSpam(this, m)
      if (!opts["restrict"] && plugin.tags?.includes("admin")) continue

      const pluginPrefix = plugin.customPrefix || globalPrefix
      const match = (
        pluginPrefix instanceof RegExp ? [[pluginPrefix.exec(m.text), pluginPrefix]] :
        Array.isArray(pluginPrefix) ? pluginPrefix.map(p => { const r = p instanceof RegExp ? p : new RegExp(strRegex(p)); return [r.exec(m.text), r] }) :
        typeof pluginPrefix === "string" ? [[new RegExp(strRegex(pluginPrefix)).exec(m.text), new RegExp(strRegex(pluginPrefix))]] :
        [[[], new RegExp]]
      ).find(p => p[1])

      const extra = { match, conn: this, participants, groupMetadata, userGroup, botGroup, isROwner, isOwner, isRAdmin, isAdmin, isBotAdmin, isPrems, chatUpdate, __dirname: ___dirname, __filename, user, chat, settings }

      if (typeof plugin.before === "function") {
        if (await plugin.before.call(this, m, extra)) continue
      }

      if (typeof plugin !== "function") continue

      let usedPrefix
      if (!(usedPrefix = (match[0] || "")[0])) continue

      const noPrefix = m.text.replace(usedPrefix, "")
      let [command, ...args] = noPrefix.trim().split(" ").filter(Boolean)
      args = args || []
      const _args = noPrefix.trim().split(" ").slice(1)
      const text = _args.join(" ")
      command = (command || "").toLowerCase()

      const fail = plugin.fail || global.dfail
      const isAccept = plugin.command instanceof RegExp ? plugin.command.test(command) :
        Array.isArray(plugin.command) ? plugin.command.some(cmd => cmd instanceof RegExp ? cmd.test(command) : cmd === command) :
        typeof plugin.command === "string" ? plugin.command === command : false

      global.comando = command

      if (!isOwners && settings.self) return
      if (m.id.startsWith("NJX-") || (m.id.startsWith("BAE5") && m.id.length === 16) || (m.id.startsWith("B24E") && m.id.length === 20)) return

      if (chat.primaryBot && chat.primaryBot !== this.user.jid) {
        const pbConn = global.conns.find(c => c.user.jid === chat.primaryBot && c.ws.socket?.readyState !== ws.CLOSED)
        const pbParticipants = m.isGroup ? (await this.groupMetadata(m.chat).catch(() => ({ participants: [] }))).participants : []
        const pbInGroup = pbParticipants.some(p => p.jid === chat.primaryBot)
        if (pbConn && pbInGroup || chat.primaryBot === global.conn.user.jid) throw false
        else chat.primaryBot = null
      }

      if (!isAccept) continue
      m.plugin = name
      user.commands++

      if (chat) {
        const botId = this.user.jid
        const primaryBotId = chat.primaryBot
        if (name !== "group-banchat.js" && chat.isBanned && !isROwner) {
          if (!primaryBotId || primaryBotId === botId) {
            await m.reply(`*╮═≼『🎩┃تنبيه بوت┃🎩』≽═╭*\n*┇⌗╎ꕥ البوت *${botname}* معطل في هذه المجموعة ⌗* ¦\n*╯✯≼══━━﹂🎩﹁━━══≽✯*\n*╮═≼『🎩┃التـفـاصـيـل┃🎩』≽═╭*\n> *✦ يمكن لمشرف تفعيل البوت باستخدام الأمر:*\n> » *${usedPrefix}bot on*\n*╯✯≼══━━﹂🎩﹁━━══≽✯*\n〔 🎭 Freddy Fazbear 〕`.trim())
            return
          }
        }
        if (m.text && user.banned && !isROwner) {
          if (!primaryBotId || primaryBotId === botId) {
            m.reply(`*╮═≼『🎩┃تـنـبـيه بوت┃🎩』≽═╭*\n*┇⌗╎ꕥ تم حظرك، لا يمكنك استخدام الأوامر في هذا البوت! ⌗* ¦\n*╯✯≼══━━﹂🎩﹁━━══≽✯*\n*╮═≼『🎩┃التـفـاصـيـل┃🎩』≽═╭*\n> *● السبب ›* ${user.bannedReason}\n*╯✯≼══━━﹂🎩﹁━━══≽✯*\n〔 🎭 Freddy Fazbear 〕`.trim())
            return
          }
        }
      }

      if (!isOwners && !m.chat.endsWith("g.us") && !/code|p|ping|qr|estado|status|infobot|botinfo|report|reportar|invite|join|logout|suggest|help|menu/gim.test(m.text)) return

      const adminMode = chat.modoadmin || false
      const wa = plugin.botAdmin || plugin.admin || plugin.group || plugin || noPrefix || pluginPrefix || m.text[0] === pluginPrefix || plugin.command
      if (adminMode && !isOwner && m.isGroup && !isAdmin && wa) return

      if (plugin.rowner && plugin.owner && !(isROwner || isOwner)) { fail("owner", m, this); continue }
      if (plugin.rowner && !isROwner) { fail("rowner", m, this); continue }
      if (plugin.owner && !isOwner) { fail("owner", m, this); continue }
      if (plugin.premium && !isPrems) { fail("premium", m, this); continue }
      if (plugin.group && !m.isGroup) { fail("group", m, this); continue }
      else if (plugin.botAdmin && !isBotAdmin) { fail("botAdmin", m, this); continue }
      else if (plugin.admin && !isAdmin) { fail("admin", m, this); continue }
      if (plugin.private && m.isGroup) { fail("private", m, this); continue }

      m.isCommand = true
      m.exp += plugin.exp ? parseInt(plugin.exp) : 10

      const fullExtra = { ...extra, usedPrefix, noPrefix, _args, args, command, text }

      try {
        await plugin.call(this, m, fullExtra)
      } catch (err) {
        m.error = err
        console.error(err)
      } finally {
        if (typeof plugin.after === "function") {
          try { await plugin.after.call(this, m, fullExtra) } catch (err) { console.error(err) }
        }
      }
    }

  } catch (err) {
    console.error(err)
  } finally {
    if (opts["queque"] && m.text) {
      const idx = this.msgqueque.indexOf(m.id || m.key.id)
      if (idx !== -1) this.msgqueque.splice(idx, 1)
    }
    if (m?.sender) {
      const u = global.db.data.users[m.sender]
      if (u) u.exp += m.exp
    }
    try {
      if (!opts["noprint"]) await (await import("./lib/print.js")).default(m, this)
    } catch (err) {
      console.warn(err)
      console.log(m.message)
    }
  }
}

global.dfail = (type, m, conn) => {
  const decoTop = `︵ֵ۪۪۪۪𑁀⏜͜⌒᳝︵໋۪۪۪۪۪᳝֔࣪┄꯭๋━┄꫶︦⡳۪۪۪۪۟︵໋۪۪۪۪۪᳝֔࣪⌒᳝ᦷ࣭࣪🕷ּ۪᪲۫ᮬ ࣭࣪ᦡ ۪ׄ⌒᳝︵︵۪۪۪۪`
  const decoBottom = `ꤦꤦ꤫˳ꤦꤦ꤫  .  ˚ ᮫ ᮫ ˳⏝ ⌢᜔⃨̈፝ ᷼ ꤫ꤦᐧฺ᩿۟ ⏝⁀ᩴ᜔᷼✦᪲✿᭼꤫ꤦꥇꥈ⬚ꤦ꤫ꥈ᭼꤫ꤦꥈ✿✦᪲⁀᮫᜔۪᷼`
  const msg = {
    rowner:   `${decoTop}\n> ⃝⃘︢︣֟፝🕷 : *هذا الأمر خاص بمالك ABYSS فقط*\n${decoBottom}`,
    owner:    `${decoTop}\n> ⃝⃘︢︣֟፝👑 : *هذا الأمر خاص بمطوري ABYSS*\n${decoBottom}`,
    mods:     `${decoTop}\n> ⃝⃘︢︣֟፝🛡 : *هذا الأمر خاص بمشرفي ABYSS*\n${decoBottom}`,
    premium:  `${decoTop}\n> ⃝⃘︢︣֟፝💎 : *هذا الأمر للمستخدمين المميزين في ABYSS*\n${decoBottom}`,
    group:    `${decoTop}\n> ⃝⃘︢︣֟፝👥 : *يمكن استخدام هذا الأمر داخل المجموعات فقط*\n${decoBottom}`,
    private:  `${decoTop}\n> ⃝⃘︢︣֟፝📩 : *يمكن استخدام هذا الأمر في الخاص فقط*\n${decoBottom}`,
    admin:    `${decoTop}\n> ⃝⃘︢︣֟፝⚙️ : *هذا الأمر مخصص لمشرفي المجموعة*\n${decoBottom}`,
    botAdmin: `${decoTop}\n> ⃝⃘︢︣֟፝🤖 : *يجب أن يكون البوت مشرفًا لتنفيذ هذا الأمر*\n${decoBottom}`,
    restrict: `${decoTop}\n> ⃝⃘︢︣֟፝🚫 : *هذه الخاصية معطلة حاليًا في البوت*\n${decoBottom}`
  }[type]
  if (msg) return conn.reply(m.chat, msg, m, rcanal).then(_ => m.react('✖️'))
}

let file = global.__filename(import.meta.url, true)
watchFile(file, async () => {
  unwatchFile(file)
  console.log(chalk.magenta("Updated 'handler.js'"))
  if (global.reloadHandler) console.log(await global.reloadHandler())
})