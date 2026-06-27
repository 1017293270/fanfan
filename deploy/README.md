# 饭饭狸 Docker 部署

## 服务器要求

- Linux 服务器，已安装 Docker 和 Docker Compose v2
- 80/443 端口开放
- 推荐准备一个域名，并把 DNS A 记录指向服务器公网 IP

手机浏览器定位需要 HTTPS。没有域名也能用 `APP_DOMAIN=:80` 临时 HTTP 部署，但移动端定位通常会被浏览器拦截。

## 首次部署

```bash
cp deploy/.env.production.example deploy/.env.production
vi deploy/.env.production
docker compose --env-file deploy/.env.production up -d --build
docker compose --env-file deploy/.env.production logs -f
```

必须填写：

- `APP_DOMAIN`：正式域名，例如 `fan.example.com`
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

## 数据位置

账号、邀请码、常用地点、店铺库会保存到 Docker volume `kaifanli_data`，容器重建不会丢。

备份：

```bash
docker compose --env-file deploy/.env.production exec api cat /data/kaifanli.json > kaifanli-backup.json
```
