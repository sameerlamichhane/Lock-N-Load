const { MessageEmbed } = require("discord.js");
const emoji = require('../../emoji.js');
const Settings = require('../../settings.js');

const cooldowns = new Map();
const LOCKALL_COOLDOWN = 60000;

module.exports = {
  name: "lockall",
  UserPerms: ['MANAGE_CHANNELS'],
  BotPerms: ['MANAGE_CHANNELS', 'EMBED_LINKS'],
  run: async function (client, message, args) {
    let prefix = await client.db8.get(`${message.guild.id}_prefix`) || Settings.bot.info.prefix;
    const premium = await client.db12.get(`${message.guild.id}_premium`);

    if (premium.active !== true) {
      return message.channel.send(`Please upgrade to premium to unlock this command! Use ${prefix}premium purchase.`)
    }

    let msg = await message.channel.send({ content: `${emoji.util.loading} | Your request is currently being processed. Please kindly await.` });

    const cooldownKey = `${message.author.id}_${this.name}`;
    const currentTime = Date.now();
    
    if (cooldowns.has(cooldownKey)) {
      const expirationTime = cooldowns.get(cooldownKey) + LOCKALL_COOLDOWN;
      if (currentTime < expirationTime) {
        const timeLeft = (expirationTime - currentTime) / 1000;
        return message.channel.send(`${emoji.util.cross} | Please wait ${timeLeft.toFixed(1)} seconds before using the command again.`);
      }
    }

    cooldowns.set(cooldownKey, currentTime);
    setTimeout(() => cooldowns.delete(cooldownKey), LOCKALL_COOLDOWN);

    const channels = message.guild.channels.cache.filter(channel => channel.type === "GUILD_TEXT" || channel.type === "GUILD_VOICE");

    const lockedChannels = [];

    for (const [, channel] of channels) {
      if (channel.manageable) {
        await channel.permissionOverwrites.edit(message.guild.id, {
          SEND_MESSAGES: false,
          CONNECT: false,
          reason: `${message.author.tag} (${message.author.id})`,
        });

        lockedChannels.push(channel.name);
      }
    }
    setTimeout(() => {
      msg.edit(`${emoji.util.tick} | Successfully locked all channels (${lockedChannels.length}).`);
    }, 5000);
  },
};
