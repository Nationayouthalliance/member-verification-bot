import express from "express";
import { Client, GatewayIntentBits } from "discord.js";

const app = express();
app.use(express.json());

const TOKEN = process.env.TOKEN;
const GUILD_ID = process.env.GUILD_ID;
const ROLE_ID = process.env.ROLE_ID;

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers],
});

client.once("ready", () => {
  console.log("Bot ready");
});

client.login(TOKEN);

app.post("/verify", async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.json({ error: "No userId" });
    }

    const guild = await client.guilds.fetch(GUILD_ID);
    const member = await guild.members.fetch(userId);

    await member.roles.add(ROLE_ID);

    res.json({ success: true });

  } catch (err) {
    console.log(err);
    res.json({ error: err.message });
  }
});

app.listen(3000, () => {
  console.log("API running");
});
