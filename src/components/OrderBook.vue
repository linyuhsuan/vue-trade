<template>
  <div class="order-book">
    <div class="order-book-header">
      <h2>Order Book</h2>
    </div>
    <div class="order-book-columns">
      <span class="column-header">Price (USD)</span>
      <span class="column-header">Size</span>
      <span class="column-header">Total</span>
    </div>
    <!-- 賣單 (asks) -->
    <OrderBookList :orderBookData="topAsks" :isAsks="true" />
    <!-- Last Price -->
    <LastPrice :priceData="priceData" />
    <!-- 買單 (bids) -->
    <OrderBookList :orderBookData="topBids" :isAsks="false" />
  </div>
</template>

<script setup>
import { reactive, computed, onMounted, onBeforeUnmount } from 'vue';
import LastPrice from '@/components/LastPrice.vue';
import OrderBookList from '@/components/OrderBookList.vue';
import { OrderBookType } from '@/lib/enum/common';
import { useWebSocket } from '@/lib/composables/useWebSocket';

const orderBook = reactive({
  bids: [], // 買方訂單
  asks: [], // 賣方訂單
  lastSeqNum: null,
});

const priceData = reactive({
  price: null, // 最新價格
  prevPrice: null, // 上一筆價格
});

/**
 * 取前 count 筆 orderbook，計算累積總量與百分比
 * @param {Array} list - 原始 orderbook 資料，每筆為 [price, size]
 * @param {number} [count=8] - 取幾筆
 * @param {boolean} [reverse=false] - 是否反轉順序
 * @returns {Array} - 含 price, size, total, percentage 的物件陣列
 */
const calcTopList = (list, count, reverse) => {
  const topList = list.slice(0, count);
  const orderedList = reverse ? [...topList].reverse() : topList;
  let cumulative = 0;
  // 計算累積總量
  const cumulativeList = orderedList.map(([price, size]) => {
    cumulative += parseFloat(size);
    return { price, size: parseFloat(size), total: cumulative };
  });
  const maxCumulative = cumulativeList[cumulativeList.length - 1]?.total || 1;
  // 計算百分比
  const finalList = cumulativeList.map((item) => ({
    ...item,
    percentage: (item.total / maxCumulative) * 100,
  }));
  return reverse ? finalList.reverse() : finalList;
};

const topAsks = computed(() => calcTopList(orderBook.asks, 8, true));
const topBids = computed(() => calcTopList(orderBook.bids, 8, false));

/**
 * 根據更新資料，更新 orderBook 的 asks 或 bids
 * @param {Array} updates - 更新資料陣列，每筆為 [price, size]
 * @param {boolean} isAsk - true 表示更新 asks，false 表示更新 bids
 * - 當 size > 0 時，若 price 已存在，則更新 size，否則新增一筆資料
 * - 當 size = 0 時，若 price 存在，則刪除該筆資料
 */
const updateOrderBook = (updates, isAsk) => {
  const list = isAsk ? orderBook.asks : orderBook.bids;
  updates.forEach(([priceStr, sizeStr]) => {
    const price = parseFloat(priceStr);
    const size = parseFloat(sizeStr);
    const idx = list.findIndex((item) => parseFloat(item[0]) === price);
    if (size > 0) {
      if (idx !== -1) {
        list[idx][1] = size;
      } else {
        list.push([price, size]);
      }
    } else if (idx !== -1) {
      list.splice(idx, 1);
    }
  });
  // 以price 做排序
  list.sort((a, b) => (isAsk ? a[0] - b[0] : b[0] - a[0]));
};

/**
 * 處理 OrderBook 的 WebSocket 資料，根據 type 決定快照或增量更新
 * @param {Object} data - WebSocket 傳來的 OrderBook 資料
 * - 第一筆資料會收到 order book 快照(type 為 snapshot)，後續為增量更新(type 為 delta) 並更新資料
 * - 如果新資料的 prevSeqNum 不等於上一筆的 seqNum，必須重新訂閱取得 snapshot
 */
const processOrderBookData = (data) => {
  if (!data) return;
  if (data.type === OrderBookType.SNAPSHOT) {
    orderBook.asks = data.asks.map((item) => [parseFloat(item[0]), parseFloat(item[1])]);
    orderBook.bids = data.bids.map((item) => [parseFloat(item[0]), parseFloat(item[1])]);
  } else {
    if (data.prevSeqNum !== orderBook.lastSeqNum || data.seqNum !== orderBook.lastSeqNum + 1) {
      wsOrderBook.resubscribe();
    }
    orderBook.lastSeqNum = data.seqNum;
    if (data.type === OrderBookType.DELTA) {
      updateOrderBook(data.asks, true);
      updateOrderBook(data.bids, false);
    }
  }
};

/**
 * 處理最新成交價資料，更新 priceData 物件。
 * @param {Array} data - 最新成交價資料陣列
 */
const processLastPriceData = (data) => {
  if (Array.isArray(data) && data.length > 0) {
    const newPrice = data[0].price;
    priceData.prevPrice = priceData.price;
    priceData.price = newPrice;
  }
};

// websocket: OrderBook API
const wsOrderBook = useWebSocket({
  topic: 'update:BTCPFC',
  endPoint: 'oss/futures',
  onData: processOrderBookData,
});

// websocket: Last price API
const wsLastPrice = useWebSocket({
  topic: 'tradeHistoryApi:BTCPFC',
  endPoint: 'futures',
  onData: processLastPriceData,
});

onMounted(() => {
  wsOrderBook.connectWebSocket();
  wsLastPrice.connectWebSocket();
});

onBeforeUnmount(() => {
  wsOrderBook.value.close();
  wsLastPrice.value.close();
});
</script>
