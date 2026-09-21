# Tongnan Website

冬语（Tongnan）的书写系统展示网站 —— 使用 Tongsquare 字体渲染冬语字符。

纯静态站点（HTML + CSS + 字体），无需构建步骤。

## 目录结构

```
browser demo/            ← 本目录即网站根目录（也是 git 仓库根目录）
├── index.html          # 首页
├── 404.html            # 未找到页面
├── style.css           # 样式
├── test.html / test.css  # 测试页
├── fonts/
│   └── TongSquare.woff2  # 冬语字体
├── _headers            # 响应头配置（字体 MIME、缓存）
├── wrangler.toml       # Cloudflare Workers 配置
├── .assetsignore       # 部署时忽略的文件
├── package.json        # npm 脚本（dev / deploy）
├── .gitignore
└── README.md
```

## 本地预览

任选一种方式在本地查看：

```powershell
# 方式 1：Python 内置服务器
python -m http.server 8000

# 方式 2：VS Code "Live Server" 扩展
# 右键 index.html → Open with Live Server
```

然后访问 <http://localhost:8000>。

> 直接双击 `index.html` 也可以，但用本地服务器能更真实地模拟线上下载字体的行为。

## 部署到 Cloudflare Pages

本仓库与 GitHub 个人主页（`<用户名>.github.io`）相互独立，可单独部署到 Cloudflare Pages。
## 部署到 Cloudflare Workers

本仓库与 GitHub 个人主页（`<用户名>.github.io`）相互独立，可单独部署到 Cloudflare。

线上地址：**https://tongnan.yangalan00.workers.dev**

### 方式是"用 wrangler 本地部署"（当前采用）

仓库根目录就是网站根目录，配置文件为 `wrangler.toml`（`[assets]` 静态资源模式）。

**首次准备：**

```powershell
npm install          # 安装 wrangler
npx wrangler login   # 浏览器授权（只需一次）
```

**每次更新：**

```powershell
npm run deploy       # 等价于 wrangler deploy
```

> 也可以先 `npm run dev` 在本地预览（http://localhost:8787）。

4. **绑定自定义域名**：Cloudflare Dashboard → Worker `tongnan` → `Settings` → `Domains & Routes` → `Add` → `Custom domain`，填入你买的域名，Cloudflare 会自动配置 DNS 与免费 HTTPS。

### 关于自动部署（可选）

Cloudflare 也支持连接 GitHub 仓库、push 后自动构建部署。
但截至配置时，Dashboard 自动构建因构建令牌权限问题报 "Authentication error"，
因此当前使用**本地 wrangler 部署**方式，稳定可靠。

## 更新内容

修改 HTML/CSS 后：

```powershell
git add .
git commit -m "Update content"
git push
npm run deploy       # 部署到 Cloudflare
```

`git push` 只更新 GitHub 代码；`npm run deploy` 才真正更新线上网站。

## 字体说明

站点使用 `fonts/TongSquare.woff2`，通过 `@font-face` 加载（见 `style.css`）。
页面中的文字是普通拉丁字母，其视觉形式由冬语字体决定 —— 未加载字体时将退化为普通拉丁字母。
