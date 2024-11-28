/**
 * 通用工具函数集合
 */
export const utils = {
    /**
     * 日期格式化
     * @param {Date} date - 日期对象
     * @param {string} format - 格式字符串
     * @returns {string}
     */
    formatDate(date, format = 'YYYY-MM-DD') {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');

        return format
            .replace('YYYY', year)
            .replace('MM', month)
            .replace('DD', day)
            .replace('HH', hours)
            .replace('mm', minutes)
            .replace('ss', seconds);
    },

    /**
     * 金额格式化
     * @param {number} amount - 金额
     * @param {string} currency - 货币符号
     * @returns {string}
     */
    formatCurrency(amount, currency = '$') {
        return `${currency}${amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
    },

    /**
     * 百分比格式化
     * @param {number} value - 值
     * @param {number} decimals - 小数位数
     * @returns {string}
     */
    formatPercentage(value, decimals = 2) {
        return `${(value * 100).toFixed(decimals)}%`;
    },

    /**
     * 延迟执行
     * @param {number} ms - 延迟毫秒数
     * @returns {Promise}
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    },

    /**
     * 深度克隆对象
     * @param {Object} obj - 要克隆的对象
     * @returns {Object}
     */
    deepClone(obj) {
        if (obj === null || typeof obj !== 'object') return obj;
        if (obj instanceof Date) return new Date(obj);
        if (obj instanceof Array) return obj.map(item => this.deepClone(item));
        
        const cloned = {};
        for (const key in obj) {
            if (Object.prototype.hasOwnProperty.call(obj, key)) {
                cloned[key] = this.deepClone(obj[key]);
            }
        }
        return cloned;
    },

    /**
     * 防抖函数
     * @param {Function} func - 要执行的函数
     * @param {number} wait - 等待时间
     * @returns {Function}
     */
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    /**
     * 节流函数
     * @param {Function} func - 要执行的函数
     * @param {number} limit - 时间限制
     * @returns {Function}
     */
    throttle(func, limit) {
        let inThrottle;
        return function executedFunction(...args) {
            if (!inThrottle) {
                func(...args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    },

    /**
     * 数组分组
     * @param {Array} arr - 数组
     * @param {string} key - 分组键
     * @returns {Object}
     */
    groupBy(arr, key) {
        return arr.reduce((grouped, item) => {
            const groupKey = item[key];
            if (!grouped[groupKey]) {
                grouped[groupKey] = [];
            }
            grouped[groupKey].push(item);
            return grouped;
        }, {});
    },

    /**
     * 计算移动平均
     * @param {Array<number>} data - 数据数组
     * @param {number} period - 周期
     * @returns {Array<number>}
     */
    calculateMA(data, period) {
        const result = [];
        for (let i = 0; i < data.length; i++) {
            if (i < period - 1) {
                result.push(null);
                continue;
            }
            const sum = data.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
            result.push(sum / period);
        }
        return result;
    },

    /**
     * 计算标准差
     * @param {Array<number>} data - 数据数组
     * @returns {number}
     */
    calculateStdDev(data) {
        const mean = data.reduce((a, b) => a + b, 0) / data.length;
        const squaredDiffs = data.map(value => Math.pow(value - mean, 2));
        const variance = squaredDiffs.reduce((a, b) => a + b, 0) / data.length;
        return Math.sqrt(variance);
    },

    /**
     * 错误处理包装器
     * @param {Function} fn - 要包装的函数
     * @returns {Function}
     */
    errorHandler(fn) {
        return async (...args) => {
            try {
                return await fn(...args);
            } catch (error) {
                console.error('Operation failed:', error);
                throw error;
            }
        };
    },

    /**
     * 生成唯一ID
     * @returns {string}
     */
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }
};

export default utils;