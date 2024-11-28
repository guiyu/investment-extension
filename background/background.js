// 导入所需模块
import ConfigManager from '../lib/config.js';
import StorageManager from '../lib/storage.js';
import YahooFinanceAPI from '../lib/yahoo-finance.js';
import { utils } from '../lib/utils.js';

// Service Worker 状态
let isInitialized = false;

// 初始化函数
async function initialize() {
    if (isInitialized) return;

    try {
        // 初始化配置
        await ConfigManager.loadConfig();
        
        // 设置定时任务
        setupAlarms();
        
        // 添加消息监听器
        setupMessageListeners();
        
        isInitialized = true;
        console.log('Service Worker initialized successfully');
    } catch (error) {
        console.error('Service Worker initialization failed:', error);
    }
}

// 设置定时任务
function setupAlarms() {
    // 设置每日检查闹钟
    chrome.alarms.create('dailyCheck', {
        periodInMinutes: 24 * 60 // 每24小时检查一次
    });

    // 设置市场开盘提醒
    chrome.alarms.create('marketOpen', {
        periodInMinutes: 24 * 60,
        when: getNextMarketOpenTime()
    });
}

// 消息监听器设置
function setupMessageListeners() {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        handleMessage(message, sender, sendResponse);
        return true; // 保持消息通道打开
    });
}

// 消息处理函数
async function handleMessage(message, sender, sendResponse) {
    try {
        switch (message.type) {
            case 'getPriceData':
                const data = await YahooFinanceAPI.getHistoricalData(
                    message.symbol,
                    message.startDate,
                    message.endDate
                );
                sendResponse({ success: true, data });
                break;

            case 'getAnalysis':
                const analysis = await analyzeStock(message.symbol);
                sendResponse({ success: true, data: analysis });
                break;

            case 'updateConfig':
                await ConfigManager.updateConfig(message.config);
                sendResponse({ success: true });
                break;

            default:
                console.warn('Unknown message type:', message.type);
                sendResponse({ success: false, error: 'Unknown message type' });
        }
    } catch (error) {
        console.error('Error handling message:', error);
        sendResponse({ success: false, error: error.message });
    }
}

// 获取下一个市场开盘时间
function getNextMarketOpenTime() {
    const now = new Date();
    const marketOpen = new Date(now);
    marketOpen.setHours(9, 30, 0, 0); // 美东时间9:30

    if (now > marketOpen) {
        marketOpen.setDate(marketOpen.getDate() + 1);
    }

    return marketOpen.getTime();
}

// 分析股票数据
async function analyzeStock(symbol) {
    try {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setFullYear(startDate.getFullYear() - 1);

        const data = await YahooFinanceAPI.getHistoricalData(symbol, startDate, endDate);
        return {
            technicalIndicators: calculateTechnicalIndicators(data),
            suggestion: generateInvestmentSuggestion(data),
            marketTrends: analyzeMarketTrends(data)
        };
    } catch (error) {
        console.error('Error analyzing stock:', error);
        throw error;
    }
}

// 计算技术指标
function calculateTechnicalIndicators(data) {
    const prices = data.adjustedPrices;
    return {
        sma200: utils.calculateMA(prices, 200).slice(-1)[0],
        rsi: calculateRSI(prices),
        macd: calculateMACD(prices)
    };
}

// 生成投资建议
function generateInvestmentSuggestion(data) {
    // 实现投资建议逻辑
    return {
        recommendation: "根据技术分析建议",
        position: 50 // 建议仓位
    };
}

// 分析市场趋势
function analyzeMarketTrends(data) {
    // 实现市场趋势分析逻辑
    return {
        trend: "上升",
        volatility: "中等"
    };
}

// 计算RSI指标
function calculateRSI(prices) {
    // 实现RSI计算逻辑
    return 50; // 示例返回值
}

// 计算MACD指标
function calculateMACD(prices) {
    // 实现MACD计算逻辑
    return 0; // 示例返回值
}

// 监听安装事件
chrome.runtime.onInstalled.addListener(async () => {
    console.log('Extension installed');
    await initialize();
});

// 监听启动事件
chrome.runtime.onStartup.addListener(async () => {
    console.log('Extension started');
    await initialize();
});

// 监听报警事件
chrome.alarms.onAlarm.addListener((alarm) => {
    console.log('Alarm triggered:', alarm.name);
    switch (alarm.name) {
        case 'dailyCheck':
            performDailyCheck();
            break;
        case 'marketOpen':
            handleMarketOpen();
            break;
    }
});

// 每日检查任务
async function performDailyCheck() {
    const config = await ConfigManager.loadConfig();
    // 实现每日检查逻辑
}

// 市场开盘处理
async function handleMarketOpen() {
    // 实现市场开盘处理逻辑
}

// 导出 Service Worker
export default null;