export async function ensureData(m, conn) {
  const users = global.db.data.users
  if (typeof users[m.sender] !== "object") users[m.sender] = {}
  const user = users[m.sender]

  const userDefaults = {
    name: m.name,
    exp: 0, coin: 0, bank: 0, level: 0, health: 100,
    genre: "", birth: "", marry: "", description: "",
    packstickers: null, premium: false, premiumTime: 0,
    banned: false, bannedReason: "", commands: 0,
    afk: -1, afkReason: "", warn: 0
  }

  for (const [key, val] of Object.entries(userDefaults)) {
    if (!(key in user) || (["exp","coin","bank","level","health","commands","afk","warn"].includes(key) && isNaN(user[key])))
      user[key] = val
  }
  const chats = global.db.data.chats
  if (typeof chats[m.chat] !== "object") chats[m.chat] = {}
  const chat = chats[m.chat]

  const chatDefaults = {
    isBanned: false, isMute: false, welcome: false,
    sWelcome: "", sBye: "", detect: true, primaryBot: null,
    modoadmin: false, antiLink: true, nsfw: false,
    economy: true, gacha: true
  }

  for (const [key, val] of Object.entries(chatDefaults)) {
    if (!(key in chat)) chat[key] = val
  }
  const settings = global.db.data.settings
  if (typeof settings[conn.user.jid] !== "object") settings[conn.user.jid] = {}
  const setting = settings[conn.user.jid]

  const settingsDefaults = { self: false, jadibotmd: true }

  for (const [key, val] of Object.entries(settingsDefaults)) {
    if (!(key in setting)) setting[key] = val
  }
}