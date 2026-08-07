# CNB 小网盘

一个简洁、安全的轻量级小网盘应用，支持密码验证、拖拽上传、图片压缩、相册管理和在线预览，运行在腾讯云 EdgeOne Pages 上，文件存储在 CNB(cnb.cool)对象存储中。

> 本项目为 `wujinpai/cnb` 的二次开发版本，在修复线上部署问题的基础上进行了功能增强，适合个人网盘自用。

## 功能特性

- 🔐 密码验证 - 安全访问控制
- 📤 拖拽上传 - 支持拖拽或点击上传，支持多文件与上传进度
- 🗜️ 图片压缩 - 超大图片（超过 1920×1080）上传前自动等比缩小并转为 WebP，GIF 动图自动跳过
- 🖼️ 相册管理 - 图片/视频/音频网格展示，按时间倒序
- 🔍 在线预览 - 全屏预览（图片 / 视频 / 音频播放），支持键盘导航（← / → / Esc）
- 📋 链接复制 - 一键复制直链 / Markdown / HTML 引用
- 🗑️ 文件管理 - 支持删除文件
- 📚 API 文档 - 首页内置接口文档，方便对接第三方
- 🌙 主题切换 - 支持明暗主题
- 🎵 音频支持 - 支持 mp3 / wav / ogg / m4a / aac / flac 上传与在线播放
- 📦 不限大小 - 单文件大小不做前端限制（受 CNB 对象存储自身限制）

## 技术栈

- **前端**: Vue 3 + TypeScript + Vite + TailwindCSS + Pinia
- **后端**: Edge Functions（腾讯云 EdgeOne Pages）
- **存储**: CNB / cnb.cool 对象存储（永久直链，图片与视频分离存储）

## API 文档

所有接口返回统一 JSON 结构：`{ "code": 0, "msg": "ok", "data": ... }`，`code` 为 `0` 表示成功。

### 1. 验证密码

```
POST /api/auth/verify
Content-Type: application/json

{
  "password": "你的密码"
}
```

- 成功：`{ "code": 0, "msg": "ok", "data": { "success": true } }`
- 密码错误：`401` `{ "code": 401, "msg": "wrong password" }`
- 服务器未配置密码：`{ "code": 400, "msg": "server password not configured" }`

### 2. 获取上传签名

前端上传前先调用，获取对象存储的上传地址（`upload_url`）与已经随机重命名的文件名（`safeFileName`）。图片走图片桶；视频（mp4/mov/mkv/webm/m4v/3gp/avi）与音频（mp3/wav/ogg/m4a/aac/flac）自动分流到文件桶。

```
GET /api/upload/sign?name=example.png&size=10240
```

- 缺少参数：`{ "code": 400, "msg": "missing name or size param" }`
- 成功：`{ "code": 0, "data": { "upload_url": "...", "assets": {...}, "safeFileName": "..." } }`

### 3. 上传文件（经 EdgeOne 转发至 CNB）

获取签名后，浏览器将文件二进制 **POST** 到本站 `/api/upload/put`，由 EdgeOne Edge Function 服务端转发至 CNB 对象存储，避免跨域限制。

```
POST /api/upload/put?upload_url=<签名返回的URL>
Content-Type: application/octet-stream

<文件二进制>
```

- 成功：`{ "code": 0, "msg": "ok" }`
- 上传失败：非 `2xx`，错误详情在 `msg` 中

### 4. 获取文件列表

```
GET /api/files
```

- 成功：`{ "code": 0, "data": [ { "id": "...", "key": "...", "url": "/img-api/...", "name": "x.png", "size": 123, "type": "image/png", "createdAt": "..." } ] }`（按创建时间倒序）

### 5. 删除文件

```
DELETE /api/file?path=<文件的 key（含 /-/imgs/ 或 /-/files/）>
```

- 成功：`{ "code": 0, "msg": "ok" }`
- 缺少参数：`{ "code": 400, "msg": "missing path param" }`
- 路径无效：`{ "code": 400, "msg": "invalid path" }`

### 6. 访问图片 / 视频直链

```
GET /img-api/<mediaPath>
```

`mediaPath` 是文件在存储中的路径（列表接口 `url` 字段的 `\"/img-api/\"` 之后部分），支持 CDN 加速。

## 快速开始

### 环境要求

- Node.js >= 20.0.0
- pnpm >= 10.0.0

### 安装

```bash
pnpm install
```

### 开发

```bash
pnpm dev
```

### 构建

```bash
pnpm build
```

## 环境变量（Edge Functions 绑定）

在 EdgeOne Pages 环境中配置以下变量：

| 变量 | 说明 |
|------|------|
| `UPLOAD_PASSWORD` | 上传访问密码（`/api/auth/verify` 校验） |
| `SLUG_IMG` | cnb.cool 存储库路径，默认 `wujinpai/cnbimg` |
| `TOKEN_IMG` | cnb.cool 访问令牌（读/写存储） |

## 部署

部署到腾讯云 EdgeOne Pages（Git 集成，推 main 自动构建部署）：

1. `dist/` → Pages 静态站点（见 `edgeone.json` 的 `outputDirectory`）
2. `edge-functions/**` → Edge Functions（自动部署到对应路由）
3. 配置上述环境变量后即可使用

## 许可证

MIT