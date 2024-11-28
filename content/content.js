class ContentScript {
    constructor() {
        this.init();
    }

    init() {
        // 等待页面完全加载
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setupPage());
        } else {
            this.setupPage();
        }
    }

    setupPage() {
        if (window.location.hostname === 'finance.yahoo.com') {
            this.injectCustomStyles();
            this.injectCustomButtons();
            this.injectAnalysisTools();
            this.setupMessageListener();
        }
    }

    injectCustomStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .investment-assistant-button {
                background-color: #1a73e8;
                color: white;
                border: none;
                padding: 8px 16px;
                border-radius: 4px;
                cursor: pointer;
                margin: 5px;
                font-size: 14px;
            }

            .investment-assistant-button:hover {
                background-color: #1557b0;
            }

            .analysis-panel {
                position: fixed;
                right: 20px;
                top: 20px;
                background: white;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                padding: 15px;
                border-radius: 8px;
                z-index: 1000;
                max-width: 300px;
            }

            .analysis-panel.hidden {
                display: none;
            }
        `;
        document.head.appendChild(style);
    }

    injectCustomButtons() {
        // 查找合适的注入点
        const targetElement = this.findTargetElement();
        if (!targetElement) return;

        // 创建按钮容器
        const buttonContainer = document.createElement('div');
        buttonContainer.className = 'investment-assistant-buttons';
        
        // 添加分析按钮
        const analyzeButton = document.createElement('button');
        analyzeButton.className = 'investment-assistant-button';
        analyzeButton.textContent = '分析股票';
        analyzeButton.onclick = () => this.toggleAnalysisPanel();
        
        // 添加添加到投资组合按钮
        const addToPortfolioButton = document.createElement('button');
        addToPortfolioButton.className = 'investment-assistant-button';
        addToPortfolioButton.textContent = '添加到投资组合';
        addToPortfolioButton.onclick = () => this.addToPortfolio();

        buttonContainer.appendChild(analyzeButton);
        buttonContainer.appendChild(addToPortfolioButton);
        targetElement.appendChild(buttonContainer);
    }

    injectAnalysisTools() {
        // 创建分析面板
        const panel = document.createElement('div');
        panel.className = 'analysis-panel hidden';
        panel.id = 'investmentAnalysisPanel';

        panel.innerHTML = `
            <h3>投资分析</h3>
            <div id="technicalIndicators"></div>
            <div id="investmentSuggestion"></div>
            <div id="marketTrends"></div>
            <button class="investment-assistant-button" id="closeAnalysis">关闭</button>
        `;

        document.body.appendChild(panel);

        // 添加关闭按钮事件
        document.getElementById('closeAnalysis').onclick = () => {
            panel.classList.add('hidden');
        };
    }

    findTargetElement() {
        // 在Yahoo Finance页面上查找合适的注入点
        // 这里需要根据实际页面结构调整选择器
        const selectors = [
            'div[data-test="quote-header"]',
            '#quote-header-info',
            '#quote-summary'
        ];

        for (const selector of selectors) {
            const element = document.querySelector(selector);
            if (element) return element;
        }

        return null;
    }

    toggleAnalysisPanel() {
        const panel = document.getElementById('investmentAnalysisPanel');
        if (!panel) return;

        if (panel.classList.contains('hidden')) {
            this.updateAnalysis();
            panel.classList.remove('hidden');
        } else {
            panel.classList.add('hidden');
        }
    }

    async updateAnalysis() {
        const symbol = this.getSymbolFromPage();
        if (!symbol) return;

        try {
            // 发送消息给扩展获取分析数据
            const response = await chrome.runtime.sendMessage({
                type: 'getAnalysis',
                symbol: symbol
            });

            if (response.success) {
                this.displayAnalysis(response.data);
            }
        } catch (error) {
            console.error('Error updating analysis:', error);
        }
    }

    async addToPortfolio() {
        const symbol = this.getSymbolFromPage();
        if (!symbol) return;

        try {
            await chrome.runtime.sendMessage({
                type: 'addToPortfolio',
                symbol: symbol
            });

            // 显示成功提示
            this.showNotification('已添加到投资组合');
        } catch (error) {
            console.error('Error adding to portfolio:', error);
            this.showNotification('添加失败', true);
        }
    }

    getSymbolFromPage() {
        // 从URL或页面元素中获取股票代码
        const symbolElement = document.querySelector('[data-symbol]');
        if (symbolElement) {
            return symbolElement.getAttribute('data-symbol');
        }

        // 从URL中提取
        const match = window.location.pathname.match(/quote\/([A-Z0-9.]+)/i);
        return match ? match[1] : null;
    }

    displayAnalysis(data) {
        const indicators = document.getElementById('technicalIndicators');
        const suggestion = document.getElementById('investmentSuggestion');
        const trends = document.getElementById('marketTrends');

        if (indicators && data.technicalIndicators) {
            indicators.innerHTML = `
                <h4>技术指标</h4>
                <p>SMA(200): ${data.technicalIndicators.sma200.toFixed(2)}</p>
                <p>RSI: ${data.technicalIndicators.rsi.toFixed(2)}</p>
                <p>MACD: ${data.technicalIndicators.macd.toFixed(2)}</p>
            `;
        }

        if (suggestion && data.suggestion) {
            suggestion.innerHTML = `
                <h4>投资建议</h4>
                <p>${data.suggestion.recommendation}</p>
                <p>建议仓位: ${data.suggestion.position}%</p>
            `;
        }

        if (trends && data.marketTrends) {
            trends.innerHTML = `
                <h4>市场趋势</h4>
                <p>趋势: ${data.marketTrends.trend}</p>
                <p>波动性: ${data.marketTrends.volatility}</p>
            `;
        }
    }

    showNotification(message, isError = false) {
        const notification = document.createElement('div');
        notification.className = `notification ${isError ? 'error' : 'success'}`;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 10px 20px;
            background: ${isError ? '#ff4444' : '#44ff44'};
            color: white;
            border-radius: 4px;
            z-index: 10000;
        `;
        notification.textContent = message;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    setupMessageListener() {
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            switch (request.type) {
                case 'updateAnalysis':
                    this.updateAnalysis();
                    break;
                case 'showNotification':
                    this.showNotification(request.message, request.isError);
                    break;
            }
            return true;
        });
    }
}

// 初始化内容脚本
new ContentScript();