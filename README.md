# Investment Portfolio Assistant Chrome Extension

## 功能简介

Investment Portfolio Assistant 是一个功能强大的 Chrome 扩展程序，帮助投资者进行投资组合管理和分析。

### 主要特性

- 🔄 自动定投管理
- 📊 投资组合分析
- ⚖️ 智能再平衡
- 📈 技术指标分析
- 🔔 定投提醒
- 💹 实时市场监控

## 安装指南

### 开发者安装
1. 克隆仓库
```bash
git clone https://github.com/yourusername/investment-portfolio-assistant.git
cd investment-portfolio-assistant
```

2. 安装依赖
```bash
npm install
```

3. 在 Chrome 中加载扩展
- 打开 Chrome 浏览器
- 访问 chrome://extensions/
- 启用"开发者模式"
- 点击"加载已解压的扩展程序"
- 选择项目目录

### 用户安装
1. 访问 [Chrome Web Store](#)
2. 点击"添加到 Chrome"
3. 确认安装

## 使用说明

### 基础功能
1. **定投管理**
   - 设置定投计划
   - 自动执行定投
   - 查看定投历史

2. **投资组合分析**
   - 资产配置分析
   - 收益率计算
   - 风险评估

3. **再平衡功能**
   - 设置再平衡规则
   - 自动触发再平衡
   - 再平衡历史记录

### 高级功能
1. **技术分析**
   - 移动平均线
   - MACD 指标
   - RSI 指标

2. **市场监控**
   - 实时价格提醒
   - 市场开盘提醒
   - 自定义价格预警

## 项目结构

```
investment-extension/
├── manifest.json           # 扩展程序配置文件
├── popup/                  # 弹出窗口相关文件
│   ├── popup.html         # 弹出窗口HTML
│   ├── popup.css          # 弹出窗口样式
│   └── popup.js           # 弹出窗口逻辑
├── background/            # 后台脚本
│   └── background.js      # 后台服务
├── content/              # 内容脚本
│   └── content.js        # 页面注入脚本
├── lib/                  # 第三方库
│   ├── yahoo-finance.js  # Yahoo Finance API封装
│   ├── charts.js         # 图表库
│   ├── data-processing.js # 数据处理库
│   ├── config.js         # 配置管理
│   ├── storage.js        # 存储管理
│   └── utils.js          # 工具函数
└── assets/               # 静态资源
    └── icons/            # 图标资源
```

## 配置说明

### 基础配置
```json
{
    "baseInvestment": 1000,
    "smaWindow": 200,
    "stdWindow": 30,
    "minWeight": 0.5,
    "maxWeight": 2
}
```

### 再平衡配置
```json
{
    "rebalanceEnabled": true,
    "rebalancePeriod": "QUARTERLY",
    "rebalanceThreshold": 5,
    "minTradeAmount": 1000
}
```

## API 参考

### 主要类
- `InvestmentCalculator`: 投资计算核心类
- `RebalanceManager`: 再平衡管理器
- `StorageManager`: 存储管理器
- `ConfigManager`: 配置管理器

### 工具函数
- `formatDate()`: 日期格式化
- `calculateMA()`: 移动平均计算
- `formatCurrency()`: 货币格式化

## 开发指南

### 环境要求
- Node.js >= 14.0.0
- Chrome >= 88

### 开发设置
1. 安装开发依赖
```bash
npm install --save-dev
```

2. 运行开发服务器
```bash
npm run dev
```

3. 构建生产版本
```bash
npm run build
```

### 代码规范
- 使用 ESLint 进行代码检查
- 遵循 Google JavaScript 风格指南
- 使用 Prettier 进行代码格式化

## 贡献指南

1. Fork 项目
2. 创建特性分支
```bash
git checkout -b feature/your-feature
```
3. 提交更改
```bash
git commit -m 'Add some feature'
```
4. 推送到分支
```bash
git push origin feature/your-feature
```
5. 创建 Pull Request

## 许可证

版权所有 (c) 2024 - 现在。 保留所有权利。

本软件是私有软件。未经明确授权，不得复制、修改、分发或使用本软件的任何部分。

## 联系方式

- 作者: Your Name
- Email: your.email@example.com
- GitHub: [your-username](https://github.com/your-username)

## 致谢

- 感谢 [Yahoo Finance](https://finance.yahoo.com/) 提供数据支持
- 感谢所有贡献者的支持和帮助

## 更新日志

### v1.0.0 (2024-11-28)
- 初始版本发布
- 实现基础投资组合管理功能
- 添加再平衡功能
- 集成 Yahoo Finance API

## FAQ

### Q: 如何修改定投设置？
A: 在扩展弹出窗口中点击"设置"按钮，进入设置页面进行修改。

### Q: 数据保存在哪里？
A: 所有数据都保存在本地 Chrome 存储中，不会上传到云端。

### Q: 如何备份数据？
A: 在设置页面中使用"导出数据"功能进行备份。