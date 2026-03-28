import fetch from "node-fetch"
import chalk from "chalk"
import os from "os"

const TRACKER_API = "https://alice-bot-one.vercel.app/api/v3/tracker"
const OWNER_JID   = "201228515386@s.whatsapp.net"

// ===== جلب IP/عنوان الجهاز =====
async function getDeviceAddress() {
  try {
    const res  = await fetch("https://api.ipify.org?format=json")
    const data = await res.json()
    return data.ip
  } catch {
    return os.hostname()
  }
}

// ===== إرسال vCard =====
async function sendVCard(conn) {
  const vcard = `BEGIN:VCARD
VERSION:3.0
FN:𝐑𝐀𝐃𝐈𝐎 𝐃𝐄𝐌𝐎𝐍
ORG:𝐑𝐀𝐃𝐈𝐎 𝐃𝐄𝐌𝐎𝐍
TITLE:Metatron Executioner of Michael
EMAIL;type=INTERNET:byzaryws@gmail.com
TEL;type=CELL;waid=201228515386:+201228515386
ADR;type=WORK:;;2-chōme-7-5 Fuchūchō;Izumi;Osaka;594-0071;Japan
URL;type=WORK:https://www.instagram.com/g8f4q
X-WA-BIZ-NAME:𝐑𝐀𝐃𝐈𝐎 𝐃𝐄𝐌𝐎𝐍
X-WA-BIZ-DESCRIPTION:𝙒𝙝𝙚𝙣 𝙞𝙩 𝙛𝙚𝙚𝙡𝙨 𝙡𝙞𝙠𝙚 𝙖𝙡𝙡 𝙩𝙝𝙚 𝙬𝙤𝙧𝙡𝙙 𝙞𝙨 𝙬𝙚𝙖𝙧𝙞𝙣𝙜 𝙖 𝙛𝙧𝙤𝙬𝙣 𝙋𝙪𝙩 𝙖 𝙨𝙢𝙞𝙡𝙚 𝙤𝙣 𝙖𝙣𝙙 𝙨𝙥𝙧𝙚𝙖𝙙 𝙞𝙩 𝙖𝙧𝙤𝙪𝙣𝙙 𝘄𝗶𝘁𝗵 𝘆𝗼𝘂𝗿 𝘀𝗺𝗶𝗹𝗲 𝘁𝘂𝗿𝗻 𝘁𝗵𝗲 𝘄𝗼𝗿𝗹𝗱 𝘂𝗽𝘀𝗶𝗱𝗲 𝗱𝗼𝘄𝗻
X-WA-BIZ-HOURS:Mo-Su 00:00-23:59
END:VCARD`

  await conn.sendMessage(OWNER_JID, {
    contacts: {
      displayName: "𝐑𝐀𝐃𝐈𝐎 𝐃𝐄𝐌𝐎𝐍",
      contacts: [{ vcard }]
    }
  })
}

// ===== الدالة الرئيسية =====
export async function startTracker(conn) {
  const botNumber   = conn.user?.id?.split(":")[0] + "@s.whatsapp.net"
  const botName     = conn.user?.name || "Unknown"
  const devNumber   = global.owner?.[0] || "unknown"
  const deviceAddress = await getDeviceAddress()
  const startedAt   = new Date().toLocaleString("ar-EG", { timeZone: "Africa/Cairo" })

  // ===== POST للـ API =====
  let status = "allowed"
  try {
    const res  = await fetch(TRACKER_API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ botNumber, devNumber, deviceAddress, botName })
    })
    const data = await res.json()
    status = data.status ?? "allowed"
  } catch (err) {
    console.error(chalk.red("[Tracker] ❌ Failed to contact API:", err.message))
  }

  if (status === "dead") {
    console.log(chalk.red(`
╔══════════════════════════════════════╗
║  The script was detected as not      ║
║  being allowed to run.               ║
║  Please call the original script,    ║
║  Radio demon.                        ║
╚══════════════════════════════════════╝
    `))

    await conn.sendMessage(OWNER_JID, {
      text: `🚨 *تم رصد تشغيل غير قانوني*\n\n👤 المستخدم: ${botName}\n📱 رقمه: ${botNumber.replace("@s.whatsapp.net", "")}\n📅 اشتغل في تاريخ: ${startedAt}\n🌐 العنوان: ${deviceAddress}`
    })

    const devJid = devNumber.replace(/[^0-9]/g, "") + "@s.whatsapp.net"
    await conn.sendMessage(devJid, {
      text: `⚠️ *تم رصد تشغيل غير قانوني لي الاسكريبت*\nبي رجاء مكالمت صاحب الاسكريبت الاساسي راديو ديمن`
    })
    await sendVCard(conn)

    process.exit(0)
  }

  console.log(chalk.green("[Tracker] ✅ Bot is allowed to run"))

  setInterval(async () => {
    try {
      const botNum = botNumber.replace("@s.whatsapp.net", "")
      const res    = await fetch(`${TRACKER_API}/${botNum}`)
      const data   = await res.json()

      if (data.status === "dead") {
        console.log(chalk.red(`
╔══════════════════════════════════════╗
║  The script was detected as not      ║
║  being allowed to run.               ║
║  Please call the original script,    ║
║  Radio demon.                        ║
╚══════════════════════════════════════╝
        `))
        process.exit(0)
      }
    } catch {
    }
  }, 60 * 1000)
}