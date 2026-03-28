import { makeWASocket } from '../lib/simple.js'
import { jidNormalizedUser, DisconnectReason, useMultiFileAuthState, fetchLatestBaileysVersion, makeCacheableSignalKeyStore } from 'baileys-pro'
import { Boom } from '@hapi/boom'
import pino from 'pino'
import Pino from 'pino'
import NodeCache from 'node-cache'
import chalk from 'chalk'
import * as ws from 'ws'
import store from '../lib/store.js'

export async function createConnectionOptions() {
  const { state, saveCreds } = await useMultiFileAuthState(global.sessions)
  const msgRetryCounterCache = new NodeCache({ stdTTL: 0, checkperiod: 0 })
  const msgRetryCounterMap = new Map()
  const { version } = await fetchLatestBaileysVersion()

  const connectionOptions = {
    logger: pino({ level: 'silent' }),
    printQRInTerminal: global.opcion == '1' || global.methodCodeQR,
    mobile: global.MethodMobile,
    browser: (global.opcion == '1' || global.methodCodeQR)
      ? [`${global.nameqr}`, 'Edge', '20.0.04']
      : ['Ubuntu', 'Edge', '110.0.1587.56'],
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, Pino({ level: 'fatal' }).child({ level: 'fatal' }))
    },
    markOnlineOnConnect: true,
    generateHighQualityLinkPreview: true,
    getMessage: async (clave) => {
      const jid = jidNormalizedUser(clave.remoteJid)
      const msg = await store.loadMessage(jid, clave.id)
      return msg?.message || ''
    },
    msgRetryCounterCache,
    msgRetryCounterMap,
    defaultQueryTimeoutMs: undefined,
    version
  }

  return { connectionOptions, saveCreds }
}

export async function connectionUpdate(update) {
  const { connection, lastDisconnect, isNewLogin } = update
  global.stopped = connection
  if (isNewLogin) conn.isInit = true

  const code = lastDisconnect?.error?.output?.statusCode
    || lastDisconnect?.error?.output?.payload?.statusCode

  if (code && code !== DisconnectReason.loggedOut && conn?.ws.socket == null) {
    await global.reloadHandler(true).catch(console.error)
    global.timestamp.connect = new Date()
  }

  if (global.db.data == null) global.loadDatabase()

  if ((update.qr != 0 && update.qr != undefined) || global.methodCodeQR) {
    if (global.opcion == '1' || global.methodCodeQR) {
      console.log(chalk.green.bold(`[ 🩸 ]  Please scan this QR code`))
    }
  }

  if (connection === 'open') {
    const userName = conn.user.name || conn.user.verifiedName || 'UNKNOWN'
    await joinChannels(conn)
    console.log(chalk.green.bold(`[ ♣ ]: ${userName} is Connected`))
  }

  if (connection === 'close') {
    const reason = new Boom(lastDisconnect?.error)?.output?.statusCode
    if ([401, 440, 428, 405].includes(reason)) {
      console.log(chalk.red(`→ (${reason}) › Close the Main Session`))
    }
    console.log(chalk.yellow('→ Reconnecting the Main Bot'))
    await global.reloadHandler(true).catch(console.error)
  }
}

export async function setupReloadHandler(connectionOptions, saveCreds) {
  let isInit = true
  let handler = await import('../handler.js')

  global.reloadHandler = async function (restatConn) {
    try {
      const Handler = await import(`../handler.js?update=${Date.now()}`).catch(console.error)
      if (Object.keys(Handler || {}).length) handler = Handler
    } catch (e) {
      console.error(e)
    }

    if (restatConn) {
      const oldChats = global.conn.chats
      try { global.conn.ws.close() } catch {}
      conn.ev.removeAllListeners()
      global.conn = makeWASocket(connectionOptions, { chats: oldChats })
      isInit = true
    }

    if (!isInit) {
      conn.ev.off('messages.upsert', conn.handler)
      conn.ev.off('connection.update', conn.connectionUpdate)
      conn.ev.off('creds.update', conn.credsUpdate)
    }

    conn.handler = handler.handler.bind(global.conn)
    conn.connectionUpdate = connectionUpdate.bind(global.conn)
    conn.credsUpdate = saveCreds.bind(global.conn, true)

    conn.ev.on('messages.upsert', conn.handler)
    conn.ev.on('connection.update', conn.connectionUpdate)
    conn.ev.on('creds.update', conn.credsUpdate)
    isInit = false
    return true
  }
}

async function joinChannels(sock) {
  for (const value of Object.values(global.ch)) {
    if (typeof value === 'string' && value.endsWith('@newsletter')) {
      await sock.newsletterFollow(value).catch(() => {})
    }
  }
}