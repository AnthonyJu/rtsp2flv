const { spawn } = require('child_process');
const express = require('express')

const app = express();
app.use(express.static(__dirname))

// 多路流管理
const streams = {
  cam1: {
    rtsp: '',
    clients: [],
    ffmpeg: null
  },
  cam2: {
    rtsp: '',
    clients: [],
    ffmpeg: null
  }
};

// 启动某路 FFmpeg
function startFFmpeg(streamId) {
  const info = streams[streamId];
  if (!info || info.ffmpeg) return;

  // 启动 FFmpeg 进程
  info.ffmpeg = spawn('ffmpeg', [
    '-rtsp_transport', 'tcp', // 使用 TCP 传输 RTSP
    '-fflags', 'nobuffer', // 低延迟
    '-flags', 'low_delay', // 低延迟
    '-analyzeduration', '100000',// 尽可能快地启动
    '-probesize', '500000', // 尽可能快地启动
    '-i', info.rtsp, // 流地址
    '-vcodec', 'copy', // 直接拷贝视频流，前提是摄像头输出的是 h264，否则需要改成 libx264 等编码器
    '-acodec', '-an', // -an 可禁用音频，acc 音频编码
    '-f', 'flv', // 输出格式为 flv
    '-' // 输出到 stdout
  ]);

  info.ffmpeg.stdout.on('data', chunk => {
    info.clients.forEach(c => c.write(chunk));
  });

  info.ffmpeg.stderr.on('data', () => { });

  info.ffmpeg.on('start', (cmd) => {
    console.log(`FFmpeg started for stream '${streamId}': ${cmd}`);
  });

  info.ffmpeg.on('close', () => {
    info.ffmpeg = null;
  });

  info.ffmpeg.on('error', (err) => {
    info.ffmpeg = null;
    console.error(`FFmpeg error for stream '${streamId}': ${err}`);
  });
}

// 停止无用户的流
function stopFFmpegIfIdle(streamId) {
  const info = streams[streamId];
  if (info && info.clients.length === 0 && info.ffmpeg) {
    info.ffmpeg.kill('SIGKILL');
    info.ffmpeg = null;
  }
}

// 路由：/live/:id 例如 /live/cam1
app.get('/live/:id', (req, res) => {
  // 获取流 ID
  const streamId = req.params.id;
  console.log(`Client connected to stream '${streamId}'`);

  // 若此流不存在，返回 404
  if (!streams[streamId]) {
    res.status(404).send(`Stream '${streamId}' not registered`);
    return;
  }

  res.writeHead(200, {
    'Content-Type': 'video/x-flv',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*'
  });

  const info = streams[streamId];
  info.clients.push(res);

  // 无 ffmpeg → 启动
  if (!info.ffmpeg) startFFmpeg(streamId);

  req.on('close', () => {
    const index = info.clients.indexOf(res);
    if (index !== -1) info.clients.splice(index, 1);
    stopFFmpegIfIdle(streamId);
  });
});

// 启动服务
app.listen(8020, () => {
  // 自动打开浏览器
  // spawn('cmd', ['/c', 'start', 'http://localhost:8000'], {
  spawn('open', ['http://localhost:8020'], {
    detached: true,
    stdio: 'ignore'
  }).unref();

  console.log('Server started');
});
