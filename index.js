const { spawn } = require('child_process');
const express = require('express')
const ffmpeg = require('fluent-ffmpeg')

const app = express()
app.use(express.static(__dirname))

app.get('/stream', (req, res) => {
  if (!req.query.url) {
    return res.status(400).send('Missing RTSP URL');
  }

  // 对 URL 解码，防止特殊字符问题
  const url = decodeURIComponent(req.query.url);
  console.log('拉流地址：', url)

  // 设置响应头
  res.setHeader('Content-Type', 'video/x-flv');

  // 执行 ffmpeg 命令
  const ffmpegProcess = ffmpeg(url)
    .inputOptions([
      '-rtsp_transport', 'tcp',           // 强制 TCP 拉流
      '-timeout', '5000000',              // 微秒，超时设置
      '-analyzeduration', '500000',    // 提前分析流
      '-probesize', '500000',            // 分析缓冲区大小
    ])
    .outputOptions([
      '-c:v libx264',                     // 视频编码
      '-c:a aac',                         // 音频编码
      '-f flv'                             // 输出 FLV 格式
    ])
    .on('start', cmd => {
      console.log('FFmpeg 启动命令:', cmd);
    })
    .on('error', (err) => {
      console.log('【Error】: ' + err)
      if (!res.headersSent) {
        res.status(500).end();
      }
    })

  // 监听请求关闭事件，并停止ffmpeg命令
  req.on('close', () => {
    console.log('客户端断开连接，停止拉流');
    try {
      ffmpegProcess.kill('SIGINT') // 停止ffmpeg命令
    } catch (e) {
      console.log('【Error】 while killing ffmpeg process:', e.message)
    }
  })

  // 使用管道将ffmpeg命令的输出重定向到response
  ffmpegProcess.pipe(res, { end: true })
})

app.listen(8020, () => {
  // 自动打开浏览器
  // spawn('cmd', ['/c', 'start', 'http://localhost:8000'], {
  spawn('open', ['http://localhost:8020'], {
    detached: true,
    stdio: 'ignore'
  }).unref();

  console.log('Server started: http://localhost:8020')
})
