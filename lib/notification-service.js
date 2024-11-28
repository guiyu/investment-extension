class NotificationService {
    constructor() {
        this.defaultOptions = {
            type: 'basic',
            iconUrl: '/assets/icons/icon128.png',
            priority: 1
        };
    }

    /**
     * 发送一般通知
     * @param {string} title - 通知标题
     * @param {string} message - 通知内容
     * @param {Object} options - 附加选项
     */
    async notify(title, message, options = {}) {
        try {
            const notificationOptions = {
                ...this.defaultOptions,
                ...options,
                title,
                message
            };

            await chrome.notifications.create('', notificationOptions);
        } catch (error) {
            console.error('Notification error:', error);
        }
    }

    /**
     * 发送投资提醒
     * @param {string} symbol - 股票代码
     * @param {number} price - 当前价格
     * @param {number} shares - 建议购买股数
     * @param {number} amount - 投资金额
     */
    async sendInvestmentReminder(symbol, price, shares, amount) {
        const message = `
            建议购买 ${symbol}
            当前价格: $${price.toFixed(2)}
            建议购买: ${shares} 股
            投资金额: $${amount.toFixed(2)}
        `.trim();

        await this.notify('投资提醒', message, {
            buttons: [
                { title: '查看详情' },
                { title: '稍后提醒' }
            ]
        });
    }

    /**
     * 发送再平衡提醒
     * @param {Object} rebalanceInfo - 再平衡信息
     */
    async sendRebalanceAlert(rebalanceInfo) {
        const message = `
            投资组合需要再平衡
            最大偏差: ${(rebalanceInfo.maxDeviation * 100).toFixed(2)}%
            建议交易数: ${rebalanceInfo.tradesCount}
        `.trim();

        await this.notify('再平衡提醒', message, {
            buttons: [
                { title: '立即再平衡' },
                { title: '查看详情' }
            ]
        });
    }

    /**
     * 发送市场开盘提醒
     * @param {Date} openTime - 开盘时间
     */
    async sendMarketOpenReminder(openTime) {
        const message = `美股市场将于 ${openTime.toLocaleTimeString()} 开盘`;
        await this.notify('市场开盘提醒', message);
    }

    /**
     * 发送价格预警
     * @param {string} symbol - 股票代码
     * @param {number} price - 当前价格
     * @param {string} condition - 触发条件
     */
    async sendPriceAlert(symbol, price, condition) {
        const message = `
            ${symbol} 价格提醒
            当前价格: $${price.toFixed(2)}
            触发条件: ${condition}
        `.trim();

        await this.notify('价格提醒', message, { priority: 2 });
    }

    /**
     * 发送错误通知
     * @param {string} title - 错误标题
     * @param {string} error - 错误信息
     */
    async sendErrorNotification(title, error) {
        await this.notify(title, error, {
            type: 'basic',
            priority: 2,
            requireInteraction: true
        });
    }

    /**
     * 发送成功通知
     * @param {string} title - 标题
     * @param {string} message - 消息内容
     */
    async sendSuccessNotification(title, message) {
        await this.notify(title, message, {
            type: 'basic',
            priority: 1,
            timeoutInMs: 5000
        });
    }

    /**
     * 清除所有通知
     */
    async clearAllNotifications() {
        try {
            await chrome.notifications.getAll((notifications) => {
                Object.keys(notifications).forEach(id => {
                    chrome.notifications.clear(id);
                });
            });
        } catch (error) {
            console.error('Error clearing notifications:', error);
        }
    }
}

export default NotificationService;