import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import OrderBook from '@/components/OrderBook.vue';
import { OrderBookType } from '@/lib/enum/common';

// 模擬 useWebSocket composable
const mockResubscribe = vi.fn();
vi.mock('@/lib/composables/useWebSocket', () => ({
  useWebSocket: vi.fn(() => ({
    connectWebSocket: vi.fn(),
    resubscribe: mockResubscribe,
    value: {
      close: vi.fn(),
    },
  })),
}));

describe('OrderBook', () => {
  let wrapper;

  beforeEach(() => {
    vi.clearAllMocks();
    wrapper = mount(OrderBook, {
      global: {
        stubs: {
          LastPrice: true,
          OrderBookList: true,
        },
      },
    });

    // 設定初始測試資料
    wrapper.vm.orderBook.asks = [
      [50100, 1.5],
      [50200, 2],
    ];
    wrapper.vm.orderBook.bids = [
      [49900, 1],
      [49800, 1.5],
    ];
    wrapper.vm.orderBook.lastSeqNum = 100;
    wrapper.vm.priceData.price = 50000;
  });

  describe('基本渲染與元件整合', () => {
    it('應該正確渲染 OrderBook 結構並包含子元件', () => {
      expect(wrapper.find('.order-book').exists()).toBe(true);
      expect(wrapper.text()).toContain('Order Book');
      expect(wrapper.findComponent({ name: 'LastPrice' }).exists()).toBe(true);
      expect(wrapper.findAllComponents({ name: 'OrderBookList' })).toHaveLength(2);

      // 驗證傳遞給 OrderBookList 的 props
      const orderBookLists = wrapper.findAllComponents({ name: 'OrderBookList' });
      expect(orderBookLists[0].props('isAsks')).toBe(true); // 第一個是 asks
      expect(orderBookLists[1].props('isAsks')).toBe(false); // 第二個是 bids
    });
  });

  describe('OrderBook 資料處理邏輯', () => {
    it('處理 snapshot 初始化', () => {
      const snapshotData = {
        type: OrderBookType.SNAPSHOT,
        asks: [
          ['50100', '1.5'],
          ['50200', '2.0'],
        ],
        bids: [
          ['49900', '1.0'],
          ['49800', '1.5'],
        ],
      };

      wrapper.vm.processOrderBookData(snapshotData);

      // 驗證資料正確轉換為數字格式
      expect(wrapper.vm.orderBook.asks).toEqual([
        [50100, 1.5],
        [50200, 2.0],
      ]);
      expect(wrapper.vm.orderBook.bids).toEqual([
        [49900, 1.0],
        [49800, 1.5],
      ]);
    });

    it('處理 delta 增量更新', () => {
      const deltaData = {
        type: OrderBookType.DELTA,
        seqNum: 101,
        prevSeqNum: 100,
        asks: [
          ['50100', '2.0'],
          ['50300', '1.0'],
        ], // 更新現有 + 新增
        bids: [
          ['49900', '0'],
          ['49700', '2.0'],
        ], // 刪除 + 新增
      };

      wrapper.vm.processOrderBookData(deltaData);

      
      const updatedAsk = wrapper.vm.orderBook.asks.find((item) => item[0] === 50100);
      expect(updatedAsk[1]).toBe(2); // 更新

      const hasNewAsk = wrapper.vm.orderBook.asks.some((item) => item[0] === 50300);
      expect(hasNewAsk).toBe(true); // 新增

      const hasDeletedBid = wrapper.vm.orderBook.bids.some((item) => item[0] === 49900);
      expect(hasDeletedBid).toBe(false); // 刪除

      const hasNewBid = wrapper.vm.orderBook.bids.some((item) => item[0] === 49700);
      expect(hasNewBid).toBe(true); // 新增
    });

    it('序號不連續時應該觸發重新訂閱', () => {
      const deltaData = {
        type: OrderBookType.DELTA,
        seqNum: 105,
        prevSeqNum: 103,
        asks: [],
        bids: [],
      };
      wrapper.vm.processOrderBookData(deltaData);
      expect(mockResubscribe).toHaveBeenCalled();
    });
  });

  describe('價格資料處理邏輯', () => {
    it('更新最新價格並保留前一個價格', () => {
      const newPriceData = [{ price: 50500 }];
      wrapper.vm.processLastPriceData(newPriceData);

      expect(wrapper.vm.priceData.prevPrice).toBe(50000);
      expect(wrapper.vm.priceData.price).toBe(50500);
    });
  });

  describe('計算邏輯與 UI 資料轉換', () => {
    it('計算 asks 的累積總量和百分比', () => {
      wrapper.vm.orderBook.asks = [
        [50100, 1],
        [50200, 2],
        [50300, 3],
      ];
      const result = wrapper.vm.topAsks;
      // 驗證 price 排序結果（低到高顯示）
      expect(result[0].price).toBe(50100);
      expect(result[1].price).toBe(50200);
      expect(result[2].price).toBe(50300);

      // 驗證累積總量計算（從高價往低價累積，顯示順序是低到高）
      expect(result[0].total).toBe(6.0);
      expect(result[1].total).toBe(5.0);
      expect(result[2].total).toBe(3.0);

      // 驗證百分比計算
      expect(result[0].percentage).toBe(100);
      expect(result[1].percentage).toBeCloseTo(83.33);
      expect(result[2].percentage).toBe(50);
    });

    it('計算 bids 的累積總量和百分比', () => {
      wrapper.vm.orderBook.bids = [
        [49900, 1],
        [49800, 2],
        [49700, 3],
      ];

      const result = wrapper.vm.topBids;

      // 驗證排序（高到低顯示）
      expect(result[0].price).toBe(49900);
      expect(result[1].price).toBe(49800);
      expect(result[2].price).toBe(49700);

      // 驗證累積總量計算（從高價開始累積）
      expect(result[0].total).toBe(1.0);
      expect(result[1].total).toBe(3.0); 
      expect(result[2].total).toBe(6.0);

      // 驗證百分比計算
      expect(result[0].percentage).toBeCloseTo(16.67);
      expect(result[1].percentage).toBe(50);
      expect(result[2].percentage).toBe(100);
    });

    it('應該限制顯示最多 8 筆資料', () => {
      // 設置超過 8 筆的資料
      const manyAsks = Array.from({ length: 15 }, (_, i) => [50000 + i * 100, 1.0]);
      wrapper.vm.orderBook.asks = manyAsks;

      const result = wrapper.vm.topAsks;
      expect(result).toHaveLength(8);
    });
  });

});
