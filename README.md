# 开饭狸

开饭狸是一个微信小程序 MVP，用当前位置、口味偏好和附近餐厅数据，帮用户快速决定今天吃什么。

## 本地开发

1. 安装依赖：`npm install`
2. 复制后端配置：`Copy-Item server/.env.example server/.env`
3. 在 `server/.env` 中填写高德 Key 和 OpenAI-compatible Key
4. 启动后端：`npm run dev:server`
5. 用微信开发者工具打开 `miniprogram/`

真实微信 AppID 通过微信开发者工具或 `miniprogram/project.private.config.json` 本地配置，不提交到仓库。
