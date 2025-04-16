# python/main.py
import discord
from discord.ext import commands
import subprocess
from audio_sender import play_audio

bot = commands.Bot(command_prefix="/", intents=discord.Intents.all())

@bot.slash_command(name="stream")
async def stream(ctx, vc2: discord.VoiceChannel):
    await ctx.respond("Node.js で音声を取得中...")

    # Node.js プロセスを起動し、標準出力を受信
    process = subprocess.Popen(
        ["node", "../node/audio-capture.js"],
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE
    )

    await ctx.respond("VC2 に転送中...")
    await play_audio(vc2, process.stdout)

bot.run("YOUR_PY_BOT_TOKEN")

