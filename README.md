# MemoFlow AI

一个极简风格的记录网站，包含全局搜索和三个核心功能：

- 全局搜索：可搜索 TODO、笔记和朋友圈动态。
- `TODOlist`：把自然语言整理成待办事项，右侧会按今天、明天、本周、未定时间、已完成分区；每条支持完成、编辑、删除，也支持输入“删除开会”“把开会改成 6.3 20:00 复盘”等指令。
- `随时笔记`：不调用 AI，直接写笔记，可选择学习笔记、随笔文摘、冲浪心得等分类；保存后在右侧列表展示分类、标题、日期和时间，可点击继续编辑、删除，或一键转为 TODO。
- `朋友圈`：像微信朋友圈一样发布本地动态，支持文字和可选图片链接，可删除。

## 使用方法

直接打开 `index.html` 即可体验。没有填写 API Key 时，TODOlist 会使用本地演示整理逻辑。

如需连接真实 AI：

1. 点击页面右上角的“API 设置”。
2. 推荐选择“本地安全代理”，也可以选择 OpenAI / ChatGPT、DeepSeek 或自定义兼容接口。
3. 填入 API Key、模型名和接口地址。
4. 保存后输入内容并点击“开始整理”。

对话变长后，聊天区域会在固定高度里自动滚动，旧消息会上划保留。TODOlist 会优先按“日期 时间 事件”的格式输出。

## 本地安全代理

更推荐用 `server.js` 运行本地代理，让 API Key 留在服务端环境变量里：

```powershell
$env:AI_PROVIDER="openai"
$env:AI_API_KEY="你的 API Key"
$env:AI_MODEL="gpt-4.1-mini"
node server.js
```

DeepSeek 示例：

```powershell
$env:AI_PROVIDER="deepseek"
$env:AI_API_KEY="你的 API Key"
$env:AI_MODEL="deepseek-chat"
node server.js
```

然后打开 `http://localhost:8787`。

## 安全提示

浏览器直连模式只适合本地调试。正式部署时建议增加后端接口，由后端保存密钥并转发请求。



