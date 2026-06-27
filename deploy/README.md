# 饭饭狸 Docker 部署

## 服务器要求

- Linux 服务器，已安装 Docker 和 Docker Compose v2
- 临时部署至少开放一个前端端口，例如 `8090`
- 推荐准备一个域名，并把 DNS A 记录指向服务器公网 IP

手机浏览器定位需要 HTTPS。没有域名时，推荐先用 `APP_DOMAIN=:80` 和 `WEB_HTTP_PORT=8090` 启动 HTTP 服务，再通过 Cloudflare Tunnel 生成临时 HTTPS 地址。

## 首次部署

```bash
cp deploy/.env.production.example deploy/.env.production
vi deploy/.env.production
docker compose --env-file deploy/.env.production up -d --build
docker compose --env-file deploy/.env.production logs -f
```

必须填写：

- `APP_DOMAIN`：正式域名，例如 `fan.example.com`
- `WEB_HTTP_PORT`：前端对外端口，临时部署可用 `8090`
- `AMAP_API_KEY`：高德 Web 服务 Key
- `OPENAI_COMPATIBLE_API_KEY`：你的 AI 服务 Key
- `OPENAI_COMPATIBLE_BASE_URL`：OpenAI 兼容接口地址
- `OPENAI_COMPATIBLE_MODEL`：模型名
- `SESSION_SECRET`：长随机字符串
- `ADMIN_PASSWORD`：初始管理员密码

## 更新部署

```bash
git pull
docker compose --env-file deploy/.env.production up -d --build
```

## 临时 HTTPS 地址

没有域名时，可以先让前端监听服务器 `8090`：

```env
APP_DOMAIN=:80
WEB_HTTP_PORT=8090
```

启动后用 Cloudflare Tunnel 暴露为临时 HTTPS：

```bash
docker run --rm --network host cloudflare/cloudflared:latest tunnel --url http://127.0.0.1:8090
```

终端里会出现 `https://xxxx.trycloudflare.com`，手机访问这个地址即可。这个终端关闭后临时地址会失效。

## 数据位置

账号、邀请码、常用地点、店铺库会保存到 Docker volume `kaifanli_data`，容器重建不会丢。

备份：

```bash
docker compose --env-file deploy/.env.production exec api cat /data/kaifanli.json > kaifanli-backup.json
```
