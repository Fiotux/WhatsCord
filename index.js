const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const fs = require('fs');
const { Client: DiscordClient, AttachmentBuilder, EmbedBuilder, GatewayIntentBits, WebhookClient, ChannelType, messageLink } = require('discord.js');
const config = require('./config.json');
const { Sequelize, DataTypes } = require('sequelize');
const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: './database.sqlite',
    logging: false
});

const User = sequelize.define('User', {
    name: {
        type: DataTypes.STRING,
        allowNull: true
    },
    author: {
        type: DataTypes.STRING,
        allowNull: false
    },
    channel: {
        type: DataTypes.STRING,
        allowNull: false
    },
    webhook: {
        type: DataTypes.STRING,
        allowNull: false
    }

});

const Group = sequelize.define('Group', {
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    author: {
        type: DataTypes.STRING,
        allowNull: false
    },
    channel: {
        type: DataTypes.STRING,
        allowNull: false
    },
    webhook: {
        type: DataTypes.STRING,
        allowNull: false
    }

});

const Messages = sequelize.define('Messages', {
    wid: {
        type: DataTypes.STRING,
        allowNull: false
    },
    did: {
        type: DataTypes.STRING,
        allowNull: false
    }
  });

function getHumanReadableDateTime() {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Add leading zero for single-digit months
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    return `${day}.${month}.${year} ${hours}:${minutes}:${seconds}`;
}

const client = new Client({
    authStrategy: new LocalAuth({
        dataPath: 'loginData'
    }),

});

const bot = new DiscordClient({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });


client.on('qr', qr => {
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    console.log('Client is ready!');
});

client.on('message', msg => {
    const dateTimeString = getHumanReadableDateTime();

    (async () => {
        const contact = await msg.getContact();
        const wachat = await msg.getChat();
        const pp = await contact.getProfilePicUrl();
        let data;
        if (wachat.name == "") return;
        if (wachat.isGroup) {
            data = await Group.findOne({ where: { author: `${wachat.id._serialized}` } });
        } else {
            data = await User.findOne({ where: { author: `${wachat.id._serialized}` } });
        }
        if (!data) {
            if (wachat.isGroup) {
                const guild = await bot.guilds.fetch(config.guild);
                const channel = await guild.channels.create({
                    name: `${wachat.name}`,
                    type: ChannelType.GuildText,
                    parent: config.groupcategory
                });

                const webhook = await channel.createWebhook({
                    name: `${wachat.name}`,
                    avatar: 'https://i.imgur.com/Sp087ni.jpeg',
                });

                data = await Group.create({
                    name: `${wachat.name}`,
                    author: `${wachat.id._serialized}`,
                    channel: `${channel.id}`,
                    webhook: `${webhook.url}`
                })

            } else {
                const guild = await bot.guilds.fetch(config.guild);
                const channel = await guild.channels.create({
                    name: `${wachat.name}`,
                    type: ChannelType.GuildText,
                    parent: config.privatecategory
                });

                const webhook = await channel.createWebhook({
                    name: `${wachat.name}`,
                    avatar: 'https://i.imgur.com/Sp087ni.jpeg',
                });

                data = await User.create({
                    name: `${wachat.name}`,
                    author: `${wachat.id._serialized}`,
                    channel: `${channel.id}`,
                    webhook: `${webhook.url}`
                })

            }
        }

        console.log(msg.body)
        fs.appendFile('./log.txt', `
${dateTimeString} ${contact.name}: ${msg.body}`, err => {
            if (err) {
                console.error(err);
            }
        }
        )
        //webhook part
        if (contact.name) {
            if (!msg.hasMedia && msg.body) {
                const webhookClient = new WebhookClient({ url: `${data.webhook}` });
                embed = new EmbedBuilder()
                    .setColor(5763719)
                    .setDescription(`${msg.body}`)
                    const hookmessage = await webhookClient.send({
                    avatarURL: pp,
                    username: `${contact.name}`,
                    embeds: [embed],
                }).catch(console.error);
                Messages.create({
                    wid: `${msg.id._serialized}`,
                    did: `${hookmessage.id}`
                  });
            } else {


                msg.downloadMedia().then(async media => {
                    if (!media) {
                        return;
                    }
                    if (!media.filename) {
                        console.log(`Recognized: ${media.mimetype}`);
                    } else {
                        console.log(`Recognized: ${media.mimetype} as ${media.filename}`);
                    }
                    const decodedData = Buffer.from(media.data, 'base64');
                    const webhookClient = new WebhookClient({ url: `${data.webhook}` });
                    let embed;
                    if (!msg.body) {
                        embed = new EmbedBuilder()
                            .setTitle('file')
                            .setColor(5763719)
                    } else {
                        embed = new EmbedBuilder()
                            .setTitle('file')
                            .setColor(5763719)
                            .setDescription(`${msg.body}`)
                    }
                    let file;
                    if (media.mimetype == "video/mp4") {
                        file = new AttachmentBuilder(decodedData).setName("video.mp4");
                    } else if (media.mimetype == "audio/ogg; codecs=opus") {
                        file = new AttachmentBuilder(decodedData).setName("voicemessage.ogg");
                    } else {
                        file = new AttachmentBuilder(decodedData).setName(media.filename);
                    }
                    const hookmessage = await webhookClient.send({
                        avatarURL: pp,
                        username: `${contact.name}`,
                        embeds: [embed],
                        files: [file],
                    }).catch(console.error);
                    Messages.create({
                        wid: `${msg.id._serialized}`,
                        did: `${hookmessage.id}`
                      });


                })

            }
        } else {
            if (!msg.hasMedia && msg.body) {
                const webhookClient = new WebhookClient({ url: `${data.webhook}` });
                embed = new EmbedBuilder()
                    .setColor(5763719)
                    .setDescription(`${msg.body}`)
                    const hookmessage = await webhookClient.send({
                    avatarURL: pp,
                    username: `${contact.pushname}`,
                    embeds: [embed],
                }).catch(console.error);
                Messages.create({
                    wid: `${msg.id._serialized}`,
                    did: `${hookmessage.id}`
                  });
            } else {


                msg.downloadMedia().then(async media => {
                    if (!media) {
                        return;
                    }
                    if (!media.filename) {
                        console.log(`Recognized: ${media.mimetype}`);
                    } else {
                        console.log(`Recognized: ${media.mimetype} as ${media.filename}`);
                    }
                    const decodedData = Buffer.from(media.data, 'base64');
                    const webhookClient = new WebhookClient({ url: `${data.webhook}` });
                    let embed;
                    if (!msg.body) {
                        embed = new EmbedBuilder()
                            .setTitle('file')
                            .setColor(5763719)
                    } else {
                        embed = new EmbedBuilder()
                            .setTitle('file')
                            .setColor(5763719)
                            .setDescription(`${msg.body}`)
                    }
                    let file;
                    if (media.mimetype == "video/mp4") {
                        file = new AttachmentBuilder(decodedData).setName("video.mp4");
                    } else if (media.mimetype == "audio/ogg; codecs=opus") {
                        file = new AttachmentBuilder(decodedData).setName("voicemessage.ogg");
                    } else {
                        file = new AttachmentBuilder(decodedData).setName(media.filename);
                    }
                    const hookmessage = await webhookClient.send({
                        avatarURL: pp,
                        username: `${contact.pushname}`,
                        embeds: [embed],
                        files: [file],
                    }).catch(console.error);
                    Messages.create({
                        wid: `${msg.id._serialized}`,
                        did: `${hookmessage.id}`
                      });


                })

            }
        }
    })();

});

