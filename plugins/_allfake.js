import pkg from 'baileys-pro'
import fs from 'fs'
import fetch from 'node-fetch'
import axios from 'axios'
import moment from 'moment-timezone'
const { generateWAMessageFromContent, prepareWAMessageMedia, proto } = pkg
const icono = 'https://raw.githubusercontent.com/fazbear-Official/uploads/main/uploads/upload-1774396175445.jpg'

var handler = m => m
handler.all = async function (m, { conn }) { 

global.canalIdM    = [global.chanelId, global.chanelId]
global.canalNombreM = [global.chanename, global.chanename]
global.channelRD   = await getRandomChannel()

global.d = new Date(new Date + 3600000)
global.locale = 'ar'
global.dia = d.toLocaleDateString(locale, {weekday: 'long'})
global.fecha = d.toLocaleDateString('es', {day: 'numeric', month: 'numeric', year: 'numeric'})

global.mes_ar = d.toLocaleDateString('ar', { month: 'long' })
global.año_ar = d.toLocaleDateString('ar', { year: 'numeric' })
global.tiempo_ar = d.toLocaleString('ar', { hour: 'numeric', minute: 'numeric', second: 'numeric', hour12: true })

global.mes_en = d.toLocaleDateString('en', { month: 'long' })
global.año_en = d.toLocaleDateString('en', { year: 'numeric' })
global.tiempo_en = d.toLocaleString('en', { hour: 'numeric', minute: 'numeric', second: 'numeric', hour12: true })

var canal = 'https://whatsapp.com/channel/0029Vb7B41dLtOjBeD5Fwq2N'  
var comunidad = 'https://whatsapp.com/channel/0029Vb7B41dLtOjBeD5Fwq2N'
var correo = 'byzaryws@gmail.com'
global.redes = [canal, comunidad, correo].getRandom()

global.nombre = m.pushName || '𝐅υׁ𝐫𝐢𝐧𝐚 𝐁ׅ𝗼𝐭'
global.packsticker = `°.⎯⃘̶⎯̸⎯ܴ⎯̶᳞͇ࠝ⎯⃘̶⎯̸⎯ܴ⎯̶᳞͇ࠝ⎯⃘̶⎯̸.°\nᰔᩚ المستخدم: ${nombre}\n❀ البوت: ${botname}\n✦ التاريخ: ${fecha}\nⴵ الوقت: ${moment.tz('America/Caracas').format('HH:mm:ss')}`
global.packsticker2 = `\n°.⎯⃘̶⎯̸⎯ܴ⎯̶᳞͇ࠝ⎯⃘̶⎯̸⎯ܴ⎯̶᳞͇ࠝ⎯⃘̶⎯̸.°\n\n${dev}`

global.fkontak = { key: { participants:"0@s.whatsapp.net", "remoteJid": "status@broadcast", "fromMe": false, "id": "Halo" }, "message": { "contactMessage": { "vcard": `BEGIN:VCARD\nVERSION:3.0\nN:Sy;Bot;;;\nFN:y\nitem1.TEL;waid=${m.sender.split('@')[0]}:${m.sender.split('@')[0]}\nitem1.X-ABLabel:Ponsel\nEND:VCARD` }}, "participant": "0@s.whatsapp.net" }

global.rcanal = {
  contextInfo: {
    mentionedJid: null,
    isForwarded: true,
    forwardingScore: 1,
    forwardedNewsletterMessageInfo: {
      newsletterJid: channelRD.id,
      newsletterName: channelRD.name,
      serverMessageId: 100
    },
    externalAdReply: {
      title: botname,
      body: dev,
      mediaUrl: canal,
      description: null,
      previewType: "PHOTO",
      thumbnail: await (await fetch(icono)).buffer(),
      sourceUrl: redes,
      mediaType: 2,
      renderLargerThumbnail: false
    }
  }
}

const _origSendMessage = conn.sendMessage.bind(conn)
conn.sendMessage = async (jid, content, options = {}) => {
  if (content?.text && typeof content.text === 'string') {
    try {
      if (global.channelRD?.id) {
        content.contextInfo = {
          ...(content.contextInfo || {}),
          isForwarded: true,
          forwardingScore: 1,
          forwardedNewsletterMessageInfo: {
            newsletterJid: global.channelRD.id,
            newsletterName: global.channelRD.name,
            serverMessageId: 100
          },
          externalAdReply: {
            title: global.botname,
            body: global.dev,
            mediaUrl: canal,
            description: null,
            previewType: "PHOTO",
            thumbnail: await (await fetch(icono)).buffer(),
            sourceUrl: global.redes,
            mediaType: 2,
            renderLargerThumbnail: false
          }
        }
      }
    } catch {}
  }
  return _origSendMessage(jid, content, options)
}

}

export default handler

function pickRandom(list) {
  return list[Math.floor(Math.random() * list.length)]
}

async function getRandomChannel() {
  let randomIndex = Math.floor(Math.random() * canalIdM.length)
  let id = canalIdM[randomIndex]
  let name = canalNombreM[randomIndex]
  return { id, name }
}