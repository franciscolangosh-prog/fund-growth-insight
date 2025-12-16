# Fund Growth Insight

一个全面的投资组合分析和市场洞察应用，帮助投资者深入了解投资表现、市场趋势和投资策略。

## 📋 项目简介

Fund Growth Insight 是一个功能丰富的投资组合分析平台，提供：
- **投资组合性能分析** - 深入分析您的投资表现
- **市场洞察** - 基于36年历史数据的市场趋势分析
- **数据管理** - 灵活的数据导入和管理系统
- **自动化市场数据** - 每日自动获取全球市场指数数据

## ✨ 主要功能

### 📊 分析页面 (Analysis)

提供全面的投资组合性能分析，包括：

#### 核心指标
- **当前份额价值** - 实时投资组合价值
- **年化回报率** - 复合年增长率 (CAGR)
- **总回报率** - 累计投资回报
- **相对基准表现** - 与市场基准的对比

#### 可视化分析
- **性能图表** - 投资组合与多个基准指数的对比趋势图
- **年度回报表** - 逐年回报率详细分析
- **相关性分析** - 投资组合与各市场指数的相关性
- **回撤分析** - 最大回撤和回撤恢复时间
- **滚动回报图表** - 不同持有期的滚动回报分析
- **回报分布箱线图** - 按持有期展示回报分布（1年、3年、5年、8年）
- **波动率图表** - 投资组合波动率分析
- **月度回报热力图** - 月度回报的可视化热力图
- **风险调整比较** - 夏普比率、索提诺比率等风险调整指标

#### 深度分析
- **投资分析** - 与全球指数的详细对比
- **投资行为分析** - 投资模式和趋势分析
- **最佳/最差时期** - 识别表现最好和最差的投资时期
- **投资增长计算器** - 模拟不同投资策略的未来价值
- **快速洞察** - 关键发现和建议

### 🌍 市场洞察页面 (Market Insights)

基于36年历史市场数据（1990-2025）的深度分析：

#### 时间治愈分析 (Time Heals)
- **持有期概率分析** - 不同持有期获得正回报的概率
- **回报分布箱线图** - 展示回报分布如何随持有期变化
- **关键洞察** - 时间如何降低投资波动性和不确定性

#### 定投策略 (DCA Strategy)
- **美元成本平均法模拟** - 模拟定期投资策略
- **投资增长可视化** - 展示定投策略的长期效果
- **总投入 vs 最终价值** - 对比分析

#### 最差时机分析 (Worst Timing)
- **年度峰值买入分析** - 如果在每年最高点买入的表现
- **恢复时间分析** - 从峰值恢复到盈利所需时间
- **长期回报** - 即使最差时机买入的长期表现

#### 错过最佳交易日 (Missing Days)
- **市场择时成本** - 错过最佳交易日的财务影响
- **不同场景模拟** - 错过1、5、10、20个最佳交易日的影响
- **详细交易日列表** - 查看错过的具体交易日

#### 年度回报分析 (Yearly Returns)
- **年度回报柱状图** - 逐年回报可视化
- **标准化指数水平** - 以1990年为基准的指数变化
- **统计摘要** - 正负年份统计、平均回报、CAGR

#### 支持的市场指数
- **美国**: S&P 500, NASDAQ
- **中国**: 上证指数 (SHA), 深证成指 (SHE), 沪深300 (CSI 300)
- **香港**: 恒生指数 (Hang Seng)
- **英国**: FTSE 100
- **日本**: 日经225 (Nikkei 225)
- **加拿大**: TSX
- **马来西亚**: KLSE
- **法国**: CAC 40
- **德国**: DAX
- **新加坡**: STI
- **澳大利亚**: ASX 200

### 💾 数据管理页面 (Data Management)

#### 数据导入
- **CSV 文件上传** - 支持批量导入投资组合数据
- **手动数据录入** - 通过表单添加单条记录
- **数据编辑** - 编辑和删除现有记录

#### 投资组合管理
- **多投资组合支持** - 创建和管理多个投资组合
- **投资组合选择器** - 快速切换不同投资组合
- **数据验证** - 自动验证数据完整性和格式

#### 数据迁移
- **市场数据迁移** - 将市场指数数据迁移到集中式表
- **数据迁移面板** - 一键迁移历史数据

#### 自动化任务
- **定时任务管理** - 配置和管理每日市场数据获取任务
- **Cron 任务监控** - 查看定时任务执行状态和日志

## 🛠️ 技术栈

### 前端框架
- **React 18** - 现代化的用户界面库
- **TypeScript** - 类型安全的开发体验
- **Vite** - 快速的构建工具和开发服务器

### UI 组件库
- **shadcn/ui** - 高质量的 React 组件库
- **Tailwind CSS** - 实用优先的 CSS 框架
- **Radix UI** - 无样式、可访问的组件原语
- **Lucide React** - 美观的图标库

### 数据可视化
- **Recharts** - 基于 React 的图表库
- **自定义图表组件** - 箱线图、热力图等

### 后端服务
- **Supabase** - 后端即服务 (BaaS)
  - PostgreSQL 数据库
  - 实时数据同步
  - 边缘函数 (Edge Functions)
  - 自动 API 生成

### 路由和状态管理
- **React Router** - 客户端路由
- **TanStack Query** - 数据获取和缓存

### 其他工具
- **date-fns** - 日期处理库
- **Zod** - 模式验证
- **React Hook Form** - 表单管理

## 🚀 快速开始

### 前置要求

- Node.js 18+ 和 npm
- Supabase 账户和项目

