<template>
<div v-for="(item, index) in orderBookData" :key="item.price" class="order-row">
  <div :class="props.isAsks ? 'price-ask' : 'price-bid'">{{ formatNumber(item.price) }}</div>
  <div
    class="size-cell  highlight"
    
  >
    <span :class="{
      'highlight--up': highlights[index] === 'up',
      'highlight--down': highlights[index] === 'down',
    }"
    @animationend="removeHighlight(index)">{{ formatNumber(item.size) }}</span>
  </div>
  <div class="total-cell">
  <div
    class="progress-bar"
    :style="{
      width: item.percentage + '%',
      background: props.isAsks
        ? 'rgba(255, 90, 90, 0.12)'
        : 'rgba(16, 186, 104, 0.12)',
      right: 0, // 讓進度條從右往左展開
      left: 'auto'
    }"
  ></div>
  <span class="total-content">
    {{ formatNumber(item.total) }}
  </span>
</div>
</div>
</template>

<script setup>
import { ref, watch } from 'vue';
import { formatNumber } from '@/lib/utils/stringUtils';

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

const highlights = ref([]); // 'up' | 'down' | null

watch(
  () => props.orderBookData,
  (newVal, oldVal) => {
    console.log('watch', newVal, oldVal);
    newVal.forEach((item, idx) => {
      const prev = oldVal?.[idx]?.size;
      if (item.size > prev) {
        highlights.value[idx] = 'up';
      } else if (item.size < prev) {
        highlights.value[idx] = 'down';
      } else {
        highlights.value[idx] = null;
      }
    });
    highlights.value.length = newVal.length;
  },
  { immediate: true },
);

function getSizeClass(item, idx) {
  return highlights.value[idx] ? `highlight highlight--${highlights.value[idx]}` : '';
}

function removeHighlight(idx) {
  highlights.value[idx] = null;
}
</script>

<style scoped>
.highlight {
  animation: highlight-fade 1s;
}
.highlight--up {
  background: rgba(0, 255, 0, 0.2);
}
.highlight--down {
  background: rgba(255, 0, 0, 0.2);
}
@keyframes highlight-fade {
  from {
    filter: brightness(1.5);
  }
  to {
    filter: brightness(1);
  }
}
.order-row > .size-cell {
  text-align: right;
  justify-content: center;
  display: flex;
  align-items: center;
}
.price-ask {
  color: #ff5b5a;
}
.price-bid {
  color: #00b15d;
}

.order-row {
  display: flex;
  align-items: center;
  min-height: 32px;
}

.order-row > div {
  flex: 1;
  padding: 0 8px;
  box-sizing: border-box;
}

.total-cell {
  position: relative;
  overflow: hidden;
  text-align: right;
  flex: 1;
}

.progress-bar {
  position: absolute;
  top: 0;
  right: 0;      /* 讓進度條從右邊開始 */
  height: 100%;
  z-index: 0;
  border-radius: 2px;
  transition: width 0.3s;
  pointer-events: none;
}

.total-content {
  position: relative;
  z-index: 1;
  padding-right: 8px;
  display: inline-block;
  text-align: right;
}
</style>
