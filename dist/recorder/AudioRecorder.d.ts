/**
 *音频数据存储对象
 * */
declare type AudioProcessCallback = (audioData: string, e: MessageEvent) => void;
declare class AudioRecorder {
    private audioContext?;
    private microphoneStream?;
    private audioDataList;
    onAudioProcess?: AudioProcessCallback;
    private microphoneNode?;
    private isRecording;
    constructor(onAudioProcess: any);
    private writeUTFBytes;
    /**
     *  将arrayBuffer转换为base64字符串
     * @param buffer 音频流
     * @private
     */
    private transformArrayBufferToBase64;
    /**
     * base64转ArrayBuffer
     * @param base64
     * @private
     */
    private translateBase64ToArrayBuffer;
    /**
     * 合并音频数据
     * @param audioData 需要合并的音频数据
     * @returns {Float32Array}
     */
    private mergeArray;
    /**
     * 压缩音频数据
     * @param data 音频数据
     * @returns {Float32Array}
     */
    private interSingleData;
    /**
     * 根据处理后的音频数据转换成Wav的文件流数据
     * @param audioData 音频数据
     * @returns {ArrayBuffer} 数据流
     */
    private createWavFile;
    /**
     * 获取录制状态
     */
    getIsRecording: () => boolean;
    /**
     * 播放音频数据
     * @param audioBase64
     */
    playAudio: (audioBase64: string) => void;
    startRecord: () => void;
    /**
     * 停止录音以及发送消息
     */
    stopRecord: () => void;
}
export default AudioRecorder;
