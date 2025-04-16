# python/main.py
import discord
from discord.ext import commands
import subprocess
import os
from dotenv import load_dotenv
from audio_sender import play_audio

# .env 読み込み
load_dotenv()

PY_BOT_TOKEN = os.getenv("PY_BOT_TOKEN")
NODE_BOT_TOKEN = os.getenv("NODE_BOT_TOKEN")

bot = commands.Bot(command_prefix="/", intents=discord.Intents.all())

@bot.slash_command(name="stream")
async def stream(ctx, channel1: discord.VoiceChannel, channel2: discord.VoiceChannel):
    await ctx.respond(f"🎙️ 音声を {channel1.name} から取得し、{channel2.name} に中継します...")

    # Node.js プロセスを起動し、VC1 のIDとGUILD IDを渡す
    process = subprocess.Popen(
        ["node", "../node/audio-capture.js", str(channel1.id), str(channel1.guild.id)],
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE
    )

    await play_audio(channel2, process.stdout)

bot.run(PY_BOT_TOKEN)
