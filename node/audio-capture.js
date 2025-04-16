const { Client, GatewayIntentBits } = require('discord.js');
const { joinVoiceChannel } = require('@discordjs/voice');
const prism = require('prism-media');
const { AudioMixer } = require('audio-mixer');
const { Readable } = require('stream');

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });

let mixer = new AudioMixer.Mixer({
    channels: 2,
    bitDepth: 16,
    sampleRate: 48000,
    clearInterval: 20,
    volume: 100
});

const activeUsers = new Map(); // userId => readable
let messageChannel;

client.once('ready', () => {
    console.log('Node Audio Bot Ready');
});

client.on('messageCreate', async (message) => {
    if (message.content.startsWith('!capture')) {
        const channel = message.member.voice.channel;
        if (!channel) return;

        messageChannel = message.channel;
        await message.channel.send("🎙️ 音声キャプチャを開始します");

        const connection = joinVoiceChannel({
            channelId: channel.id,
            guildId: channel.guild.id,
            adapterCreator: channel.guild.voiceAdapterCreator,
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

            // VolumeTransformerで音量調整
            const volumeStream = new prism.VolumeTransformer({ type: 's16le', volume: 1.0 });

            pcmStream.pipe(volumeStream);

            // AudioMixerでミックス
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

        // ミックス済み出力を標準出力へ（Pythonへ）
        Readable.from(mixer).pipe(process.stdout);
    }
});

function announceSpeakingStart(userId) {
    if (messageChannel) {
        const userList = [...activeUsers.keys()].map(id => `<@${id}>`).join(", ");
        messageChannel.send(`🗣️ 発話開始: <@${userId}> | 現在話しているユーザー: ${userList}`);
    }
}

function announceSpeakingEnd(userId) {
    if (messageChannel) {
        const userList = [...activeUsers.keys()].map(id => `<@${id}>`).join(", ");
        messageChannel.send(`🔇 発話終了: <@${userId}> | 現在話しているユーザー: ${userList || "なし"}`);
    }
}

client.login("YOUR_NODE_BOT_TOKEN");