### 安装步骤

1. **克隆仓库**
```bash
git clone <YOUR_GIT_URL>
cd fund-growth-insight
```

2. **安装依赖**
```bash
npm install
```

3. **配置环境变量**

创建 `.env` 文件并配置 Supabase 凭证：
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. **启动开发服务器**
```bash
npm run dev
```

应用将在 `http://localhost:5173` 运行

### 构建生产版本

```bash
npm run build
```

预览生产构建：
```bash
npm run preview
```

## 📁 项目结构

```
fund-growth-insight/
├── src/
│   ├── components/          # React 组件
│   │   ├── ui/              # shadcn/ui 基础组件
│   │   ├── Analysis.tsx      # 分析相关组件
│   │   ├── Charts.tsx       # 图表组件
│   │   └── ...
│   ├── pages/               # 页面组件
│   │   ├── Analysis.tsx     # 分析页面
│   │   ├── MarketInsights.tsx # 市场洞察页面
│   │   ├── DataManagement.tsx # 数据管理页面
│   │   └── NotFound.tsx      # 404 页面
│   ├── utils/               # 工具函数
│   │   ├── portfolioAnalysis.ts    # 投资组合分析逻辑
│   │   ├── portfolioDatabase.ts     # 数据库操作
│   │   ├── marketDataService.ts     # 市场数据服务
│   │   └── marketInsightsAnalysis.ts # 市场洞察分析
│   ├── integrations/        # 第三方集成
│   │   └── supabase/        # Supabase 客户端和类型
│   └── App.tsx              # 应用入口
├── supabase/
│   ├── functions/           # Supabase 边缘函数
│   │   ├── fetch-market-data/    # 获取市场数据
│   │   ├── backfill-market-data/ # 回填历史数据
│   │   └── migrate-market-data/   # 数据迁移
│   └── migrations/          # 数据库迁移文件
├── public/                  # 静态资源
└── package.json            # 项目配置
```

## 🗄️ 数据库架构

### 主要数据表

#### `portfolios`
存储投资组合基本信息
- `id` (UUID) - 主键
- `name` (TEXT) - 投资组合名称
- `created_at` (TIMESTAMP) - 创建时间

#### `portfolio_data`
存储投资组合的每日数据
- `id` (UUID) - 主键
- `portfolio_id` (UUID) - 关联的投资组合
- `date` (DATE) - 交易日期
- `principle` (NUMERIC) - 本金
- `share_value` (NUMERIC) - 份额价值
- `market_value` (NUMERIC) - 市场价值
- 其他计算字段...

#### `market_indices`
集中存储市场指数数据（所有投资组合共享）
- `id` (UUID) - 主键
- `date` (DATE) - 交易日期（唯一）
- `sha`, `she`, `csi300` - 中国指数
- `sp500`, `nasdaq` - 美国指数
- `ftse100`, `hangseng`, `nikkei225` - 其他全球指数
- `created_at`, `updated_at` - 时间戳

## 🔄 数据流程

### 市场数据获取

1. **自动获取** - 每日通过 Supabase Edge Function 自动获取最新市场数据
2. **手动回填** - 使用 `backfill-market-data` 函数回填历史数据
3. **数据迁移** - 从 `portfolio_data` 迁移市场数据到 `market_indices`

### 投资组合数据

1. **CSV 导入** - 上传包含投资组合数据的 CSV 文件
2. **手动录入** - 通过表单添加单条记录
3. **数据编辑** - 编辑或删除现有记录

## 📈 使用指南

### 添加投资组合数据

1. 导航到 **数据管理** 页面
2. 选择或创建投资组合
3. 上传 CSV 文件或使用表单添加记录
4. CSV 格式应包含：日期、本金、份额价值等字段

### 查看分析

1. 导航到 **分析** 页面
2. 选择要分析的投资组合
3. 查看各种图表和指标
4. 对比不同基准指数的表现

### 探索市场洞察

1. 导航到 **市场洞察** 页面
2. 选择要分析的市场指数
3. 探索不同标签页：
   - **时间治愈** - 了解持有期的重要性
   - **定投策略** - 模拟定期投资效果
   - **最差时机** - 了解市场恢复能力
   - **错过最佳交易日** - 理解市场择时的成本
   - **年度回报** - 查看历史年度表现

## 🔧 开发

### 代码规范

项目使用 ESLint 进行代码检查：
```bash
npm run lint
```

### 类型检查

TypeScript 提供完整的类型安全：
```bash
npx tsc --noEmit
```

## 📝 相关文档

- [市场数据架构设置指南](./MARKET_DATA_SETUP.md) - 详细的数据库架构和设置说明
- [Supabase 文档](https://supabase.com/docs)
- [shadcn/ui 文档](https://ui.shadcn.com)

## 🚢 部署

### Netlify 部署

项目已配置 `netlify.toml`，可以直接部署到 Netlify：

1. 连接 GitHub 仓库到 Netlify
2. 配置环境变量
3. 自动部署

### 其他平台

构建生产版本后，可以将 `dist` 目录部署到任何静态托管服务：
- Vercel
- GitHub Pages
- Cloudflare Pages
- AWS S3 + CloudFront

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

本项目采用 MIT 许可证。

## 🙏 致谢

- [shadcn/ui](https://ui.shadcn.com) - 优秀的组件库
- [Supabase](https://supabase.com) - 强大的后端服务
- [Recharts](https://recharts.org) - 图表库

---

**注意**: 本项目仅用于教育和分析目的，不构成投资建议。投资有风险，请谨慎决策。
