import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import { nextTick } from 'vue';
import OrderBookList from '@/components/OrderBookList.vue';
import { OrderBookHighlight } from '@/lib/enum/common';

describe('OrderBookList', () => {
  const mockOrderBookData = [
    { price: 50000, size: 1.5, total: 1.5, percentage: 50 },
    { price: 49900, size: 2, total: 3.5, percentage: 100 },
  ];

  const createWrapper = (props = {}) => {
    return mount(OrderBookList, {
      props: {
        orderBookData: mockOrderBookData,
        isAsks: true,
        ...props,
      },
    });
  };

  describe('Asks 跟 Bids 的 UI 變化', () => {
    it('isAsks 屬性決定價格樣式', () => {
      const testCases = [
        { isAsks: true, expectedClass: '.price-asks' },
        { isAsks: false, expectedClass: '.price-bids' },
      ];

      for (const { isAsks, expectedClass } of testCases) {
        const wrapper = createWrapper({ isAsks });

        expect(wrapper.find(expectedClass).exists()).toBe(true);
      }
    });

    it('新價格觸發對應的 flash 動畫', async () => {
      const testCases = [
        { isAsks: true, expectedClass: 'flash-asks' },
        { isAsks: false, expectedClass: 'flash-bids' },
      ];

      for (const { isAsks, expectedClass } of testCases) {
        const wrapper = createWrapper({ isAsks });

        wrapper.vm.highlights[0] = OrderBookHighlight.NEW;
        await nextTick();

        expect(wrapper.find('.order-container').classes()).toContain(expectedClass);
      }
    });

    it('size 增減觸發視覺樣式改變', async () => {
      const wrapper = createWrapper();
      const testCases = [
        { highlight: OrderBookHighlight.UP, expectedClass: 'up' },
        { highlight: OrderBookHighlight.DOWN, expectedClass: 'down' },
      ];

      for (const { highlight, expectedClass } of testCases) {
        wrapper.vm.highlights[0] = highlight;
        await nextTick();

        const highlightSpan = wrapper.find('.highlight span');
        expect(highlightSpan.classes()).toContain(expectedClass);
      }
    });

    it('size 增減觸發 highlight 狀態', async () => {
      const wrapper = createWrapper();
      const newData = [
        { price: 50000, size: 2.5, total: 2.5, percentage: 60 }, // 數量增加
        { price: 49900, size: 1.5, total: 4, percentage: 100 }, // 數量減少
      ];
      await wrapper.setProps({ orderBookData: newData });
      await nextTick();
      expect(wrapper.vm.highlights[0]).toBe(OrderBookHighlight.UP);
      expect(wrapper.vm.highlights[1]).toBe(OrderBookHighlight.DOWN);
    });

    it('新增價格和動畫結束應該正確處理', async () => {
      const wrapper = createWrapper();

      // 測試新增價格
      const newData = [
        ...mockOrderBookData,
        { price: 50100, size: 1.0, total: 4.5, percentage: 120 },
      ];

      await wrapper.setProps({ orderBookData: newData });
      await nextTick();

      expect(wrapper.vm.highlights[2]).toBe(OrderBookHighlight.NEW);
      expect(wrapper.findAll('.order-container')).toHaveLength(3);

      // 測試動畫結束邏輯
      wrapper.vm.highlights[0] = OrderBookHighlight.UP;
      expect(wrapper.vm.highlights[0]).toBe(OrderBookHighlight.UP);

      const orderContainer = wrapper.find('.order-container');
      await orderContainer.trigger('animationend');

      expect(wrapper.vm.highlights[0]).toBe(null);
    });
  });

  describe('進度條視覺效果', () => {
    it('依照百分比產生不同寬度的進度條', () => {
      const testData = [
        { price: 50000, size: 1, total: 1, percentage: 25 },
        { price: 49900, size: 2, total: 3, percentage: 75 },
        { price: 49800, size: 1, total: 4, percentage: 100 },
      ];

      const wrapper = createWrapper({ orderBookData: testData });
      const progressBars = wrapper.findAll('.progress-bar');

      // 驗證進度條寬度與百分比邏輯的對應
      expect(progressBars[0].attributes('style')).toContain('width: 25%');
      expect(progressBars[1].attributes('style')).toContain('width: 75%');
      expect(progressBars[2].attributes('style')).toContain('width: 100%');
    });

    it('isAsks 屬性決定進度條顏色', () => {
      const colorTests = [
        { isAsks: true, expectedColor: 'rgba(255, 90, 90, 0.12)' }, // 紅色
        { isAsks: false, expectedColor: 'rgba(16, 186, 104, 0.12)' }, // 綠色
      ];

      for (const { isAsks, expectedColor } of colorTests) {
        const wrapper = createWrapper({ isAsks });
        const progressBar = wrapper.find('.progress-bar');
        expect(progressBar.attributes('style')).toContain(expectedColor);
      }
    });
  });
});
