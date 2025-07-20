import { render } from "ejs";
import { readFile } from "fs/promises";
import { existsSync } from 'fs'
import { Browser, LaunchOptions, chromium, firefox, webkit } from "playwright";
import { Context, Service } from "koishi";

export const AVALIABLE_BROWSERS = ["firefox", "webkit", "chromium"] as const;
type BrowserType = typeof AVALIABLE_BROWSERS[number];

// 浏览器选项
export interface BrowserOptions {
    /**
     * 浏览器类型
     * @default chromium
     * @see https://playwright.dev/docs/next/api/class-browsertype
     */
    renderer_browser?: BrowserType;

    /**
     * 浏览器代理地址
     */
    browser_proxy_host?: string;

    /**
     * 浏览器通道
     */
    browser_channel?: string;
}

// 页面参数
interface PageOptions {
    // 视口
    viewport: { width: number; height: number };
    // 基础 URL
    base_url: string;
}

// 渲染选项
interface RenderOptions {
    // 等待时间
    wait_time: number;
    // 类型
    type: "png" | "jpeg";
    // 质量
    quality?: number;
    // 缩放
    scale: number;
}

// HTML 渲染器服务类
export default class HTMLRenderer extends Service {
    // 浏览器对象
    protected browser!: Browser;

    // 选项
    protected options: BrowserOptions = {
        renderer_browser: "chromium",
        browser_proxy_host: "",
        browser_channel: "",
    };

    // 初始化日志
    private _logger = this.ctx.logger("html_renderer");

    // 构造方法
    public constructor(ctx: Context, renderer_options?: BrowserOptions) {
        super(ctx, "html_renderer", true);
        // 初始化配置
        this.options = Object.assign(this.options, renderer_options);
    }

    // 声明周期函数
    // 启动
    public async start() {
        // 检查浏览器是否安装
        let browser_exsit: boolean = false;

        switch (this.options.renderer_browser) {
            case 'firefox': {
                browser_exsit = existsSync(firefox.executablePath());
                break;
            }
            case 'webkit': {
                browser_exsit = existsSync(webkit.executablePath());
                break;
            }
            default: {
                browser_exsit = existsSync(chromium.executablePath());
                break;
            }
        }

        if (!browser_exsit) {
            this._logger.error("未检测到浏览器，访问 https://playwright.dev/docs/browsers 以安装浏览器");
            throw new Error("未检测到浏览器");
        }

        // 配置启动参数
        const launch_options: LaunchOptions = {};
        if (this.options.browser_proxy_host) {
            if (!launch_options.proxy) launch_options.proxy = { server: this.options.browser_proxy_host };
            else launch_options.proxy.server = this.options.browser_proxy_host;
        }
        if (this.options.browser_channel) {
            launch_options.channel = this.options.browser_channel;
        }

        // 启动浏览器
        this._logger.debug("正在启动浏览器...");
        switch (this.options.renderer_browser) {
            case 'firefox': {
                this._logger.debug("正在以 firefox 浏览器启动服务");
                this.browser = await firefox.launch(launch_options);
                break;
            }
            case 'webkit': {
                this._logger.debug("正在以 webkit 浏览器启动服务");
                this.browser = await webkit.launch(launch_options);
                break;
            }
            default: {
                this._logger.debug("正在以 chromium 浏览器启动服务");
                this.browser = await chromium.launch(launch_options);
                break;
            }
        }
    }

    // 停止
    public async stop() {
        // 关闭浏览器
        this._logger.debug("正在关闭浏览器...");
        await this.browser?.close();
    }

    // 模板渲染方法
    // 渲染HTML
    /**
     * 渲染 HTML 模板到图片
     *
     * @param template_path - HTML 模板路径
     * @param template_name - HTML 模板文件名
     * @param templates_args - HTML 模板参数
     * @param page_options - 页面参数 (optional, default: { 'viewport': { 'width': 800, 'height': 600 }, 'base_url': `file://${process.cwd()}/templates/` }).
     * @param render_options - 渲染选项 (optional, default: { { wait_time: 0, type: "png", quality: undefined, scale: 2 } })
     * @returns - 返回图片的 Buffer
     */
    public async render_template_html_file(
        template_path: string,
        template_name: string,
        templates_arg: Object,
        page_options: PageOptions = {
            viewport: { width: 800, height: 600 },
            base_url: `file://${template_path}/`,
        },
        render_options: RenderOptions = {
            wait_time: 0,
            type: "png",
            quality: undefined,
            scale: 2,
        }
    ): Promise<Buffer> {
        // 读取模板文件
        let template: string;
        try {
            const data = await readFile(`${template_path}/${template_name}`, "utf-8");
            template = data;
        } catch (error) {
            this._logger.error(`读取模板文件失败: ${(error as any).message}`);
            throw error;
        }

        // 渲染模板
        const html = await render(template, templates_arg, { async: true });

        // 加载HTML页面
        const page = await this.browser.newPage({
            ...page_options,
            deviceScaleFactor: render_options.scale,
        });
        await page.setContent(html, { waitUntil: "networkidle" });
        await page.waitForTimeout(render_options.wait_time);

        // 截图
        const image = await page.screenshot({
            fullPage: true,
            type: render_options.type,
            quality: render_options.quality,
        });

        // 关闭页面
        page.close();

        return image;
    }

