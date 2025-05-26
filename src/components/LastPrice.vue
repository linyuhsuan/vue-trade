<template>
  <div
    class="last-price"
    :class="{
      up: props.priceData.price > props.priceData.prevPrice,
      down: props.priceData.price < props.priceData.prevPrice,
      same: props.priceData.price === props.priceData.prevPrice,
    }"
  >
    <span>{{ formatNumber(props.priceData.price) }}</span>
    <img
      :class="{
        up: props.priceData.price > props.priceData.prevPrice,
        down: props.priceData.price < props.priceData.prevPrice,
        same: props.priceData.price === props.priceData.prevPrice,
      }"
      class="arrow"
      src="@/assets/arrowDown.svg"
      alt="arrow"
    />
  </div>
</template>

<script setup>
import { formatNumber } from '@/lib/utils/stringUtils';

const props = defineProps({
  priceData: {
    type: Object,
    required: true,
  },
});
</script>
