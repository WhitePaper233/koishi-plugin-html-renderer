"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.apply = exports.name = exports.Config = void 0;
const koishi_1 = require("koishi");
const renderer_1 = require("./renderer");
exports.Config = koishi_1.Schema.object({
    renderer_browser: koishi_1.Schema.union(["chromium", "webkit", "firefox"])
        .default("chromium")
        .description("默认使用的浏览器"),
    browser_channel: koishi_1.Schema.string().description("浏览器通道"),
    browser_download_host: koishi_1.Schema.string().description("浏览器下载镜像"),
    browser_proxy_host: koishi_1.Schema.string().description("浏览器代理地址"),
}).description("HTML 浏览器配置");
exports.name = "html_renderer";
function apply(ctx, config) {
    ctx.plugin(renderer_1.HTMLRenderer, config);
}
exports.apply = apply;
// HTML 渲染器类
__exportStar(require("./renderer"), exports);
