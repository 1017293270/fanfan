# 开饭狸

开饭狸是一个微信小程序 MVP，用当前位置、口味偏好和附近餐厅数据，帮用户快速决定今天吃什么。

## 本地开发

1. 安装依赖：`npm install`
2. 复制后端配置：`Copy-Item server/.env.example server/.env`
3. 在 `server/.env` 中填写高德 Key 和 OpenAI-compatible Key
4. 启动后端：`npm run dev:server`
5. 用微信开发者工具打开 `miniprogram/`

真实微信 AppID 通过微信开发者工具或 `miniprogram/project.private.config.json` 本地配置，不提交到仓库。

## 验证清单

- `npm test`
- `npm run build:server`
- `Invoke-RestMethod -Uri http://127.0.0.1:8787/health`
- 微信开发者工具打开 `E:\fanzainai\miniprogram` 后，首页能显示开饭狸头像、偏好输入、筛选芯片和推荐按钮
- 填写偏好并点击“让饭饭狸拍板”后，能看到 1 个主推荐和备选餐厅

## 本地私有配置

后端密钥只放在 `server/.env`：

```env
API_PORT=8787
AMAP_API_KEY=你的高德 Key
OPENAI_COMPATIBLE_API_KEY=你的 AI Key
OPENAI_COMPATIBLE_BASE_URL=你的 OpenAI-compatible Base URL
OPENAI_COMPATIBLE_MODEL=你的模型名
NODE_ENV=development
```

小程序真实 AppID 只放在 `miniprogram/project.private.config.json` 或微信开发者工具本地设置里。
