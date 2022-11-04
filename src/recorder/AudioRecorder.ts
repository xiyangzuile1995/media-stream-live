//  @ts-ignore 对讲语音流获取的脚本注册文件
import processorWorklet from 'worklet-loader!../worklet/processorWorklet.js';

/**
 *音频数据存储对象
 * */
type AudioProcessCallback = (audioData: string, e: MessageEvent) => void;

class AudioRecorder {
  private audioContext?: AudioContext;
  private microphoneStream?: MediaStream;
  private audioDataList: any = [];
  onAudioProcess?: AudioProcessCallback;
  private microphoneNode?: MediaStreamAudioSourceNode;
  private isRecording: boolean = false;

  constructor(onAudioProcess: any) {
    this.onAudioProcess = onAudioProcess;
  }

  private writeUTFBytes = (view: any, offset: any, string: any) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };

  /**
   *  将arrayBuffer转换为base64字符串
   * @param buffer 音频流
   * @private
   */
  private transformArrayBufferToBase64 = (buffer: any) => {
    let binary = '';
    let bytes = new Uint8Array(buffer);
    for (let len = bytes.byteLength, i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  /**
   * base64转ArrayBuffer
   * @param base64
   * @private
   */
  private translateBase64ToArrayBuffer = (base64: string) => {
    const binaryStr = window.atob(base64);
    const byteLength = binaryStr.length;
    const bytes = new Uint8Array(byteLength);
    for (let i = 0; i < byteLength; i++) {
      bytes[i] = binaryStr.charCodeAt(i);
    }
    return bytes.buffer;
  }

  /**
   * 合并音频数据
   * @param audioData 需要合并的音频数据
   * @returns {Float32Array}
   */
  private mergeArray = (audioData: Float32Array[]) => {
    if (audioData.some(item => !item)) {
      throw new Error('数据不完整');
    }
    let length = audioData.length * audioData[0]?.length;
    let data = new Float32Array(length);
    let offset = 0;
    for (let i = 0; i < audioData.length; i++) {
      data.set(audioData[i], offset);
      offset += audioData[i].length;
    }
    return data;
  };

  /**
   * 压缩音频数据
   * @param data 音频数据
   * @returns {Float32Array}
   */
  private interSingleData = (data: any) => {
    const audioContext = this.audioContext as AudioContext;
    let t = data.length;
    let sampleRate = audioContext.sampleRate;
    let outputSampleRate = sampleRate;
    sampleRate += 0.0;
    outputSampleRate += 0.0;
    let s = 0,
        o = sampleRate / outputSampleRate,
        u = Math.ceil((t * outputSampleRate) / sampleRate),
        a = new Float32Array(u);
    for (let i = 0; i < u; i++) {
      a[i] = data[Math.floor(s)];
      s += o;
    }
    return a;
  };

  /**
   * 根据处理后的音频数据转换成Wav的文件流数据
   * @param audioData 音频数据
   * @returns {ArrayBuffer} 数据流
   */
  private createWavFile = (audioData: any) => {
    let channelCount = 1;
    const WAV_HEAD_SIZE = 44;
    let sampleRate = 8000;

    let buffer = new ArrayBuffer(audioData.length * 2 + WAV_HEAD_SIZE);
    // 需要用一个view来操控buffer
    let view = new DataView(buffer);
    // 写入wav头部信息
    // RIFF chunk descriptor/identifier
    this.writeUTFBytes(view, 0, 'RIFF');
    // RIFF chunk length
    view.setUint32(4, 44 + audioData.length * channelCount, true);
    // RIFF type
    this.writeUTFBytes(view, 8, 'WAVE');
    // format chunk identifier
    // FMT sub-chunk
    this.writeUTFBytes(view, 12, 'fmt ');
    // format chunk length
    view.setUint32(16, 16, true);
    // sample format (raw)
    view.setUint16(20, 1, true);
    // stereo (2 channels)
    view.setUint16(22, channelCount, true);
    // sample rate
    view.setUint32(24, sampleRate, true);
    // byte rate (sample rate * block align)
    view.setUint32(28, sampleRate * 2, true);
    // block align (channel count * bytes per sample)
    view.setUint16(32, 2 * 2, true);
    // bits per sample
    view.setUint16(34, 16, true);
    // data sub-chunk
    // data chunk identifier
    this.writeUTFBytes(view, 36, 'data');
    // data chunk length
    view.setUint32(40, audioData.length * 2, true);

    let length = audioData.length;
    let index = 44;
    let volume = 1;
    for (let i = 0; i < length; i++) {
      view.setInt16(index, audioData[i] * (0x7fff * volume), true);
      index += 2;
    }
    return buffer;
  };

  /**
   * 获取录制状态
   */
  public getIsRecording = () => this.isRecording

  /**
   * 播放音频数据
   * @param audioBase64
   */
  public playAudio = (audioBase64: string) => {
    const audioArrayBuffer: ArrayBuffer = this.translateBase64ToArrayBuffer(audioBase64)
    const audioContext = this.audioContext as AudioContext;
    const bufferSource = audioContext.createBufferSource();
    audioContext.decodeAudioData(audioArrayBuffer, decodedBuffer => {
      bufferSource.buffer = decodedBuffer;
      bufferSource.connect(audioContext.destination);
      bufferSource.start();
    });
  };

  public startRecord = () => {
    this.audioContext = new AudioContext({sampleRate: 8000});
    navigator.mediaDevices
    .getUserMedia({
      audio: {
        // 采样率
        sampleRate: 8000,
        // 声道
        channelCount: 1,
        autoGainControl: true,
      },
    })
    .then(stream => {
      console.log('获取麦克风权限成功');
      this.isRecording = true;
      this.microphoneStream = stream;
      const microphoneNode: MediaStreamAudioSourceNode = this?.audioContext?.createMediaStreamSource(
          stream,
      ) as MediaStreamAudioSourceNode;
      this.microphoneNode = microphoneNode;
      this?.audioContext?.audioWorklet
      .addModule(processorWorklet)
      .then(() => {
        const audioContext = this.audioContext as AudioContext;
        const processorWorklet = new AudioWorkletNode(
            audioContext,
            'processor',
        ) as AudioWorkletNode;
        microphoneNode
        .connect(processorWorklet)
        .connect(audioContext.destination);
        processorWorklet.port.onmessage = e => {
          this.audioDataList.push(e.data);
          if (!this.isRecording) {
            return;
          }
          if (this.audioDataList?.length >= 15) {
            try {
              let mergedAudioData = this.mergeArray(this.audioDataList);
              let allAudioData = this.interSingleData(mergedAudioData);
              let audioBase64 = this.createWavFile(allAudioData);
              this.onAudioProcess?.(
                  this.transformArrayBufferToBase64(audioBase64),
                  e,
              );
            } catch (e) {
            }
            this.audioDataList = [];
          }
        };
      })
      .catch(() => {
        this.isRecording = false;
      });
    });
  };

  /**
   * 停止录音以及发送消息
   */
  public stopRecord = () => {
    this.audioDataList = [];
    try {
      this?.microphoneStream?.getAudioTracks()?.forEach(track => {
        track.stop();
        this?.microphoneStream?.removeTrack(track);
      });
      this.microphoneNode?.disconnect();
      this.isRecording = false;
      this.audioContext?.close?.().then(null);
      this.audioContext = undefined;
    } catch (e) {
      console.error(e);
    }
  };
}

export default AudioRecorder;
