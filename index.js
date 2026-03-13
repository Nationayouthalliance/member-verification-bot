import express from "express";
import { Client, GatewayIntentBits } from "discord.js";

const app = express();
app.use(express.json());

const TOKEN = process.env.TOKEN;
const GUILD_ID = process.env.GUILD_ID;
const ROLE_ID = process.env.ROLE_ID;
const LOG_CHANNEL_ID = process.env.LOG_CHANNEL_ID;

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
  ],
});

let botReady = false;

client.once("ready", () => {
  console.log("Bot ready");
  botReady = true;
});

client.login(TOKEN);

const lastVerify = new Map();

app.post("/verify", async (req, res) => {
  try {
    if (!botReady) {
      return res.json({ error: "Bot not ready" });
    }

    const { userId } = req.body;

    const guild = await client.guilds.fetch(GUILD_ID);
    const logChannel = await client.channels.fetch(LOG_CHANNEL_ID);

    if (!logChannel) {
      console.log("Log channel not found");
    }

    if (!userId) {
      if (logChannel) await logChannel.send("❌ No userId received");
      return res.json({ error: "No userId" });
    }

    const now = Date.now();

    if (lastVerify.has(userId)) {
      const diff = now - lastVerify.get(userId);

      if (diff < 10000) {
        if (logChannel)
          await logChannel.send("🚫 Cooldown spam: " + userId);

        return res.json({ error: "Cooldown active" });
      }
    }

    lastVerify.set(userId, now);

    let member;

    try {
      member = await guild.members.fetch(userId);
    } catch {
      if (logChannel)
        await logChannel.send("❌ Not in server: " + userId);

      return res.json({ error: "User not in server" });
    }

    if (member.roles.cache.has(ROLE_ID)) {
      if (logChannel)
        await logChannel.send("⚠ Already verified: " + userId);

      return res.json({ message: "Already verified" });
    }

    await member.roles.add(ROLE_ID);

    if (logChannel)
      await logChannel.send("✅ Verified: " + userId);

    return res.json({ success: true });

  } catch (err) {
    console.log(err);

    try {
      const logChannel = await client.channels.fetch(LOG_CHANNEL_ID);
      if (logChannel) {
        await logChannel.send("🔥 Error: " + err.message);
      }
    } catch {}

    return res.json({ error: err.message });
  }
});

app.listen(3000, () => {
  console.log("API running");
});
