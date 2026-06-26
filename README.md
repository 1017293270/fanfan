# 开饭狸

开饭狸是一个微信小程序 + H5 MVP，用当前位置、口味偏好、账号专属常用地点和店铺库，帮用户快速决定今天吃什么。

## 本地开发

1. 安装依赖：`npm install`
2. 复制后端配置：`Copy-Item server/.env.example server/.env`
3. 在 `server/.env` 中填写高德 Key、OpenAI-compatible Key、管理员账号和邀请码配置
4. 启动后端：`npm run dev:server`
5. 启动 H5：`npm run dev:h5`
6. 打开 H5：`http://127.0.0.1:5173/`
7. 用微信开发者工具打开 `miniprogram/`

真实微信 AppID 通过微信开发者工具或 `miniprogram/project.private.config.json` 本地配置，不提交到仓库。
本地开发默认关闭微信开发者工具的 request 合法域名校验，以便请求 `http://127.0.0.1:8787`；上线或真机生产测试时需要部署 HTTPS 后端并在小程序后台配置合法域名。

## H5 账号体系

- 默认后端地址：`http://127.0.0.1:8787`
- 默认 H5 地址：`http://127.0.0.1:5173/`
- 默认管理员：`admin`
- 默认管理员密码：`change-me-local-admin`
- 默认邀请码：`FANFAN-START`

H5 支持账号密码登录、邀请码注册、管理员查看账号/发放邀请码、常用地点管理、个人店铺库管理，以及从高德附近餐厅拉取后加入自己的店铺库。每个账号的数据保存在自己的库里，推荐时会优先使用当前位置附近的常用地点和对应店铺。

## 设计资产

- 品牌头像：`assets/brand/kaifanli-avatar-144.png`
- 首页 UI 参考图：`assets/design/kaifanli-home-reference.png`
- 饭饭狸 image2 素材板：`assets/design/kaifanli-brand-kit-sheet.png`
- 小组件图标总览：`assets/design/kaifanli-icon-contact-sheet.png`
- 小程序运行时图标：`miniprogram/assets/icons/`
- H5 设计 QA 截图：`assets/design/qa/h5-*.png`

## 验证清单

- `npm test`
- `npm run build:server`
- `npm run build:h5`
- `Invoke-RestMethod -Uri http://127.0.0.1:8787/health`
- 浏览器打开 `http://127.0.0.1:5173/` 后，登录、推荐、地点、店铺、高德导入和管理员页面能正常切换
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
SESSION_SECRET=本地会话密钥
DATA_FILE_PATH=.data/kaifanli-dev.json
ADMIN_USERNAME=admin
ADMIN_PASSWORD=change-me-local-admin
ADMIN_DISPLAY_NAME=饭饭狸管理员
INITIAL_INVITE_CODE=FANFAN-START
NODE_ENV=development
```

小程序真实 AppID 只放在 `miniprogram/project.private.config.json` 或微信开发者工具本地设置里。
