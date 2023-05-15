# RTSP to FLV

## 1. Introduction
后端nodejs使用ffmpeg将RTSP流转换为FLV流，然后前端使用flv.js播放FLV流。

## 2. Usage
1. 安装 [ffmpeg](https://github.com/BtbN/FFmpeg-Builds/releases/download/latest/ffmpeg-master-latest-win64-gpl.zip)
2. 配置 ffmpeg 的 bin 目录环境变量，或在 index.js 中修改 ffmpegPath
3. 修改 index.html 中的 rtspUrl
4. 安装依赖 npm install
5. 启动服务 npm dev ,访问 http://localhost:8000

## 3. Attention
1. CPU 使用率会较高
2. 如果服务器性能不好，可以考虑使用 GPU 加速
3. 当然如果同时需要转换的RTSP较少，也可以接受
4. 本项目只是简单的 demo 并运行在 windows
5. 如需在 linux 使用请安装linux对应 [ffmpeg](https://github.com/BtbN/FFmpeg-Builds/releases)
