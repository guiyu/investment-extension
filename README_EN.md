# Investment Portfolio Assistant Chrome Extension

## Overview

Investment Portfolio Assistant is a powerful Chrome extension designed to help investors manage and analyze their investment portfolios efficiently.

### Key Features

- 🔄 Automated Investment Management
- 📊 Portfolio Analysis
- ⚖️ Smart Rebalancing
- 📈 Technical Indicator Analysis
- 🔔 Investment Reminders
- 💹 Real-time Market Monitoring

## Installation Guide

### Developer Installation
1. Clone Repository
```bash
git clone https://github.com/yourusername/investment-portfolio-assistant.git
cd investment-portfolio-assistant
```

2. Install Dependencies
```bash
npm install
```

3. Load Extension in Chrome
- Open Chrome browser
- Navigate to chrome://extensions/
- Enable "Developer mode"
- Click "Load unpacked"
- Select the project directory

### User Installation
1. Visit [Chrome Web Store](#)
2. Click "Add to Chrome"
3. Confirm installation

## Usage Guide

### Basic Features
1. **Investment Management**
   - Set investment plans
   - Automatic execution
   - View investment history

2. **Portfolio Analysis**
   - Asset allocation analysis
   - Return calculation
   - Risk assessment

3. **Rebalancing**
   - Set rebalancing rules
   - Automatic trigger
   - Rebalancing history

### Advanced Features
1. **Technical Analysis**
   - Moving averages
   - MACD indicator
   - RSI indicator

2. **Market Monitoring**
   - Real-time price alerts
   - Market opening reminders
   - Custom price alerts

## Project Structure

```
investment-extension/
├── manifest.json           # Extension configuration
├── popup/                  # Popup window files
│   ├── popup.html         # Popup HTML
│   ├── popup.css          # Popup styles
│   └── popup.js           # Popup logic
├── background/            # Background scripts
│   └── background.js      # Background service
├── content/              # Content scripts
│   └── content.js        # Page injection script
├── lib/                  # Third-party libraries
│   ├── yahoo-finance.js  # Yahoo Finance API wrapper
│   ├── charts.js         # Charts library
│   ├── data-processing.js # Data processing
│   ├── config.js         # Configuration management
│   ├── storage.js        # Storage management
│   └── utils.js          # Utility functions
└── assets/               # Static resources
    └── icons/            # Icon resources
```

## Configuration

### Basic Configuration
```json
{
    "baseInvestment": 1000,
    "smaWindow": 200,
    "stdWindow": 30,
    "minWeight": 0.5,
    "maxWeight": 2
}
```

### Rebalancing Configuration
```json
{
    "rebalanceEnabled": true,
    "rebalancePeriod": "QUARTERLY",
    "rebalanceThreshold": 5,
    "minTradeAmount": 1000
}
```

## API Reference

### Core Classes
- `InvestmentCalculator`: Core investment calculations
- `RebalanceManager`: Rebalancing management
- `StorageManager`: Storage management
- `ConfigManager`: Configuration management

### Utility Functions
- `formatDate()`: Date formatting
- `calculateMA()`: Moving average calculation
- `formatCurrency()`: Currency formatting

## Development Guide

### Requirements
- Node.js >= 14.0.0
- Chrome >= 88

### Development Setup
1. Install development dependencies
```bash
npm install --save-dev
```

2. Run development server
```bash
npm run dev
```

3. Build production version
```bash
npm run build
```

### Coding Standards
- ESLint for code checking
- Google JavaScript Style Guide
- Prettier for code formatting

## License

Copyright (c) 2024 - present. All rights reserved.

This software is proprietary. No part of this software may be copied, modified, distributed, or used without explicit authorization.

## Contact

- Author: Your Name
- Email: your.email@example.com
- GitHub: [your-username](https://github.com/your-username)

## Acknowledgments

- Thanks to [Yahoo Finance](https://finance.yahoo.com/) for data support
- Thanks to all contributors for their support

## Changelog

### v1.0.0 (2024-11-28)
- Initial release
- Basic portfolio management features
- Rebalancing functionality
- Yahoo Finance API integration

## FAQ

### Q: How do I modify investment settings?
A: Click the "Settings" button in the extension popup to access the settings page.

### Q: Where is the data stored?
A: All data is stored locally in Chrome storage and is not uploaded to the cloud.

### Q: How can I backup my data?
A: Use the "Export Data" function in the settings page to backup your data.