import { Context, Schema } from "koishi";
import { HTMLRenderer, RendererOptions } from "./renderer";

declare module "koishi" {
  interface Context {
    html_renderer: HTMLRenderer;
  }
}

export const Config: Schema<RendererOptions> = Schema.object({
  renderer_browser: Schema.union(["chromium", "webkit", "firefox"])
    .default("chromium")
    .description("默认使用的浏览器"),
  browser_channel: Schema.string().description("浏览器通道"),
  browser_download_host: Schema.string().description("浏览器下载镜像"),
  browser_proxy_host: Schema.string().description("浏览器代理地址"),
}).description("HTML 浏览器配置");

export const name = "html_renderer";

export function apply(ctx: Context, config: RendererOptions) {
  ctx.plugin(HTMLRenderer, config);
}

// HTML 渲染器类
export * from "./renderer";
