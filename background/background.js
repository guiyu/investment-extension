import YahooFinanceAPI from '../lib/yahoo-finance.js';

// 默认配置
const DEFAULT_CONFIG = {
    tickers: ['SPY', 'QQQ', 'IWM', 'DIA', 'VTI'],
    baseInvestment: 1000,
    smaWindow: 200,
    stdWindow: 30,
    minWeight: 0.5,
    maxWeight: 2
};

class BackgroundService {
    constructor() {
        this.setupAlarms();
        this.setupListeners();
        this.initializeState();
    }

    async initializeState() {
        // 初始化存储
        const state = await chrome.storage.sync.get('config');
        if (!state.config) {
            await chrome.storage.sync.set({ config: DEFAULT_CONFIG });
        }
    }

    setupAlarms() {
        // 设置每日定投检查闹钟
        chrome.alarms.create('dailyInvestmentCheck', {
            periodInMinutes: 24 * 60  // 每24小时检查一次
        });

        // 设置市场开盘提醒闹钟
        chrome.alarms.create('marketOpenReminder', {
            periodInMinutes: 24 * 60,
            when: this.getNextMarketOpenTime()
        });
    }

    setupListeners() {
        // 监听闹钟事件
        chrome.alarms.onAlarm.addListener((alarm) => {
            switch (alarm.name) {
                case 'dailyInvestmentCheck':
                    this.checkInvestmentSchedule();
                    break;
                case 'marketOpenReminder':
                    this.sendMarketOpenReminder();
                    break;
            }
        });

        // 监听消息
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            this.handleMessage(request, sender, sendResponse);
            return true;  // 保持消息通道开启
        });
    }

    async handleMessage(request, sender, sendResponse) {
        try {
            switch (request.type) {
                case 'getPriceData':
                    const data = await this.fetchPriceData(request.symbol, request.startDate, request.endDate);
                    sendResponse({ success: true, data });
                    break;
                    
                case 'checkInvestment':
                    const checkResult = await this.checkInvestmentOpportunity(request.symbol);
                    sendResponse({ success: true, result: checkResult });
                    break;
                    
                case 'updateConfig':
                    await this.updateConfig(request.config);
                    sendResponse({ success: true });
                    break;
                    
                case 'getConfig':
                    const config = await this.getConfig();
                    sendResponse({ success: true, config });
                    break;
                    
                default:
                    sendResponse({ success: false, error: 'Unknown request type' });
            }
        } catch (error) {
            console.error('Error handling message:', error);
            sendResponse({ success: false, error: error.message });
        }
    }

    async fetchPriceData(symbol, startDate, endDate) {
        // 首先检查缓存
        const cachedData = await YahooFinanceAPI.getCachedData(symbol);
        if (cachedData) {
            return cachedData;
        }

        // 获取新数据
        const data = await YahooFinanceAPI.getHistoricalData(symbol, startDate, endDate);
        // 缓存数据
        await YahooFinanceAPI.cacheData(symbol, data);
        return data;
    }

    async checkInvestmentSchedule() {
        const config = await this.getConfig();
        const today = new Date();

        // 检查是否是第二个周三
        if (this.isSecondWednesday(today)) {
            // 获取所有股票的当前价格
            for (const ticker of config.tickers) {
                await this.checkInvestmentOpportunity(ticker);
            }
        }
    }

    async checkInvestmentOpportunity(symbol) {
        try {
            const currentPrice = await YahooFinanceAPI.getCurrentPrice(symbol);
            const historyData = await this.fetchPriceData(
                symbol,
                new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
                new Date()
            );

            // 计算技术指标
            const technicalIndicators = YahooFinanceAPI.calculateTechnicalIndicators(historyData.adjustedPrices);

            // 如果满足投资条件，发送通知
            if (this.shouldInvest(currentPrice.price, technicalIndicators)) {
                this.sendInvestmentNotification(symbol, currentPrice.price);
            }

            return {
                price: currentPrice,
                indicators: technicalIndicators,
                shouldInvest: this.shouldInvest(currentPrice.price, technicalIndicators)
            };
        } catch (error) {
            console.error(`Error checking investment opportunity for ${symbol}:`, error);
            throw error;
        }
    }

    shouldInvest(currentPrice, indicators) {
        // 实现投资决策逻辑
        const { sma, std } = indicators;
        const lastSMA = sma[sma.length - 1];
        const lastSTD = std[std.length - 1];

        // 简单的投资逻辑示例
        return currentPrice < lastSMA && lastSTD < lastSMA * 0.1;
    }

    async sendInvestmentNotification(symbol, price) {
        chrome.notifications.create({
            type: 'basic',
            iconUrl: '/assets/icons/icon128.png',
            title: '投资机会提醒',
            message: `${symbol} 当前价格 $${price} 可能是一个好的投资时机。`
        });
    }

    async sendMarketOpenReminder() {
        chrome.notifications.create({
            type: 'basic',
            iconUrl: '/assets/icons/icon128.png',
            title: '市场开盘提醒',
            message: '美股市场即将开盘，请检查您的投资计划。'
        });
    }

    getNextMarketOpenTime() {
        // 计算下一个交易日开盘时间
        const now = new Date();
        const marketOpen = new Date(now);
        marketOpen.setHours(9, 30, 0, 0);  // 美东时间9:30

        if (now > marketOpen) {
            marketOpen.setDate(marketOpen.getDate() + 1);
        }

        return marketOpen.getTime();
    }

    isSecondWednesday(date) {
        const d = new Date(date);
        return d.getDay() === 3 && // 是周三
               Math.floor((d.getDate() - 1) / 7) === 1; // 是第二周
    }

    async getConfig() {
        const result = await chrome.storage.sync.get('config');
        return result.config || DEFAULT_CONFIG;
    }

    async updateConfig(newConfig) {
        await chrome.storage.sync.set({ config: { ...DEFAULT_CONFIG, ...newConfig } });
    }
}

// 初始化后台服务
const backgroundService = new BackgroundService();

export default backgroundService;