"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const AudioRecorder_1 = __importDefault(require("./recorder/AudioRecorder"));
const mediaStreamLive = {
    AudioRecorder: AudioRecorder_1.default
};
exports.default = mediaStreamLive;
