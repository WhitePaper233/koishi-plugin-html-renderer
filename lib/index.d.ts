import { Context, Schema } from "koishi";
import { HTMLRenderer, RendererOptions } from "./renderer";
declare module "koishi" {
    interface Context {
        html_renderer: HTMLRenderer;
    }
}
export declare const Config: Schema<RendererOptions>;
export declare const name = "html_renderer";
export declare function apply(ctx: Context, config: RendererOptions): void;
export * from "./renderer";
