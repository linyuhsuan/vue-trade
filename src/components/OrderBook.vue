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
    ask
    <OrderBookList :orderBookData="topAsks" :isAsks="true" />
    <!-- 最新價格區域 -->
    <LastPrice :priceData="priceData" />
    <!-- 買單 (bids) -->
    bids
    <OrderBookList :orderBookData="topBids" :isAsks="false" />
  </div>
</template>

<script setup>
import { reactive, computed, onMounted, onBeforeUnmount } from 'vue';
import { useWebSocket } from '@/lib/composables/useWebSocket';
import LastPrice from '@/components/LastPrice.vue';
import OrderBookList from '@/components/OrderBookList.vue';

const orderBook = reactive({
  bids: [], // 買方訂單
  asks: [], // 賣方訂單
  lastSeqNum: null,
});

const priceData = reactive({
  price: null, // 最新價格
  prevPrice: null, // 上一筆價格
});

function calcTopList(list, count = 8, reverse = false) {
  const arr = list.slice(0, count);
  let total = 0;
  const base = reverse ? [...arr].reverse() : arr;
  const withTotal = base.map((item) => {
    total += parseFloat(item[1]);
    return {
      price: item[0],
      size: parseFloat(item[1]),
      total: total,
    };
  });
  const maxTotal = withTotal[withTotal.length - 1]?.total || 1;
  const result = withTotal.map((item) => ({
    ...item,
    percentage: ((item.total / maxTotal) * 100).toFixed(2),
  }));
  return reverse ? result.reverse() : result;
}

const topAsks = computed(() => calcTopList(orderBook.asks, 8, true));
const topBids = computed(() => calcTopList(orderBook.bids, 8, false));

// 更新 orderbook list
const updateOrderList = (updates, isAsk = true) => {
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
  list.sort((a, b) =>
    isAsk ? a[0] - b[0] : b[0] - a[0],
  );
};

// 處理 orderbook Data
const processOrderBookData = (data) => {
  if (data.type === 'snapshot') {
    orderBook.asks = data.asks.map((item) => [parseFloat(item[0]), parseFloat(item[1])]);
    orderBook.bids = data.bids.map((item) => [parseFloat(item[0]), parseFloat(item[1])]);
  } else {
    if (data.prevSeqNum !== orderBook.lastSeqNum || data.seqNum !== orderBook.lastSeqNum + 1) {
      wsOrderBook.resubscribe();
    }
    orderBook.lastSeqNum = data.seqNum;
    if (data.type === 'delta') {
      updateOrderList(data.asks, true);
      updateOrderList(data.bids, false);
    }
  }
};

const processLastPriceData = (data) => {
  if (Array.isArray(data) && data.length > 0) {
    const newPrice = data[0].price;
    priceData.prevPrice = priceData.price;
    priceData.price = newPrice;
  }
};

// websocket: OrderBook
const wsOrderBook = useWebSocket({
  topic: 'update:BTCPFC',
  endPoint: 'oss/futures',
  onData: processOrderBookData,
});

// websocket: Last price
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
