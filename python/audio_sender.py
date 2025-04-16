# python/audio_sender.py
import discord

async def play_audio(vc_channel, pcm_stream):
    vc = await vc_channel.connect()

    class PCMStream(discord.AudioSource):
        def read(self):
            return pcm_stream.read(3840)  # 20ms 分のデータ（48kHz * 2ch * 2bytes）

        def is_opus(self):
            return False

    vc.play(PCMStream())

