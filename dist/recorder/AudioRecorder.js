"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
//  @ts-ignore 对讲语音流获取的脚本注册文件
const processorWorklet_js_1 = __importDefault(require("worklet-loader!../worklet/processorWorklet.js"));
class AudioRecorder {
    constructor(onAudioProcess) {
        this.audioDataList = [];
        this.isRecording = false;
        this.writeUTFBytes = (view, offset, string) => {
            for (let i = 0; i < string.length; i++) {
                view.setUint8(offset + i, string.charCodeAt(i));
            }
        };
        /**
         *  将arrayBuffer转换为base64字符串
         * @param buffer 音频流
         * @private
         */
        this.transformArrayBufferToBase64 = (buffer) => {
            let binary = '';
            let bytes = new Uint8Array(buffer);
            for (let len = bytes.byteLength, i = 0; i < len; i++) {
                binary += String.fromCharCode(bytes[i]);
            }
            return btoa(binary);
        };
        /**
         * base64转ArrayBuffer
         * @param base64
         * @private
         */
        this.translateBase64ToArrayBuffer = (base64) => {
            const binaryStr = window.atob(base64);
            const byteLength = binaryStr.length;
            const bytes = new Uint8Array(byteLength);
            for (let i = 0; i < byteLength; i++) {
                bytes[i] = binaryStr.charCodeAt(i);
            }
            return bytes.buffer;
        };
        /**
         * 合并音频数据
         * @param audioData 需要合并的音频数据
         * @returns {Float32Array}
         */
        this.mergeArray = (audioData) => {
            var _a;
            if (audioData.some(item => !item)) {
                throw new Error('数据不完整');
            }
            let length = audioData.length * ((_a = audioData[0]) === null || _a === void 0 ? void 0 : _a.length);
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
        this.interSingleData = (data) => {
            const audioContext = this.audioContext;
            let t = data.length;
            let sampleRate = audioContext.sampleRate;
            let outputSampleRate = sampleRate;
            sampleRate += 0.0;
            outputSampleRate += 0.0;
            let s = 0, o = sampleRate / outputSampleRate, u = Math.ceil((t * outputSampleRate) / sampleRate), a = new Float32Array(u);
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
        this.createWavFile = (audioData) => {
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
        this.getIsRecording = () => this.isRecording;
        /**
         * 播放音频数据
         * @param audioBase64
         */
        this.playAudio = (audioBase64) => {
            const audioArrayBuffer = this.translateBase64ToArrayBuffer(audioBase64);
            const audioContext = this.audioContext;
            const bufferSource = audioContext.createBufferSource();
            audioContext.decodeAudioData(audioArrayBuffer, decodedBuffer => {
                bufferSource.buffer = decodedBuffer;
                bufferSource.connect(audioContext.destination);
                bufferSource.start();
            });
        };
        this.startRecord = () => {
            this.audioContext = new AudioContext({ sampleRate: 8000 });
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
                var _a, _b;
                console.log('获取麦克风权限成功');
                this.isRecording = true;
                this.microphoneStream = stream;
                const microphoneNode = (_a = this === null || this === void 0 ? void 0 : this.audioContext) === null || _a === void 0 ? void 0 : _a.createMediaStreamSource(stream);
                this.microphoneNode = microphoneNode;
                (_b = this === null || this === void 0 ? void 0 : this.audioContext) === null || _b === void 0 ? void 0 : _b.audioWorklet.addModule(processorWorklet_js_1.default).then(() => {
                    const audioContext = this.audioContext;
                    const processorWorklet = new AudioWorkletNode(audioContext, 'processor');
                    microphoneNode
                        .connect(processorWorklet)
                        .connect(audioContext.destination);
                    processorWorklet.port.onmessage = e => {
                        var _a, _b;
                        this.audioDataList.push(e.data);
                        if (!this.isRecording) {
                            return;
                        }
                        if (((_a = this.audioDataList) === null || _a === void 0 ? void 0 : _a.length) >= 15) {
                            try {
                                let mergedAudioData = this.mergeArray(this.audioDataList);
                                let allAudioData = this.interSingleData(mergedAudioData);
                                let audioBase64 = this.createWavFile(allAudioData);
                                (_b = this.onAudioProcess) === null || _b === void 0 ? void 0 : _b.call(this, this.transformArrayBufferToBase64(audioBase64), e);
                            }
                            catch (e) {
                            }
                            this.audioDataList = [];
                        }
                    };
                }).catch(() => {
                    this.isRecording = false;
                });
            });
        };
        /**
         * 停止录音以及发送消息
         */
        this.stopRecord = () => {
            var _a, _b, _c, _d, _e;
            this.audioDataList = [];
            try {
                (_b = (_a = this === null || this === void 0 ? void 0 : this.microphoneStream) === null || _a === void 0 ? void 0 : _a.getAudioTracks()) === null || _b === void 0 ? void 0 : _b.forEach(track => {
                    var _a;
                    track.stop();
                    (_a = this === null || this === void 0 ? void 0 : this.microphoneStream) === null || _a === void 0 ? void 0 : _a.removeTrack(track);
                });
                (_c = this.microphoneNode) === null || _c === void 0 ? void 0 : _c.disconnect();
                this.isRecording = false;
                (_e = (_d = this.audioContext) === null || _d === void 0 ? void 0 : _d.close) === null || _e === void 0 ? void 0 : _e.call(_d).then(null);
                this.audioContext = undefined;
            }
            catch (e) {
                console.error(e);
            }
        };
        this.onAudioProcess = onAudioProcess;
    }
}
exports.default = AudioRecorder;
