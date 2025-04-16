# Discord Voice Mixer Bot

## 概要

このBotは、**Discordのボイスチャンネル1(VC1)** から音声を取得し、**複数人の音声を合成**した上で、**ボイスチャンネル2(VC2)** に転送・再生するBotです。  
Node.jsとPythonのハイブリッド構成で実装されており、音声処理の柔軟性と制御性を両立しています。

## 特徴

- VC1の参加者の音声をリアルタイムにキャプチャ
- `audio-mixer` を使って複数人の音声を合成
- 個別音量の調整（VolumeTransformer）
- 発話者リストの表示
- 発話がないときは送信待機し、話し始めたら送信を開始
- スラッシュコマンドによる操作
- ffmpeg を用いたPCM形式でのオーディオ伝送

---

## 📁 ディレクトリ構成（プロジェクト構造）

```plaintext
discord-voice-mixer-bot/
├── node/
│   ├── audio-capture.js     # VC1から音声を取得し、audio-mixerで合成。PCMデータをstdoutへ出力。
│   ├── package.json         # Node.jsの依存関係定義（@discordjs/voice, audio-mixer など）
├── python/
│   ├── main.py              # Discordスラッシュコマンドの処理。VC2へ再生コマンドを発行。
│   ├── audio_sender.py      # Node.jsからのPCMデータを受信し、VC2に再生する処理。
│   ├── requirements.txt     # Pythonの依存関係（py-cord, ffmpeg-pythonなど）
├── README.md                # このファイル
