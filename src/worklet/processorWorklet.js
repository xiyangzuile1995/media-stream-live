/**
 *  该文件为监听音频流的注册文件，勿删。部署的时候需要提供给后台
 * @author 夕阳醉了
 * @email
 * @creatTime  2022/9/17
 */
export class MyWorkletProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
  }

  process(inputs, outputs, parameters) {
    this.port.postMessage(inputs[0][0]);
    return true;
  }
}

registerProcessor('processor', MyWorkletProcessor);
