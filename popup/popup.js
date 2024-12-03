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

            const data = await YahooFinanceAPI.getHistoricalData(symbol, startDate, endDate);
            this.updateChartDisplay(data);
        } catch (error) {
            console.error('Error updating chart:', error);
            this.showError('更新图表失败: ' + error.message);
        } finally {
            this.hideLoading();
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