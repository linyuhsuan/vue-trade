# vue-trade


[![Vue 3](https://img.shields.io/badge/vue-3.x-brightgreen.svg)](https://vuejs.org/)
[![Vite](https://img.shields.io/badge/vite-^4.0-blue.svg)](https://vitejs.dev/)
[![Tested with Vitest](https://img.shields.io/badge/tested%20with-vitest-6E9F18.svg)](https://vitest.dev/)

---

> **vue-trade** 是一個高效、模組化的即時交易 orderbook 前端專案，基於 Vue 3 + Vite，支援 WebSocket 實時行情、價格動畫、累積量百分比視覺化，並具備完善的單元測試。

---

## 目錄
- [特色](#特色)
- [專案結構](#專案結構)
- [安裝與啟動](#安裝與啟動)
- [測試](#測試)
- [技術棧](#技術棧)
- [元件說明](#元件說明)
- [WebSocket API](#websocket-api)

---

## 特色
- 🚀 **即時 Order Book 與 LastPrice**：WebSocket 連線，毫秒級更新買賣盤。
- 🎨 **價格/數量動畫**：新價格、數量變動有明顯動畫提示。
- 📊 **累積量百分比條**：每一檔位的累積量以進度條視覺化。
- 💡 **價格漲跌顏色**：最新成交價根據漲跌自動變色。
- 🧪 **高可測試性**：Vitest 單元測試覆蓋所有核心邏輯。
- 🧩 **模組化設計**：元件、工具、WebSocket composable 完全分離。

---

## 專案結構

```
vue-trade/
├── src/
│   ├── components/
│   │   ├── OrderBookList.vue
│   │   └── LastPrice.vue
│   ├── lib/
│   │   ├── utils/stringUtils.ts
│   │   ├── enum/common.ts
│   │   └── composables/useWebSocket.ts
│   ├── App.vue
├── tests/
│   ├── OrderBookList.test.js
│   └── LastPrice.test.js
│   └── App.test.js
├── public/
│   └── assets/arrowDown.svg
├── package.json
├── vite.config.js
└── README.md
```

---

## 安裝與啟動

```bash
npm install
npm run dev
```

瀏覽器開啟 [http://localhost:5173](http://localhost:5173)

---

## 測試

```bash
npm run test
```

---

## 技術棧
- [Vue 3](https://vuejs.org/)
- [Vite](https://vitejs.dev/)
- [Vitest](https://vitest.dev/)
- [SCSS](https://sass-lang.com/)

---

## 元件說明

### OrderBookList
- **動態渲染**：根據 `isAsks` 決定渲染買/賣價，最多顯示 8 檔，並垂直置中顯示。
- **動畫效果**：
    - 新價格出現：整行閃爍動畫（紅/綠背景）
    - 數量變動：size cell 閃爍動畫（綠色增、紅色減）
- **進度條**：根據累積百分比顯示，asks 紅色、bids 綠色。
- **互動體驗**：整行 hover 有背景色，數字格式化（千分位、去除多餘 0）。
- **高可測試性**：所有動畫、highlight、資料變化皆有單元測試覆蓋。

### LastPrice
- **價格顯示**：自動格式化，支援小數點。
- **漲跌顏色**：根據 last price 與 prev price 自動切換 up/down/same 樣式，並顯示對應箭頭。
- **動畫與樣式**：根據規格自動切換背景色、文字色。

---

## WebSocket API
- **OrderBook**: `wss://ws.btse.com/ws/oss/futures`
- **LastPrice**: `wss://ws.btse.com/ws/futures`
