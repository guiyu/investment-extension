// 导入必要模块
import { utils } from '../lib/utils.js';
import YahooFinanceAPI from '../lib/yahoo-finance.js';
import ConfigManager from '../lib/config.js';
import StorageManager from '../lib/storage.js';

class PopupUI {
    constructor() {
        this.initialize();
        this.config = null;
        this.chart = null;
    }

    async initialize() {
        try {
            // 检查 Chart 是否在全局范围内可用
            if (typeof Chart === 'undefined') {
                throw new Error('Chart.js not available');
            }
            
            await this.initializeConfig();
            this.initializeElements();
            this.setupEventListeners();
            await this.initializeStockSelect();
            this.updateDateInputs();
        } catch (error) {
            console.error('Initialization error:', error);
            this.showError('初始化失败: ' + error.message);
        }
    }

    async initializeConfig() {
        try {
            // 加载默认配置
            const defaultConfig = {
                tickers: ['SPY', 'QQQ', 'IWM', 'DIA', 'VTI'],
                baseInvestment: 1000,
                smaWindow: 200,
                stdWindow: 30,
                minWeight: 0.5,
                maxWeight: 2
            };

            // 从存储中获取配置
            const savedConfig = await chrome.storage.sync.get('config');
            this.config = savedConfig.config || defaultConfig;

            // 如果没有保存的配置，保存默认配置
            if (!savedConfig.config) {
                await chrome.storage.sync.set({ config: defaultConfig });
            }

            console.log('Configuration loaded:', this.config);
        } catch (error) {
            console.error('Error loading configuration:', error);
            throw new Error('Failed to load configuration');
        }
    }

    initializeElements() {
        // 获取所有需要的DOM元素
        this.stockSelect = document.getElementById('stockSelect');
        this.baseInvestmentInput = document.getElementById('baseInvestment');
        this.startDateInput = document.getElementById('startDate');
        this.endDateInput = document.getElementById('endDate');
        this.updateButton = document.getElementById('updateChart');
        this.estimateButton = document.getElementById('estimateToday');
        this.portfolioButton = document.getElementById('setPortfolio');
        this.portfolioSummary = document.getElementById('portfolioSummary');
        this.chartCanvas = document.getElementById('investmentChart');
        this.statisticsPanel = document.getElementById('statisticsPanel');

        // 验证所有必要的元素都存在
        if (!this.stockSelect || !this.baseInvestmentInput || !this.chartCanvas) {
            throw new Error('Required elements not found in the DOM');
        }
    }

    setupEventListeners() {
        // 绑定事件监听器
        this.updateButton?.addEventListener('click', () => this.updateChart());
        this.estimateButton?.addEventListener('click', () => this.estimateToday());
        this.portfolioButton?.addEventListener('click', () => this.openPortfolioDialog());
        this.stockSelect?.addEventListener('change', (e) => this.onStockSelectChange(e));

        // 设置基础投资金额输入框的值
        if (this.baseInvestmentInput && this.config) {
            this.baseInvestmentInput.value = this.config.baseInvestment;
        }
    }

    async initializeStockSelect() {
        if (!this.stockSelect || !this.config?.tickers) return;

        // 清空现有选项
        this.stockSelect.innerHTML = '';
            
        // 添加选项
        this.config.tickers.forEach(ticker => {
            const option = document.createElement('option');
            option.value = ticker;
            option.textContent = ticker;
            this.stockSelect.appendChild(option);
        });

        // 设置默认选中项
        if (this.config.tickers.length > 0) {
            this.stockSelect.value = this.config.tickers[0];
            await this.updateChart();
        }
    }

    updateDateInputs() {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setFullYear(startDate.getFullYear() - 1);

        if (this.startDateInput) {
            this.startDateInput.value = utils.formatDate(startDate, 'YYYY-MM');
        }
        if (this.endDateInput) {
            this.endDateInput.value = utils.formatDate(endDate, 'YYYY-MM');
        }
    }

    async onStockSelectChange(event) {
        const selectedTicker = event.target.value;
        if (selectedTicker) {
            await this.updateChart();
        }
    }

    async updateChart() {
        try {
            this.showLoading();
            const symbol = this.stockSelect.value;
            const startDate = new Date(this.startDateInput.value);
            const endDate = new Date(this.endDateInput.value);
            
            console.log('Updating chart with dates:', {
                startDate: startDate.toISOString(),
                endDate: endDate.toISOString()
            });

            const data = await YahooFinanceAPI.getHistoricalData(symbol, startDate, endDate);
            this.updateChartDisplay(data);

            // 计算并显示定投统计信息
            await this.calculateAndDisplayInvestmentStats(data);

        } catch (error) {
            console.error('Error updating chart:', error);
            this.showError('更新图表失败: ' + error.message);
        } finally {
            this.hideLoading();
        }
    }

