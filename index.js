const { spawn } = require('child_process');
const express = require('express')
const ffmpeg = require('fluent-ffmpeg')
// 配置 ffmpeg 路径
// ffmpeg.setFfmpegPath('E:/ffmpeg/bin/ffmpeg.exe')


const app = express()
app.use(express.static(__dirname))

app.get('/stream', (req, res) => {
  // 执行 ffmpeg 命令
  const ffmpegProcess = ffmpeg(req.query.url)
    .outputOptions(['-c:v libx264', '-c:a aac', '-f flv'])
    .on('error', (err) => {
      // 终止响应
      res.end()
      console.log('An error occurred: ' + err.message)
    })

  // 监听请求关闭事件，并停止ffmpeg命令
  req.on('close', () => {
    try {
      ffmpegProcess.kill('SIGINT') // 停止ffmpeg命令
    } catch (e) {
      console.log('Error while killing ffmpeg process:', e.message)
    }
  })

  // 使用管道将ffmpeg命令的输出重定向到response
  ffmpegProcess.pipe(res, { end: true })
})

app.listen(8000, () => {
  // 自动打开浏览器
  spawn('cmd', ['/c', 'start', 'http://localhost:8000'], {
    detached: true, 
    stdio: 'ignore' 
  }).unref();

  console.log('Server started: http://localhost:8000')
})
