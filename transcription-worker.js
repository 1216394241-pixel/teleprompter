import { pipeline, env } from 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.5.2';

// 仅在首次加载时从模型仓库下载；浏览器随后会把文件缓存在本机。
env.allowLocalModels = false;
let transcriber;

function progress(update) {
  if (update.status === 'progress') {
    const percent = Number.isFinite(update.progress) ? ` ${Math.round(update.progress)}%` : '';
    self.postMessage({ type: 'progress', message: `正在下载本地模型${percent}` });
  } else if (update.status === 'ready') {
    self.postMessage({ type: 'progress', message: '正在准备本地识别引擎…' });
  }
}

self.onmessage = async ({ data }) => {
  try {
    if (data.type === 'load') {
      if (!transcriber) {
        const options = { dtype: 'q4', progress_callback: progress };
        // M1 iPad 支持 WebGPU 时优先使用，无法初始化则自动回落至 WASM。
        // tiny 的量化版本能在没有 WebGPU 的 Safari/Chrome 回退路径中保持可用的响应速度。
        try { transcriber = await pipeline('automatic-speech-recognition', 'onnx-community/whisper-tiny', { ...options, device: 'webgpu' }); }
        catch { transcriber = await pipeline('automatic-speech-recognition', 'onnx-community/whisper-tiny', options); }
      }
      self.postMessage({ type: 'ready' });
    }
    if (data.type === 'transcribe' && transcriber) {
      self.postMessage({ type: 'progress', message: '正在本地识别你刚才说的内容…' });
      const result = await transcriber(data.audio, { language: 'chinese', task: 'transcribe', chunk_length_s: 6, stride_length_s: 1, return_timestamps: false });
      self.postMessage({ type: 'result', text: result.text || '' });
    }
  } catch (error) {
    self.postMessage({ type: 'error', message: error?.message || '未知错误' });
  }
};