    async calculateAndDisplayInvestmentStats(data) {
        if (!this.statisticsPanel || !data.prices || !data.dates) return;

        const baseInvestment = Number(this.baseInvestmentInput?.value) || 1000;
        let totalInvestment = 0;
        let totalShares = 0;
        const monthlyStats = [];
        
        // 按月计算定投统计
        for (let i = 0; i < data.dates.length; i++) {
            const currentDate = data.dates[i];
            const price = data.prices[i];
            
            // 确认是否是每月的定投日（默认每月第二个周三）
            if (this.isInvestmentDay(currentDate)) {
                const weight = this.calculateInvestmentWeight(data.prices, i);
                const investment = baseInvestment * weight;
                const shares = investment / price;
                
                totalInvestment += investment;
                totalShares += shares;

                monthlyStats.push({
                    date: currentDate,
                    price: price,
                    investment: investment,
                    shares: shares,
                    weight: weight
                });
            }
        }

        // 计算当前市值和收益率
        const currentPrice = data.prices[data.prices.length - 1];
        const portfolioValue = totalShares * currentPrice;
        const totalReturn = portfolioValue - totalInvestment;
        const returnRate = (totalReturn / totalInvestment) * 100;

        // 更新统计面板显示
        this.statisticsPanel.innerHTML = `
            <div class="stats-container">
                <h3>定投统计概要</h3>
                <div class="stats-grid">
                    <div class="stat-item">
                        <div class="stat-label">总投资额</div>
                        <div class="stat-value">$${totalInvestment.toFixed(2)}</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-label">当前市值</div>
                        <div class="stat-value">$${portfolioValue.toFixed(2)}</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-label">总收益</div>
                        <div class="stat-value ${totalReturn >= 0 ? 'positive' : 'negative'}">
                            $${totalReturn.toFixed(2)} (${returnRate.toFixed(2)}%)
                        </div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-label">累计份额</div>
                        <div class="stat-value">${totalShares.toFixed(4)}</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-label">近期买入价</div>
                        <div class="stat-value">$${currentPrice.toFixed(2)}</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-label">定投次数</div>
                        <div class="stat-value">${monthlyStats.length}</div>
                    </div>
                </div>
            </div>
        `;

        // 添加样式
        this.addStatisticsStyles();
    }

    isInvestmentDay(date) {
        // 判断是否为每月第二个周三
        const d = new Date(date);
        const month = d.getMonth();
        let count = 0;
        let day = 1;
        
        while (day <= d.getDate()) {
            const tempDate = new Date(d.getFullYear(), month, day);
            if (tempDate.getDay() === 3) { // 3 代表周三
                count++;
                if (count === 2) {
                    return day === d.getDate();
                }
            }
            day++;
        }
        return false;
    }

    calculateInvestmentWeight(prices, currentIndex) {
        // 简单实现：基于价格相对于过去30日均价的偏离度计算权重
        const lookback = Math.min(30, currentIndex);
        if (lookback < 5) return 1; // 数据不足时使用基础权重
        
        const recentPrices = prices.slice(currentIndex - lookback, currentIndex + 1);
        const avg = recentPrices.reduce((sum, price) => sum + price, 0) / recentPrices.length;
        const currentPrice = prices[currentIndex];
        
        // 价格低于均价时增加权重，高于均价时减少权重
        const ratio = avg / currentPrice;
        return Math.max(0.5, Math.min(2, ratio));
    }

    addStatisticsStyles() {
        // 检查是否已添加样式
        if (!document.getElementById('stats-styles')) {
            const style = document.createElement('style');
            style.id = 'stats-styles';
            style.textContent = `
                .stats-container {
                    padding: 15px;
                    background: #fff;
                    border-radius: 8px;
                    margin-top: 20px;
                }
                .stats-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: 15px;
                    margin-top: 10px;
                }
                .stat-item {
                    background: #f8f9fa;
                    padding: 12px;
                    border-radius: 6px;
                    border: 1px solid #e9ecef;
                }
                .stat-label {
                    color: #6c757d;
                    font-size: 14px;
                    margin-bottom: 4px;
                }
                .stat-value {
                    font-size: 16px;
                    font-weight: 500;
                    color: #212529;
                }
                .positive { color: #28a745; }
                .negative { color: #dc3545; }
            `;
            document.head.appendChild(style);
        }
    }

    updateChartDisplay(data) {
        if (this.chart) {
            this.chart.destroy();
        }

        const ctx = this.chartCanvas.getContext('2d');
        this.chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.dates.map(date => new Date(date).toLocaleDateString()),
                datasets: [{
                    label: '股票价格',
                    data: data.prices,
                    borderColor: 'rgb(75, 192, 192)',
                    tension: 0.1
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    title: {
                        display: true,
                        text: '股票价格走势'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: false
                    }
                }
            }
        });
    }

    showLoading() {
        const existingLoader = document.getElementById('loadingIndicator');
        if (existingLoader) return;

        const loadingDiv = document.createElement('div');
        loadingDiv.id = 'loadingIndicator';
        loadingDiv.textContent = '加载中...';
        loadingDiv.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(255, 255, 255, 0.9);
            padding: 20px;
            border-radius: 5px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            z-index: 1000;
        `;
        document.body.appendChild(loadingDiv);
    }

    hideLoading() {
        const loadingDiv = document.getElementById('loadingIndicator');
        if (loadingDiv) {
            loadingDiv.remove();
        }
    }

    showError(message) {
        const existingError = document.querySelector('.error-message');
        if (existingError) existingError.remove();

        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = message;
        errorDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #ff4444;
            color: white;
            padding: 10px 20px;
            border-radius: 4px;
            z-index: 1000;
            animation: fadeInOut 3s ease-in-out;
        `;
        document.body.appendChild(errorDiv);

        setTimeout(() => {
            errorDiv.remove();
        }, 3000);
    }
}

// 初始化应用
document.addEventListener('DOMContentLoaded', () => {
    new PopupUI();
});