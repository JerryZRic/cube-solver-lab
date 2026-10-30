# 验证记录

2026-10-30，Node 24 / Vite 7.3.7 / Vitest 5.0.5。

- `npm test`：48/48 通过（2 files）。
- 18 种单步记号与独立 cubejs 模型逐项一致；转动四次/逆操作恢复；2000 次整数转动无漂移。
- 6 组 seeded 打乱后额外手动编辑，使用真实当前状态求解并检查最终复原。
- worker 消息 ID 与非法单棱翻转、单角扭转、奇排列拒绝。
- `npm run build`：TypeScript 与生产静态包构建通过；主 bundle 约 515 KB（gzip 132 KB）。
- `npm audit`：全部依赖 0 vulnerabilities（此日期 registry 返回结果）。
- 云端 Chromium 实际 UI 验证：20 步打乱、额外手动 R 转动、worker 返回 21 步解、向前/向后单步、暂停、3× 回放、最终 21/21 且六面均匀复原；打乱途中复原、求解请求后立即复原。
- **验证限制**：云端浏览器 GPU/WebGL 被禁用（GL_VENDOR / GL_RENDERER = Disabled）。上述浏览器操作在应用的二维降级模式中完成。3D WebGL 像素、真实转层动画、点按面/触控拖拽与移动端实机未验证。没有宣称完整跨浏览器验收。

生产 worker 独立打包，通过相对 URL 加载；发布后继续检查部署与 worker 求解。首次求解可能数秒；不承诺最优步数。
