# Umami Dashboard

EchoPie 的 Umami 数据分析仪表盘

## 功能

- 📊 **实时数据展示**: 新用户、日活、周活、月活
- 💰 **购买数据分析**: 月度/年度/终身购买统计
- 📈 **趋势图表**: 7/30/90 天数据趋势
- 🔄 **自动刷新**: 实时获取最新数据

## 技术栈

- Next.js 16 + TypeScript
- Tailwind CSS + shadcn/ui
- Recharts 图表库
- Umami API

## 部署

### 方式一: Vercel 一键部署 (推荐)

点击以下按钮直接部署:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/clawdoo/umami-dashboard)

然后配置环境变量:
- `UMAMI_URL`: https://ubm.echopie.com
- `UMAMI_USERNAME`: admin
- `UMAMI_PASSWORD`: umami

### 方式二: CLI 部署

```bash
vercel --prod
```

## 本地开发

```bash
npm install
npm run dev
```

访问 http://localhost:3000

## API 接口

- `GET /api/umami?range=7` - 获取数据 (range: 7, 30, 90)

## GitHub

https://github.com/clawdoo/umami-dashboard
