media-stream-live.js
====================

说明：一个集视频流、音频流一体的直播流数据录制、压缩、解压解析为一体的媒体流直播的工具包（暂不支持视频）

1.语音实时通话

* 音频自动压缩 ✔
* 音频自动解析 ✔

2.视频（暂不支持）

* 视频压缩 ✖
* 视频解析 ✖

#### 语法

install

```
npm install media-stream-live
```

构造器

```javascript
const audioRecorder = new AudioRecorder(onAudioProcess)
```

API 属性说明

| 属性  | 说明  | 类型  | 默认值 | 版本  |
|-----|-----|-----|-----|-----|
| -   | -   | -   | -   | -   |

方法

| 方法             | 说明     | 类型                            | 默认值 | 版本  |
|----------------|--------|-------------------------------|-----|-----|
| startRecord    | 开启录制   | function                      | -   | 1.0 |
| playAudio      | 播放音频数据 | (audioBase64:string)=>boolean | -   | 1.0 |
| stopRecord     | 停止录制   | function                      | -   | 1.0 |
| getIsRecording | 获取录制状态 | ()=>boolean                   | -   | 1.0 |

事件

| 属性             | 说明          | 类型                         | 默认值 | 版本  |
|----------------|-------------|----------------------------|-----|-----|
| onAudioProcess | 当语音数据流进行时回调 | (audioBase64:string)=>void | -   | 1.0 |

用法demo

```javascript
import { AudioRecorder } from 'media-stream-live'

const ws = new WebSocket('ws://demo')
const audioRecorder = new AudioRecorder(onAudioProcess)

//  语音流分片数据流回调
function onAudioProcess(audioBase64) {
  // do something  如：将数据通过websocket的方法，传给后台
  ws.send(audioBase64)
}

//  收到后台发送过来的语音数据时，直接用数据进行播放
function onMessage(audioBase64) {
  //  播放语音
  audioRecorder.playAudio(audioBase64)
}

ws.onmessage = onMessage
//  websocket关闭时 停止录制
ws.onclose = audioRecorder.stopRecord
//  websocket发生错误时 停止录制
ws.onerror = audioRecorder.stopRecord
//  打开麦克风，开始录制
audioRecorder.startRecord()
```
