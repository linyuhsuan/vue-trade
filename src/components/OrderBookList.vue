<template>
  <div
    v-for="(item, index) in orderBookData"
    :key="item.price"
    class="order-container"
    :class="{
      'flash-asks': highlights[index] === OrderBookHighlight.NEW && props.isAsks,
      'flash-bids': highlights[index] === OrderBookHighlight.NEW && !props.isAsks,
    }"
    @animationend="removeHighlight(index)"
  >
    <div :class="props.isAsks ? 'price-asks' : 'price-bids'">{{ formatNumber(item.price) }}</div>
    <div class="highlight">
      <span
        :class="{
          up: highlights[index] === OrderBookHighlight.UP,
          down: highlights[index] === OrderBookHighlight.DOWN,
        }"
        @animationend="removeHighlight(index)"
        >{{ formatNumber(item.size) }}</span
      >
    </div>
    <div class="total-content">
      <div
        class="progress-bar"
        :style="{
          width: `${item.percentage}%`,
          background: props.isAsks ? 'rgba(255, 90, 90, 0.12)' : 'rgba(16, 186, 104, 0.12)',
        }"
      ></div>
      <span>{{ formatNumber(item.total) }}</span>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';
import { formatNumber } from '@/lib/utils/stringUtils';
import { OrderBookHighlight } from '@/lib/enum/common';

const props = defineProps({
  orderBookData: {
    type: Array,
    required: true,
  },
  isAsks: {
    type: Boolean,
    required: true,
  },
});
const highlights = ref([]);

/**
 * 監聽 orderBookData 的變化，根據price與size變化設定 highlights 狀態
 * @param {Array} newVal - 最新的 orderBookData 陣列
 * @param {Array} oldVal - 前一次的 orderBookData 陣列
 * - 若 price 為新出現，設為 new
 * - 若同一 price 的 size 增加，設為 up
 * - 若同一 price 的 size 減少，設為 down
 * - 若同一 price 的 size 沒變，設為 null
 * - 若 highlights 長度大於新資料，去除多餘的 highlight 狀態
 */
watch(
  () => props.orderBookData,
  (newVal, oldVal) => {
    newVal.forEach((item, idx) => {
      const oldItem = oldVal.find((o) => o.price === item.price);
      if (!oldItem) {
        highlights.value[idx] = OrderBookHighlight.NEW;
      } else if (item.size > oldItem.size) {
        highlights.value[idx] = OrderBookHighlight.UP;
      } else if (item.size < oldItem.size) {
        highlights.value[idx] = OrderBookHighlight.DOWN;
      } else {
        highlights.value[idx] = null;
      }
    });
    // 清理不存在的項目
    // if (highlights.value.length > newVal.length) {
    //   highlights.value = highlights.value.slice(0, newVal.length);
    // }
  },
  { immediate: true },
);

// 移除 highlight 狀態
const removeHighlight = (idx) => {
  if (highlights.value[idx]) {
    highlights.value[idx] = null;
  }
};
</script>
