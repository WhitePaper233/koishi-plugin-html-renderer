# koishi-plugin-html-renderer

[![npm](https://img.shields.io/npm/v/koishi-plugin-html-renderer?style=flat-square)](https://www.npmjs.com/package/koishi-plugin-html-renderer)

使用EJS和playwright实现的Koishi平台原生HTML渲染插件

# ✨ 功能

- 通过 playwright 截图功能生成 HTML 渲染图片
- 支持 ejs 模板
- TODO: 支持 `markdown` `纯文本`
- TODO: 支持 `CSS` 控制样式

# 使用

```typescript
import { Context, Schema, h } from 'koishi'
import {} from 'koishi-plugin-html-renderer'

export const name = 'html-renderer-test'

export interface Config {}

export const Config: Schema<Config> = Schema.object({})

export const inject = ['html_renderer']

export async function apply(ctx: Context) {
  // write your plugin here
  ctx.on('message', async (session) => {
    if (session.content == 'test') {
      const buffer = await ctx.html_renderer.render_html(__dirname.replaceAll('\\', '/') + '/templates', 'test.ejs', {
        'qid': 114514,
        'username': '田所浩二',
        'days': '12',
        'xp': '114514',
        'increment': '+1',
        'rank': 1,
        'hitokoto': '逸一时误一世',
        'background': 'bg_0.png',
      },
      {
          'viewport': {'width': 600, 'height': 332},
          'base_url': 'file://' + __dirname.replaceAll('\\', '/') + '/templates',
      }
      )
      await session.send(h.image(buffer, 'image/png'))
    }
  })
}
```

