function isSubBot(sender) {
  if (!global.conns || !Array.isArray(global.conns)) return false
  return global.conns.some(c => c?.user?.jid && c.user.jid === sender)
}


export async function antiSpam(conn, m) {
  if (!m.isGroup) return

  if (isSubBot(m.sender)) return

  const ownerJids = (global.owner || []).map(n => n.replace(/[^0-9]/g, "") + "@s.whatsapp.net")
  if (ownerJids.includes(m.sender)) return

  const msg = m.message || {}

  const hasExternalAd = !!(
    msg.extendedTextMessage?.contextInfo?.externalAdReply ||
    msg.imageMessage?.contextInfo?.externalAdReply        ||
    msg.videoMessage?.contextInfo?.externalAdReply        ||
    msg.documentMessage?.contextInfo?.externalAdReply     ||
    msg.audioMessage?.contextInfo?.externalAdReply        ||
    msg.stickerMessage?.contextInfo?.externalAdReply
  )

  const hasButtons = !!(
    msg.buttonsMessage             ||
    msg.templateMessage            ||
    msg.interactiveMessage         ||
    msg.listMessage                ||
    msg.buttonsResponseMessage     ||
    msg.templateButtonReplyMessage ||
    msg.interactiveResponseMessage
  )
  const contextInfo =
    msg.extendedTextMessage?.contextInfo ||
    msg.imageMessage?.contextInfo        ||
    msg.videoMessage?.contextInfo        ||
    msg.documentMessage?.contextInfo     ||
    msg.audioMessage?.contextInfo        ||
    msg.stickerMessage?.contextInfo      ||
    {}

  const isForwarded = !!(contextInfo.isForwarded || contextInfo.forwardingScore > 0)
  if (!hasExternalAd && !hasButtons && !isForwarded) return

  let reason = []
  if (hasExternalAd) reason.push("إعلان خارجي (externalAdReply)")
  if (hasButtons)    reason.push("رسالة تحتوي على أزرار")
  if (isForwarded)   reason.push("رسالة محوّلة (forwarded)")

  try {

    await conn.sendMessage(m.chat, { delete: m.key })

    await conn.groupParticipantsUpdate(m.chat, [m.sender], "remove")

    await conn.sendMessage(m.chat, {
      text: `*╮═≼『🎩┃تنبيه أمان┃🎩』≽═╭*\n` +
            `> 🚫 تم طرد @${m.sender.split("@")[0]}\n` +
            `> 📌 السبب: ${reason.join(" | ")}\n` +
            `*╯✯≼══━━﹂🎩﹁━━══≽✯*\n𝐑𝐀𝐃𝐈𝐎 𝐃𝐄𝐌𝐎𝐍`,
      mentions: [m.sender]
    })
  } catch (err) {
    console.error("[antiSpam] فشل الطرد:", err)
  }
}
