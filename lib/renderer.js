"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HTMLRenderer = void 0;
const ejs_1 = require("ejs");
const promises_1 = require("fs/promises");
const fs_1 = require("fs");
const playwright_1 = require("playwright");
const koishi_1 = require("koishi");
const child_process_1 = require("child_process");
const util_1 = require("util");
// HTML 渲染器服务类
class HTMLRenderer extends koishi_1.Service {
    // 浏览器对象
    browser;
    // 选项
    options = {
        renderer_browser: "",
        browser_download_host: "",
        browser_proxy_host: "",
        browser_channel: "",
    };
    // 构造方法
    constructor(ctx, renderer_options) {
        super(ctx, "html_renderer", true);
        // 初始化日志
        this.logger = this.ctx.logger("html_renderer");
        // 初始化配置
        this.options = Object.assign(this.options, renderer_options);
    }
    // 声明周期函数
    // 启动
    async start() {
        // 检查浏览器是否安装
        let browser_exsit = false;
        switch (this.options.renderer_browser) {
            case 'firefox': {
                browser_exsit = (0, fs_1.existsSync)(playwright_1.firefox.executablePath());
                break;
            }
            case 'webkit': {
                browser_exsit = (0, fs_1.existsSync)(playwright_1.webkit.executablePath());
                break;
            }
            default: {
                browser_exsit = (0, fs_1.existsSync)(playwright_1.chromium.executablePath());
                break;
            }
        }
        if (!browser_exsit) {
            this.logger.info("未检测到浏览器，即将安装浏览器");
            await this.install_browser();
        }
        // 配置启动参数
        const launch_options = {};
        if (this.options.browser_proxy_host) {
            launch_options.proxy.server = this.options.browser_proxy_host;
        }
        if (this.options.browser_channel) {
            launch_options.channel = this.options.browser_channel;
        }
        // 启动浏览器
        this.logger.debug("正在启动浏览器...");
        if (this.options.renderer_browser === "firefox") {
            this.logger.debug("正在以 firefox 浏览器启动服务");
            this.browser = await playwright_1.firefox.launch(launch_options);
        }
        else if (this.options.renderer_browser === "webkit") {
            this.logger.debug("正在以 webkit 浏览器启动服务");
            this.browser = await playwright_1.webkit.launch(launch_options);
        }
        else {
            this.logger.debug("正在以 chromium 浏览器启动服务");
            this.browser = await playwright_1.chromium.launch(launch_options);
        }
    }
    // 停止
    async stop() {
        // 关闭浏览器
        this.logger.debug("正在关闭浏览器...");
        await this.browser?.close();
    }
    // 渲染方法
    // 渲染HTML
    /**
     * 渲染 HTML 模板到图片
     *
     * @param template_path - HTML 模板路径
     * @param template_name - HTML 模板文件名
     * @param templates_args - HTML 模板参数
     * @param page_args - 页面参数 (optional, default: { 'viewport': { 'width': 800, 'height': 600 }, 'base_url': `file://${process.cwd()}/templates/` }).
     * @param wait_time - 页面加载等待时间 (optional, default: 0).
     * @param type - 输出图片类型 (optional, default: 'png').
     * @param quality - 输出图片质量 type 为 'png' 时无效 (optional, default: undefined).
     * @param scale - 输出图片缩放 (optional, default: 2).
     * @returns - 返回图片的 Buffer
     */
    async render_html(template_path, template_name, templates_arg, page_args = {
        viewport: { width: 800, height: 600 },
        base_url: `file://${process.cwd()}/templates/`,
    }, wait_time = 0, type = "png", quality = undefined, scale = 2) {
        // 读取模板文件
        let template;
        await (0, promises_1.readFile)(`${template_path}/${template_name}`, "utf-8")
            .then((data) => {
            template = data;
        })
            .catch((error) => {
            this.logger.error(`读取模板文件失败: ${error.message}`);
            throw error;
        });
        // 渲染模板
        const html = await (0, ejs_1.render)(template, templates_arg, { async: true });
        // 加载HTML页面
        const page = await this.browser.newPage({
            viewport: page_args.viewport,
            baseURL: page_args.base_url,
            deviceScaleFactor: scale,
        });
        await page.goto(template_path);
        await page.setContent(html, { waitUntil: "networkidle" });
        await page.waitForTimeout(wait_time);
        // 截图
        const image = await page.screenshot({
            fullPage: true,
            type: type,
            quality: quality,
        });
        return image;
    }
    // 安装浏览器
    async install_browser() {
        // 如果设置了镜像源 则使用镜像源下载 否则使用默认源下载
        if (this.options.browser_download_host) {
            // 设置环境变量
            process.env.PLAYWRIGHT_DOWNLOAD_HOST = this.options.browser_download_host;
        }
        else {
            // 设置环境变量
            process.env.PLAYWRIGHT_DOWNLOAD_HOST =
                "https://npmmirror.com/mirrors/playwright/";
        }
        // 如果设置了代理 则使用代理下载
        if (this.options.browser_proxy_host) {
            // 设置环境变量
            process.env.HTTP_PROXY = this.options.browser_proxy_host;
            process.env.HTTPS_PROXY = this.options.browser_proxy_host;
        }
        let install_command = "npx playwright install";
        // 如果设置了火狐浏览器 则安装火狐浏览器 否则安装chromium
        let browser_type;
        switch (this.options.renderer_browser) {
            case 'firefox': {
                browser_type = 'firefox';
                break;
            }
            case 'webkit': {
                browser_type = 'webkit';
                break;
            }
            default: {
                browser_type = 'chromium';
                break;
            }
        }
        install_command += ` ${browser_type}`;
        // 执行安装命令
        this.logger.info(`正在安装浏览器: ${browser_type}`);
        try {
            await (0, util_1.promisify)(child_process_1.exec)(install_command);
        }
        catch (error) {
            this.logger.error(`安装浏览器失败: ${error.message}`);
            throw error;
        }
        this.logger.info(`浏览器: ${browser_type} 安装成功`);
    }
}
exports.HTMLRenderer = HTMLRenderer;
