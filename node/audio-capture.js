const { Client, GatewayIntentBits } = require('discord.js');
const { joinVoiceChannel } = require('@discordjs/voice');
const prism = require('prism-media');
const { AudioMixer } = require('audio-mixer');
const { Readable } = require('stream');

// 引数からチャンネルIDとギルドIDを取得
const [, , vcChannelId, guildId] = process.argv;

if (!vcChannelId || !guildId) {
    console.error("Usage: node audio-capture.js <channelId> <guildId>");
    process.exit(1);
}

const client = new Client({ intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMessages
]});

const mixer = new AudioMixer.Mixer({
    channels: 2,
    bitDepth: 16,
    sampleRate: 48000,
    clearInterval: 20,
    volume: 100
});

const activeUsers = new Map();

client.once('ready', async () => {
    console.log('🎧 Node Audio Bot Ready');

    const guild = await client.guilds.fetch(guildId);
    const channel = await guild.channels.fetch(vcChannelId);

    const connection = joinVoiceChannel({
        channelId: channel.id,
        guildId: guild.id,
        adapterCreator: guild.voiceAdapterCreator,
    });

    const receiver = connection.receiver;

    receiver.speaking.on('start', (userId) => {
        if (activeUsers.has(userId)) return;

        const opusStream = receiver.subscribe(userId, {
            end: {
                behavior: 'afterSilence',
                duration: 1000
            }
        });

        const decoder = new prism.opus.Decoder({ frameSize: 960, channels: 2, rate: 48000 });
        const pcmStream = opusStream.pipe(decoder);

        const volumeStream = new prism.VolumeTransformer({ type: 's16le', volume: 1.0 });

        pcmStream.pipe(volumeStream);

        const input = new AudioMixer.Input({
            channels: 2,
            bitDepth: 16,
            sampleRate: 48000,
            volume: 100
        });

        volumeStream.pipe(input);
        mixer.addInput(input);
        activeUsers.set(userId, input);

        announceSpeakingStart(userId);
    });

    receiver.speaking.on('end', (userId) => {
        const input = activeUsers.get(userId);
        if (input) {
            mixer.removeInput(input);
            activeUsers.delete(userId);
            announceSpeakingEnd(userId);
        }
    });

    Readable.from(mixer).pipe(process.stdout);
});

function announceSpeakingStart(userId) {
    const userList = [...activeUsers.keys()].map(id => id).join(", ");
    console.log(`🗣️ 発話開始: ${userId} | 現在話しているユーザー: ${userList}`);
}

function announceSpeakingEnd(userId) {
    const userList = [...activeUsers.keys()].map(id => id).join(", ");
    console.log(`🔇 発話終了: ${userId} | 現在話しているユーザー: ${userList || "なし"}`);
}

client.login(process.env.NODE_BOT_TOKEN);
