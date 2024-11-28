class YahooFinanceAPI {
    /**
     * 获取历史价格数据
     * @param {string} symbol - 股票代码
     * @param {Date} startDate - 开始日期
     * @param {Date} endDate - 结束日期
     * @returns {Promise<Object>} - 价格数据
     */
    static async getHistoricalData(symbol, startDate, endDate) {
        try {
            const period1 = Math.floor(startDate.getTime() / 1000);
            const period2 = Math.floor(endDate.getTime() / 1000);
            const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?period1=${period1}&period2=${period2}&interval=1d`;

            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            return this.processYahooData(data);
        } catch (error) {
            console.error(`Error fetching data for ${symbol}:`, error);
            throw error;
        }
    }

    /**
     * 处理Yahoo Finance返回的数据
     * @param {Object} rawData - 原始数据
     * @returns {Object} - 处理后的数据
     */
    static processYahooData(rawData) {
        const result = {
            dates: [],
            prices: [],
            adjustedPrices: []
        };

        if (!rawData.chart || !rawData.chart.result || rawData.chart.result.length === 0) {
            throw new Error('Invalid data format from Yahoo Finance');
        }

        const chartData = rawData.chart.result[0];
        const timestamps = chartData.timestamp;
        const quotes = chartData.indicators.quote[0];
        const adjclose = chartData.indicators.adjclose[0].adjclose;

        for (let i = 0; i < timestamps.length; i++) {
            if (quotes.close[i] !== null) {
                result.dates.push(new Date(timestamps[i] * 1000));
                result.prices.push(quotes.close[i]);
                result.adjustedPrices.push(adjclose[i]);
            }
        }

        return result;
    }

    /**
     * 获取实时价格
     * @param {string} symbol - 股票代码
     * @returns {Promise<Object>} - 实时价格数据
     */
    static async getCurrentPrice(symbol) {
        try {
            const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1m&range=1d`;
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            if (!data.chart || !data.chart.result || data.chart.result.length === 0) {
                throw new Error('Invalid data format');
            }

            const quote = data.chart.result[0].meta;
            return {
                price: quote.regularMarketPrice,
                change: quote.regularMarketChange,
                changePercent: quote.regularMarketChangePercent,
                timestamp: quote.regularMarketTime * 1000
            };
        } catch (error) {
            console.error(`Error fetching current price for ${symbol}:`, error);
            throw error;
        }
    }

    /**
     * 缓存数据到Chrome存储
     * @param {string} symbol - 股票代码
     * @param {Object} data - 要缓存的数据
     */
    static async cacheData(symbol, data) {
        try {
            const cacheKey = `yahooFinance_${symbol}`;
            const cacheData = {
                timestamp: Date.now(),
                data: data
            };
            await chrome.storage.local.set({ [cacheKey]: cacheData });
        } catch (error) {
            console.error('Error caching data:', error);
        }
    }

    /**
     * 从缓存获取数据
     * @param {string} symbol - 股票代码
     * @returns {Promise<Object|null>} - 缓存的数据
     */
    static async getCachedData(symbol) {
        try {
            const cacheKey = `yahooFinance_${symbol}`;
            const result = await chrome.storage.local.get(cacheKey);
            if (result[cacheKey]) {
                const cachedData = result[cacheKey];
                // 检查缓存是否过期（24小时）
                if (Date.now() - cachedData.timestamp < 24 * 60 * 60 * 1000) {
                    return cachedData.data;
                }
            }
            return null;
        } catch (error) {
            console.error('Error getting cached data:', error);
            return null;
        }
    }

    /**
     * 获取技术指标数据
     * @param {Array<number>} prices - 价格数组
     * @returns {Object} - 技术指标数据
     */
    static calculateTechnicalIndicators(prices) {
        return {
            sma: this.calculateSMA(prices, 200),
            std: this.calculateSTD(prices, 30),
            macd: this.calculateMACD(prices)
        };
    }

    /**
     * 计算简单移动平均
     * @param {Array<number>} data - 数据数组
     * @param {number} window - 窗口大小
     * @returns {Array<number>} - SMA数组
     */
    static calculateSMA(data, window) {
        const sma = [];
        let sum = 0;
        
        for (let i = 0; i < data.length; i++) {
            sum += data[i];
            if (i >= window) {
                sum -= data[i - window];
            }
            if (i >= window - 1) {
                sma.push(sum / window);
            } else {
                sma.push(null);
            }
        }
        return sma;
    }

    /**
     * 计算标准差
     * @param {Array<number>} data - 数据数组
     * @param {number} window - 窗口大小
     * @returns {Array<number>} - 标准差数组
     */
    static calculateSTD(data, window) {
        const std = [];
        
        for (let i = 0; i < data.length; i++) {
            if (i < window - 1) {
                std.push(null);
                continue;
            }

            const slice = data.slice(i - window + 1, i + 1);
            const mean = slice.reduce((a, b) => a + b) / window;
            const squareDiffs = slice.map(value => Math.pow(value - mean, 2));
            const variance = squareDiffs.reduce((a, b) => a + b) / window;
            std.push(Math.sqrt(variance));
        }
        
        return std;
    }

    /**
     * 计算MACD指标
     * @param {Array<number>} data - 价格数组
     * @returns {Object} - MACD数据
     */
    static calculateMACD(data) {
        const shortTerm = 12;
        const longTerm = 26;
        const signalTerm = 9;

        const ema12 = this.calculateEMA(data, shortTerm);
        const ema26 = this.calculateEMA(data, longTerm);
        const macdLine = ema12.map((v, i) => v - ema26[i]);
        const signalLine = this.calculateEMA(macdLine, signalTerm);
        const histogram = macdLine.map((v, i) => v - signalLine[i]);

        return {
            macdLine,
            signalLine,
            histogram
        };
    }

    /**
     * 计算指数移动平均
     * @param {Array<number>} data - 数据数组
     * @param {number} window - 窗口大小
     * @returns {Array<number>} - EMA数组
     */
    static calculateEMA(data, window) {
        const k = 2 / (window + 1);
        const ema = [data[0]];
        
        for (let i = 1; i < data.length; i++) {
            ema.push(data[i] * k + ema[i - 1] * (1 - k));
        }
        
        return ema;
    }
}

export default YahooFinanceAPI;