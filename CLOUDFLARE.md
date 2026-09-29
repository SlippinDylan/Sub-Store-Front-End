# Cloudflare Workers 部署

本分支把 Sub-Store 官方 Vue PWA 部署成纯静态 Cloudflare Worker。它只提供 WebUI，不保存订阅数据，也不代理后端请求。

上游仓库是 [sub-store-org/Sub-Store-Front-End](https://github.com/sub-store-org/Sub-Store-Front-End)，继续遵循 GPL-3.0 许可证。

```text
WebUI Worker
  → HTML / CSS / JavaScript / PWA Service Worker
  → 浏览器直接请求独立的 Sub-Store 后端 Worker
```

## 安装与验证

Node.js 版本以 `.node-version` 为准，并使用仓库锁定的 pnpm：

```bash
corepack enable
pnpm install --frozen-lockfile
pnpm check:locales
pnpm check:worker
```

`check:worker` 会使用 `.env.worker` 构建前端，然后通过 Wrangler dry-run 验证 Static Assets 配置和全部静态文件。

Worker 模式不启用离线 PWA 全量预缓存。它会生成一个一次性 Service Worker，用于注销旧版本并清理已有 PWA 缓存，避免首次访问在后台下载整套编辑器、字体和图片。官方普通构建的 PWA 行为不受影响。

本地运行 Worker：

```bash
pnpm dev:worker
```

Wrangler 会先执行 `pnpm build:worker`，然后提供本地 Static Assets Worker。Vue Router 使用 history 模式，`wrangler.jsonc` 已配置 SPA fallback，直接打开 `/subs`、`/files` 等路由也会返回 `index.html`。

## 连接后端

Worker 构建不会把后端私密管理路径写进公开的 JavaScript。首次打开 WebUI 时，在后端配置对话框中填写：

```text
https://<后端 Worker 域名>/<私密管理路径>
```

例如：

```text
https://sub-store-api.example.workers.dev/<私密管理路径>
```

配置完成后，前端会将地址保存在当前浏览器的 Local Storage。不要通过 `?api=` 查询参数传递私密管理路径：当前上游前端不会自动清理该参数，URL 编码也不提供保密性，路径会留在浏览器历史、复制链接和可能的 URL 日志中。

不要把 `SUB_STORE_FRONTEND_BACKEND_PATH` 的真实值写入本仓库、`.env.worker`、Cloudflare 前端构建变量或静态文件。前端 Worker 是公开资源，任何编译进产物的内容都能被访问者读取。

后端需要把前端 Worker 的完整 Origin 加入 `SUB_STORE_CORS_ALLOWED_ORIGINS`，例如：

```text
https://sub-store-frontend.example.workers.dev
```

只填写 Origin：包含 `https://` 和主机名，不包含路径、查询参数或末尾 `/`。

可以在后端 Worker 的 Dashboard 中设置普通 Text 变量：

```text
Workers & Pages
→ 选择后端 Worker
→ Settings
→ Variables and Secrets
→ Add
→ Text

名称：SUB_STORE_CORS_ALLOWED_ORIGINS
值：https://<前端 Worker 域名>
```

也可以在后端仓库使用 Wrangler 设置同名 Secret：

```bash
cd backend
pnpm wrangler secret put SUB_STORE_CORS_ALLOWED_ORIGINS --env=''
```

Secret 提示中同样只填写前端 Origin。该值本身不敏感，Dashboard 使用 Text 类型即可。

## Cloudflare Dashboard Git 部署

在 Workers & Pages 中创建应用并连接 GitHub：

```text
Git 仓库：SlippinDylan/Sub-Store-Front-End
生产分支：worker
根目录：留空
构建命令：pnpm build:worker
部署命令：pnpm wrangler deploy
```

Workers Builds 不读取 `wrangler.jsonc` 中的 Custom Build 命令，因此 Dashboard 的“构建命令”不能省略。部署命令会使用 `package.json` 中锁定的 Wrangler 版本。

## Wrangler 手动部署

```bash
pnpm wrangler login
pnpm deploy:worker
```

部署完成后会获得独立的 WebUI 地址，例如：

```text
https://sub-store-frontend.<账户子域>.workers.dev
```

订阅链接仍由后端 Worker 的 `/share/*?token=...` 提供，与前端 Worker 地址无关。

## 同步上游

`master` 只跟踪 `sub-store-org/Sub-Store-Front-End`，Cloudflare 适配保留在 `worker`：

```bash
git switch master
git fetch upstream
git merge --ff-only upstream/master

git switch worker
git merge master
pnpm install --frozen-lockfile
pnpm check:locales
pnpm check:worker
```

发现官方前端更新后，再人工执行上述合并和验证。仓库不会定时检查或自动合并上游。

Cloudflare 官方资料：

- [Workers Static Assets](https://developers.cloudflare.com/workers/static-assets/)
- [SPA 路由](https://developers.cloudflare.com/workers/static-assets/routing/single-page-application/)
- [Workers Builds 配置](https://developers.cloudflare.com/workers/ci-cd/builds/configuration/)
- [Wrangler 配置](https://developers.cloudflare.com/workers/wrangler/configuration/)
