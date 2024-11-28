import { Chart } from 'chart.js';
import InvestmentCalculator from '../lib/data-processing.js';

class PopupUI {
    constructor() {
        this.calculator = null;
        this.chart = null;
        this.currentData = null;
        
        this.initializeElements();
        this.setupEventListeners();
        this.loadInitialConfig();
    }

    initializeElements() {
        // 获取DOM元素
        this.startDateInput = document.getElementById('startDate');
        this.endDateInput = document.getElementById('endDate');
        this.stockSelect = document.getElementById('stockSelect');
        this.baseInvestmentInput = document.getElementById('baseInvestment');
        this.updateButton = document.getElementById('updateChart');
        this.estimateButton = document.getElementById('estimateToday');
        this.viewHistoryButton = document.getElementById('viewHistory');
        this.enableRebalanceCheckbox = document.getElementById('enableRebalance');
        this.rebalanceOptions = document.getElementById('rebalanceOptions');
        this.portfolioButton = document.getElementById('setPortfolio');
        this.portfolioSummary = document.getElementById('portfolioSummary');
        this.statisticsPanel = document.getElementById('statisticsPanel');

        // 初始化图表
        const ctx = document.getElementById('investmentChart').getContext('2d');
        this.initializeChart(ctx);
    }

    initializeChart(ctx) {
        this.chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [
                    {
                        label: '累计收益',
                        data: [],
                        borderColor: 'rgb(75, 192, 192)',
                        tension: 0.1
                    },
                    {
                        label: '基准收益',
                        data: [],
                        borderColor: 'rgb(255, 99, 132)',
                        tension: 0.1
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: '投资收益对比'
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: '收益 ($)'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: '日期'
                        }
                    }
                }
            }
        });
    }

    setupEventListeners() {
        this.updateButton.addEventListener('click', () => this.updateChart());
        this.estimateButton.addEventListener('click', () => this.estimateToday());
        this.viewHistoryButton.addEventListener('click', () => this.viewHistory());
        this.portfolioButton.addEventListener('click', () => this.openPortfolioDialog());
        this.enableRebalanceCheckbox.addEventListener('change', () => this.toggleRebalanceOptions());

        // 设置日期范围的默认值
        const today = new Date();
        const lastYear = new Date();
        lastYear.setFullYear(today.getFullYear() - 1);
        
        this.startDateInput.value = this.formatDate(lastYear);
        this.endDateInput.value = this.formatDate(today);
    }

    async loadInitialConfig() {
        try {
            const response = await chrome.runtime.sendMessage({
                type: 'getConfig'
            });

            if (response.success) {
                const config = response.config;
                this.populateStockSelect(config.tickers);
                this.baseInvestmentInput.value = config.baseInvestment;
                this.calculator = new InvestmentCalculator(config);
            }
        } catch (error) {
            console.error('Error loading config:', error);
            this.showError('配置加载失败');
        }
    }

    async updateChart() {
        try {
            const symbol = this.stockSelect.value;
            const startDate = new Date(this.startDateInput.value);
            const endDate = new Date(this.endDateInput.value);

            // 获取价格数据
            const response = await chrome.runtime.sendMessage({
                type: 'getPriceData',
                symbol,
                startDate,
                endDate
            });

            if (response.success) {
                this.currentData = response.data;
                this.updateChartDisplay();
                this.updateStatistics();
            } else {
                this.showError('数据获取失败');
            }
        } catch (error) {
            console.error('Error updating chart:', error);
            this.showError('图表更新失败');
        }
    }

    updateChartDisplay() {
        if (!this.currentData || !this.chart) return;

        const dates = this.currentData.dates.map(d => this.formatDate(new Date(d)));
        const returns = this.calculator.calculateReturns(
            this.currentData.adjustedPrices,
            this.currentData.dates
        );

        this.chart.data.labels = dates;
        this.chart.data.datasets[0].data = returns.cumulativeReturn;
        this.chart.data.datasets[1].data = returns.benchmarkReturn;
        this.chart.update();
    }

    updateStatistics() {
        if (!this.currentData) return;

        const stats = this.calculator.calculateStatistics(this.currentData);
        this.statisticsPanel.innerHTML = `
            <h3>投资统计</h3>
            <p>总投资金额: $${stats.totalInvestment.toFixed(2)}</p>
            <p>当前市值: $${stats.currentValue.toFixed(2)}</p>
            <p>总收益: $${stats.totalReturn.toFixed(2)}</p>
            <p>收益率: ${stats.returnRate.toFixed(2)}%</p>
            <p>年化收益率: ${stats.annualizedReturn.toFixed(2)}%</p>
        `;
    }

    async estimateToday() {
        try {
            const symbol = this.stockSelect.value;
            const response = await chrome.runtime.sendMessage({
                type: 'checkInvestment',
                symbol
            });

            if (response.success) {
                this.showEstimationResult(response.result);
            } else {
                this.showError('估值获取失败');
            }
        } catch (error) {
            console.error('Error estimating today:', error);
            this.showError('估值计算失败');
        }
    }

    showEstimationResult(result) {
        const dialog = document.createElement('div');
        dialog.className = 'estimation-dialog';
        dialog.innerHTML = `
            <h3>今日定投估值</h3>
            <p>当前价格: $${result.price.price.toFixed(2)}</p>
            <p>建议: ${result.shouldInvest ? '适合投资' : '建议观望'}
            <p>移动平均: $${result.indicators.sma[result.indicators.sma.length - 1].toFixed(2)}</p>
            <p>波动率: ${(result.indicators.std[result.indicators.std.length - 1] * 100).toFixed(2)}%</p>
        `;
        document.body.appendChild(dialog);

        // 3秒后自动关闭
        setTimeout(() => {
            dialog.remove();
        }, 3000);
    }

    async viewHistory() {
        try {
            // 创建历史记录窗口
            const historyWindow = window.open('', 'Investment History', 'width=800,height=600');
            historyWindow.document.write(`
                <html>
                <head>
                    <title>投资历史记录</title>
                    <style>
                        body { font-family: Arial, sans-serif; padding: 20px; }
                        table { width: 100%; border-collapse: collapse; }
                        th, td { padding: 8px; text-align: left; border-bottom: 1px solid #ddd; }
                        th { background-color: #f5f5f5; }
                    </style>
                </head>
                <body>
                    <h2>投资历史记录</h2>
                    <div id="historyContent"></div>
                </body>
                </html>
            `);

            // 获取历史数据
            const response = await chrome.runtime.sendMessage({
                type: 'getInvestmentHistory'
            });

            if (response.success) {
                this.displayHistory(response.history, historyWindow);
            } else {
                historyWindow.document.getElementById('historyContent').innerHTML = '获取历史记录失败';
            }
        } catch (error) {
            console.error('Error viewing history:', error);
            this.showError('历史记录加载失败');
        }
    }

    displayHistory(history, window) {
        const content = window.document.getElementById('historyContent');
        if (!history || history.length === 0) {
            content.innerHTML = '暂无投资记录';
            return;
        }

        let html = `
            <table>
                <thead>
                    <tr>
                        <th>日期</th>
                        <th>股票</th>
                        <th>价格</th>
                        <th>数量</th>
                        <th>投资金额</th>
                    </tr>
                </thead>
                <tbody>
        `;

        history.forEach(record => {
            html += `
                <tr>
                    <td>${this.formatDate(new Date(record.date))}</td>
                    <td>${record.symbol}</td>
                    <td>$${record.price.toFixed(2)}</td>
                    <td>${record.shares}</td>
                    <td>$${(record.price * record.shares).toFixed(2)}</td>
                </tr>
            `;
        });

        html += '</tbody></table>';
        content.innerHTML = html;
    }

    async openPortfolioDialog() {
        try {
            const dialog = document.createElement('div');
            dialog.className = 'portfolio-dialog';
            dialog.innerHTML = `
                <div class="portfolio-dialog-content">
                    <h3>设置资产组合</h3>
                    <div class="portfolio-inputs"></div>
                    <div class="portfolio-buttons">
                        <button id="savePortfolio">保存</button>
                        <button id="cancelPortfolio">取消</button>
                    </div>
                </div>
            `;

            // 获取当前配置
            const response = await chrome.runtime.sendMessage({
                type: 'getConfig'
            });

            if (response.success) {
                const config = response.config;
                const inputsContainer = dialog.querySelector('.portfolio-inputs');
                
                config.tickers.forEach(ticker => {
                    const input = document.createElement('div');
                    input.className = 'portfolio-input-group';
                    input.innerHTML = `
                        <label>${ticker}</label>
                        <input type="number" min="0" max="100" value="0" class="portfolio-weight" 
                               data-ticker="${ticker}">
                        <span>%</span>
                    `;
                    inputsContainer.appendChild(input);
                });

                document.body.appendChild(dialog);

                // 绑定事件
                dialog.querySelector('#savePortfolio').addEventListener('click', () => {
                    this.savePortfolio(dialog);
                });

                dialog.querySelector('#cancelPortfolio').addEventListener('click', () => {
                    dialog.remove();
                });
            }
        } catch (error) {
            console.error('Error opening portfolio dialog:', error);
            this.showError('打开资产组合设置失败');
        }
    }

    async savePortfolio(dialog) {
        try {
            const weights = {};
            dialog.querySelectorAll('.portfolio-weight').forEach(input => {
                weights[input.dataset.ticker] = parseFloat(input.value) / 100;
            });

            // 验证权重总和是否为100%
            const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0);
            if (Math.abs(totalWeight - 1) > 0.001) {
                this.showError('资产配置总和必须为100%');
                return;
            }

            // 保存配置
            await chrome.runtime.sendMessage({
                type: 'updateConfig',
                config: { portfolioWeights: weights }
            });

            this.updatePortfolioSummary(weights);
            dialog.remove();
        } catch (error) {
            console.error('Error saving portfolio:', error);
            this.showError('保存资产组合失败');
        }
    }

    updatePortfolioSummary(weights) {
        const summary = Object.entries(weights)
            .filter(([_, weight]) => weight > 0)
            .map(([ticker, weight]) => `${ticker}: ${(weight * 100).toFixed(1)}%`)
            .join(', ');

        this.portfolioSummary.textContent = summary || '未设置资产组合';
    }

    toggleRebalanceOptions() {
        const enabled = this.enableRebalanceCheckbox.checked;
        this.rebalanceOptions.style.display = enabled ? 'block' : 'none';
        
        if (enabled) {
            this.initializeRebalanceOptions();
        }
    }

    async initializeRebalanceOptions() {
        try {
            const response = await chrome.runtime.sendMessage({
                type: 'getConfig'
            });

            if (response.success) {
                const config = response.config;
                // 设置再平衡选项的默认值
                document.getElementById('threshold').value = (config.rebalanceThreshold || 5).toString();
                document.getElementById('minTrade').value = (config.minTradeAmount || 1000).toString();
                
                // 设置再平衡周期
                const periodRadios = document.getElementsByName('period');
                for (const radio of periodRadios) {
                    if (radio.value === (config.rebalancePeriod || 'QUARTERLY')) {
                        radio.checked = true;
                        break;
                    }
                }
            }
        } catch (error) {
            console.error('Error initializing rebalance options:', error);
            this.showError('初始化再平衡选项失败');
        }
    }

    formatDate(date) {
        return date.toISOString().split('T')[0];
    }

    showError(message) {
        const toast = document.createElement('div');
        toast.className = 'error-toast';
        toast.textContent = message;
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.remove();
        }, 3000);
    }

    populateStockSelect(tickers) {
        this.stockSelect.innerHTML = tickers.map(ticker => 
            `<option value="${ticker}">${ticker}</option>`
        ).join('');
    }
}

// 初始化弹出窗口UI
document.addEventListener('DOMContentLoaded', () => {
    new PopupUI();
});