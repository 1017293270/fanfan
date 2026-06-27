# syntax=docker/dockerfile:1

FROM node:22-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
COPY server/package.json server/package.json
COPY h5/package.json h5/package.json
RUN npm ci

COPY . .
RUN npm --workspace server run build
RUN npm --workspace h5 run build

FROM node:22-alpine AS server
WORKDIR /app

ENV NODE_ENV=production
ENV API_PORT=8787
ENV DATA_FILE_PATH=/data/kaifanli.json

COPY package.json package-lock.json ./
COPY server/package.json server/package.json
COPY h5/package.json h5/package.json
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=build /app/server/dist server/dist

EXPOSE 8787
CMD ["npm", "--workspace", "server", "run", "start"]

FROM caddy:2-alpine AS web
COPY deploy/Caddyfile /etc/caddy/Caddyfile
COPY --from=build /app/h5/dist /srv
