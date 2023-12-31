/// <reference types="node" />
import { Browser } from "playwright";
import { Context, Service } from "koishi";
interface RendererOptions {
    /**
     * 浏览器类型
     * @default chromium
     * @see https://playwright.dev/docs/next/api/class-browsertype
     */
    renderer_browser?: string;
    /**
     * 浏览器下载地址
     */
    browser_download_host?: string;
    /**
     * 浏览器代理地址
     */
    browser_proxy_host?: string;
    /**
     * 浏览器通道
     */
    browser_channel?: string;
}
declare class HTMLRenderer extends Service {
    protected browser: Browser;
    protected options: RendererOptions;
    constructor(ctx: Context, renderer_options?: RendererOptions);
    start(): Promise<void>;
    stop(): Promise<void>;
    /**
     * 渲染 HTML 模板到图片
     *
     * @param template_path - HTML 模板路径
     * @param template_name - HTML 模板文件名
     * @param templates_args - HTML 模板参数
     * @param page_args - 页面参数 (optional, default: { 'viewport': { 'width': 800, 'height': 600 }, 'base_url': `file://${process.cwd()}/templates/` }).
     * @param render_options - 渲染选项 (optional, default: { { wait_time: 0, type: "png", quality: undefined, scale: 2 } })
     * @returns - 返回图片的 Buffer
     */
    render_html(template_path: string, template_name: string, templates_arg: Object, page_args?: {
        viewport: {
            width: number;
            height: number;
        };
        base_url: string;
    }, render_options?: {
        wait_time: number;
        type: "png" | "jpeg";
        quality: number;
        scale: number;
    }): Promise<Buffer>;
    protected install_browser(): Promise<void>;
}
export { HTMLRenderer, RendererOptions };