    // 渲染 HTML
    /**
     * 渲染 HTML 文件到图片
     *
     * @param file_path - HTML 文件路径
     * @param file_name - HTML 文件名
     * @param page_options - 页面参数 (optional, default: { 'viewport': { 'width': 800, 'height': 600 }, 'base_url': `file://${file_path}/` }).
     * @param render_options - 渲染选项 (optional, default: { { wait_time: 0, type: "png", quality: undefined, scale: 2 } })
     * @returns - 返回图片的 Buffer
     */
    public async render_html_file(
        file_path: string,
        file_name: string,
        page_options: PageOptions = {
            viewport: { width: 800, height: 600 },
            base_url: `file://${file_path}/`,
        },
        render_options: RenderOptions = {
            wait_time: 0,
            type: "png",
            quality: undefined,
            scale: 2,
        }
    ): Promise<Buffer> {
        // 读取 html 文件
        let page_string = "";
        try {
            page_string = await readFile(`${file_path}/${file_name}`, "utf-8");
        } catch (error) {
            this._logger.error(`读取 html 文件失败: ${(error as any).message}`);
            throw error;
        }

        // 加载 HTML 页面
        const page = await this.browser.newPage({
            ...page_options,
            deviceScaleFactor: render_options.scale,
        });
        await page.setContent(page_string, { waitUntil: "networkidle" });
        await page.waitForTimeout(render_options.wait_time);

        // 截图
        const image = await page.screenshot({
            fullPage: true,
            type: render_options.type,
            quality: render_options.quality,
        });

        // 关闭页面
        page.close();

        return image;
    }

    // 渲染 URL
    /**
     * 渲染 URL 到图片
     *
     * @param url - URL 地址
     * @param page_options - 页面参数 (optional, default: { 'viewport': { 'width': 800, 'height': 600 }, 'base_url': url }).
     * @param render_options - 渲染选项 (optional, default: { { wait_time: 0, type: "png", quality: undefined, scale: 2 } })
     * @returns - 返回图片的 Buffer
     */
    public async render_url(
        url: string,
        page_options: PageOptions = {
            viewport: { width: 800, height: 600 },
            base_url: url,
        },
        render_options: RenderOptions = {
            wait_time: 0,
            type: "png",
            quality: undefined,
            scale: 2,
        }
    ): Promise<Buffer> {
        // 加载 URL 页面
        const page = await this.browser.newPage({
            ...page_options,
            deviceScaleFactor: render_options.scale,
        });
        await page.waitForTimeout(render_options.wait_time);

        // 截图
        const image = await page.screenshot({
            fullPage: true,
            type: render_options.type,
            quality: render_options.quality,
        });

        // 关闭页面
        page.close();

        return image;
    }

    // 渲染文本 HTML 模板
    /**
     * 渲染文本 HTML 模板到图片
     *
     * @param template - HTML 模板
     * @param templates_arg - HTML 模板参数
     * @param page_options - 页面参数 (optional, default: { 'viewport': { 'width': 800, 'height': 600 }, 'base_url': `` }).
     * @param render_options - 渲染选项 (optional, default: { { wait_time: 0, type: "png", quality: undefined, scale: 2 } })
     * @returns - 返回图片的 Buffer
     */
    public async render_template_html(
        template: string,
        templates_arg: Object,
        page_options: PageOptions = {
            viewport: { width: 800, height: 600 },
            base_url: ``,
        },
        render_options: RenderOptions = {
            wait_time: 0,
            type: "png",
            quality: undefined,
            scale: 2,
        }
    ): Promise<Buffer> {
        // 渲染模板
        const html = await render(template, templates_arg, { async: true });

        // 加载 HTML 页面
        const page = await this.browser.newPage({
            ...page_options,
            deviceScaleFactor: render_options.scale,
        });
        await page.setContent(html, { waitUntil: "networkidle" });
        await page.waitForTimeout(render_options.wait_time);

        // 截图
        const image = await page.screenshot({
            fullPage: true,
            type: render_options.type,
            quality: render_options.quality,
        });

        // 关闭页面
        page.close();

        return image;
    }

    // 渲染文本 HTML
    /**
     * 渲染文本 HTML 到图片
     *
     * @param html - HTML 文本
     * @param page_options - 页面参数 (optional, default: { 'viewport': { 'width': 800, 'height': 600 }, 'base_url': `` }).
     * @param render_options - 渲染选项 (optional, default: { { wait_time: 0, type: "png", quality: undefined, scale: 2 } })
     * @returns - 返回图片的 Buffer
     */
    public async render_html(
        html: string,
        page_options: PageOptions = {
            viewport: { width: 800, height: 600 },
            base_url: ``,
        },
        render_options: RenderOptions = {
            wait_time: 0,
            type: "png",
            quality: undefined,
            scale: 2,
        }
    ): Promise<Buffer> {
        // 加载 HTML 页面
        const page = await this.browser.newPage({
            ...page_options,
            deviceScaleFactor: render_options.scale,
        });
        await page.setContent(html, { waitUntil: "networkidle" });
        await page.waitForTimeout(render_options.wait_time);

        // 截图
        const image = await page.screenshot({
            fullPage: true,
            type: render_options.type,
            quality: render_options.quality,
        });

        // 关闭页面
        page.close();

        return image;
    }
}
