# 宝宝起名助手

一个基于 **Vue 3 + Element Plus + Vite** 前端与 **Node.js (Express)** 后端的起名网站，支持输入姓氏、选择性别、出生时间、名字长度以及取名风格，调用 DeepSeek 大模型智能生成宝宝名字。当 DeepSeek 接口不可用时，后端会自动返回本地示例名字，确保体验可用。

## 功能亮点

- 🌟 姓氏锁定：支持锁定姓氏，确保多次生成结果保持一致。
- ⚧ 可选性别：提供男孩、女孩、不限三种选项，可自由选择。
- 🕒 精准出生时间：支持到秒的日期时间选择，便于结合生辰八字分析。
- 🔤 名字字数：支持 1~3 字的名字长度需求。
- 📚 风格偏好：可选 “生辰八字”“诗经”“唐诗宋词” 三种灵感来源。
- 🤖 DeepSeek 智能生成：调用大模型生成多个候选名字及寓意说明，解析失败或无密钥时使用内置示例兜底。
- 📝 历史记录：前端保留最近 10 次生成记录，方便对比挑选。

## 目录结构

```
├── backend            # Node.js 后端服务
│   ├── package.json
│   ├── .env.example   # DeepSeek 配置示例
│   └── src
│       └── server.js  # API 入口
├── frontend           # Vue 3 + Vite 前端项目
│   ├── package.json
│   ├── index.html
│   └── src
│       ├── App.vue
│       ├── main.js
│       └── style.css
├── scripts            # 常用执行脚本
│   ├── dev.sh         # 同时启动前后端
│   └── setup.sh       # 安装前后端依赖
└── README.md
```

## 环境要求

- Node.js ≥ 18（推荐 20+，已验证 Node 22）
- npm ≥ 9
- （可选）DeepSeek API Key

## 快速开始

1. **安装依赖**（需联网）：

   ```bash
   ./scripts/setup.sh
   ```

   如果网络限制导致安装失败，可分别进入 `frontend` 与 `backend` 目录执行 `npm install`，或配置企业 NPM 镜像。

2. **配置 DeepSeek 密钥**：

   ```bash
   cp backend/.env.example backend/.env
   # 编辑 backend/.env，填入 DEEPSEEK_API_KEY=你的密钥
   ```

   未配置密钥时，后端会返回示例名字与说明，方便本地演示。

3. **启动开发环境**：

   ```bash
   ./scripts/dev.sh
   ```

   该脚本会在后台启动后端（默认端口 `3000`），并在当前终端运行前端 Vite 开发服务器（默认端口 `5173`）。按 `Ctrl + C` 退出时脚本会自动关闭后端进程。

4. 打开浏览器访问 [http://localhost:5173](http://localhost:5173)，体验宝宝起名助手。

## API 说明

- `POST /api/generate-name`
  - 请求体
    ```json
    {
      "surname": "张",
      "gender": "male",          // 可选：male / female / null
      "birthDateTime": "2024-08-08 12:30:00", // 可选
      "nameLength": 2,             // 1~3
      "style": "唐诗宋词"         // 生辰八字 / 诗经 / 唐诗宋词
    }
    ```
  - 响应体
    ```json
    {
      "surname": "张",
      "suggestions": [
        {
          "fullName": "张若兮",
          "givenName": "若兮",
          "meaning": "含义说明",
          "styleNotes": "风格点评"
        }
      ],
      "summary": "整体点评",
      "source": "deepseek" // 或 mock
    }
    ```

## 自定义配置

- 调整服务器端口：在运行前设置 `PORT` 环境变量，例如 `PORT=4000 npm run start --prefix backend`。
- 指定 DeepSeek 其它模型或自定义网关：在 `.env` 中设置 `DEEPSEEK_MODEL` 与 `DEEPSEEK_API_URL`。
- 生产部署可运行 `npm run build --prefix frontend` 生成静态资源，并使用反向代理（Nginx、Caddy 等）部署前端，将 `/api` 转发到 Node.js 服务。

## 常见问题

- **如何处理无法访问 npm 官方仓库？**
  - 可以设置 `npm config set registry https://registry.npmmirror.com` 等镜像源后再运行脚本。
- **DeepSeek 返回格式异常怎么办？**
  - 后端会自动记录日志并返回内置示例数据。可根据需要优化 prompt 或在解析失败时提示用户稍后重试。
- **是否可以拓展风格？**
  - 可以在前端 `styleOptions` 与后端 `stylePrompts`/`mockCharacterPool` 中新增选项并同步 prompt。

## 授权协议

本项目示例代码可用于学习、演示及企业内部 PoC，若用于商业化请自行确认 DeepSeek API 的使用许可与计费规则。