bot.on('messageCreate', msg => {
    (async () => {
        if (msg.author.id != config.discordaccountid) return;

        let data;
        if (msg.channel.parent.id == config.groupcategory) {
            data = await Group.findOne({ where: { channel: `${msg.channel.id}` } });
        } else if (msg.channel.parent.id == config.privatecategory) {
            data = await User.findOne({ where: { channel: `${msg.channel.id}` } });
        } else {
            return;
        }

        if (msg.attachments.first()) {
            if(msg.content == "") {
                const wamsg = await client.sendMessage(`${data.author}`, MessageMedia.fromUrl(msg.attachments.first().url))
                await Messages.create({
                  wid: `${wamsg.id._serialized}`,
                  did: `${msg.id}`
                });
                return;
              }
            const media = await MessageMedia.fromUrl(msg.attachments.first().url).catch(
                client.sendMessage(`${data.author}`, MessageMedia.fromUrl(msg.attachments.first().url))
            );
            if (msg.content) {
                if (msg.attachments.first().url.includes('SPOILER_')) {
                    const wamsg = await client.sendMessage(`${data.author}`, msg.content, { sendAudioAsVoice: config.sendaudioasvoice, media: media, isViewOnce: true });
                    await Messages.create({
                        wid: `${wamsg.id._serialized}`,
                        did: `${msg.id}`
                      });
                } else {
                    const wamsg = await client.sendMessage(`${data.author}`, msg.content, { sendAudioAsVoice: config.sendaudioasvoice, media: media });
                    await Messages.create({
                        wid: `${wamsg.id._serialized}`,
                        did: `${msg.id}`
                      });
                }
            } else {
                if (msg.attachments.first().url.includes('SPOILER_')) {
                    const wamsg = await client.sendMessage(`${data.author}`, media, { sendAudioAsVoice: config.sendaudioasvoice, isViewOnce: true });
                    await Messages.create({
                        wid: `${wamsg.id._serialized}`,
                        did: `${msg.id}`
                      });
                } else {
                    const wamsg = await client.sendMessage(`${data.author}`, media, { sendAudioAsVoice: config.sendaudioasvoice });
                    await Messages.create({
                        wid: `${wamsg.id._serialized}`,
                        did: `${msg.id}`
                      });
                }
            }
        } else if (msg.stickers.first()) {
            const media = await MessageMedia.fromUrl(msg.stickers.first().url);
            const wamsg = await client.sendMessage(`${data.author}`, media, { sendMediaAsSticker: true });
            await Messages.create({
                wid: `${wamsg.id._serialized}`,
                did: `${msg.id}`
              });

        } else {
            const wamsg = await client.sendMessage(`${data.author}`, msg.content);
            await Messages.create({
                wid: `${wamsg.id._serialized}`,
                did: `${msg.id}`
              });
        }



    })();
});
bot.on('messageDelete', msg => {
  (async () => {
    const data = await Messages.findOne({ where: { did: `${msg.id}` } });
    if (!data) return;
    const wamsg = await client.getMessageById(data.wid);
    wamsg.delete(true);
  })();
});
bot.on('messageUpdate', (oldMessage, newMessage) => {
  (async () => {
    const data = await Messages.findOne({ where: { did: `${newMessage.id}` } });
    if (!data) return;
    const wamsg = await client.getMessageById(data.wid);
    wamsg.edit(`${newMessage.content}`);
  })();
});

client.initialize();
sequelize.sync();
bot.login(config.token);
