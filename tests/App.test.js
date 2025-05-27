import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import App from '@/App.vue';
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

describe('App', () => {
  let wrapper;

  beforeEach(() => {
    vi.clearAllMocks();
    wrapper = mount(App, {
      global: {
        stubs: {
          LastPrice: true,
          OrderBookList: true,
        },
      },
    });

    // 設定初始測試資料
    wrapper.vm.orderBook.asks = [
      [109824.1, 77900],
      [109824.4, 86550],
    ];
    wrapper.vm.orderBook.bids = [
      [109794.5, 360],
      [109785.3, 30900],
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
    it('處理 delta 增量更新', () => {
      const deltaData = {
        type: OrderBookType.DELTA,
        seqNum: 101,
        prevSeqNum: 100,
        asks: [
          ['109824.1', '80000'], // 更新
          ['109825.0', '50000'], // 新增
        ],
        bids: [
          ['109794.5', '0'], // 刪除
          ['109780.0', '10000'], // 新增
        ],
      };

      wrapper.vm.processOrderBookData(deltaData);

      // 應該有更新的 ask
      const updatedAsk = wrapper.vm.orderBook.asks.find((item) => item[0] === 109824.1);
      expect(updatedAsk[1]).toBe(80000); // 更新

      // 應該有新增的 ask
      const hasNewAsk = wrapper.vm.orderBook.asks.some((item) => item[0] === 109825.0);
      expect(hasNewAsk).toBe(true); // 新增

      // 應該已經刪除的 bid
      const hasDeletedBid = wrapper.vm.orderBook.bids.some((item) => item[0] === 109794.5);
      expect(hasDeletedBid).toBe(false); // 刪除

      // 應該有新增的 bid
      const hasNewBid = wrapper.vm.orderBook.bids.some((item) => item[0] === 109780.0);
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

  describe('計算邏輯與 UI 資料轉換', () => {
    it('計算 asks 的累積總量和百分比', () => {
      wrapper.vm.orderBook.asks = [
        [109824.7, 95200],
        [109824.4, 86550],
        [109824.1, 77900],
      ];
      const result = wrapper.vm.topAsks;
      // 驗證 price 排序結果（高到低顯示）
      expect(result[0].price).toBe(109824.7);
      expect(result[1].price).toBe(109824.4);
      expect(result[2].price).toBe(109824.1);

      // 驗證累積總量（由低價往高價加，對應到高到低排序的每一筆）
      expect(result[2].total).toBe(77900);
      expect(result[1].total).toBe(164450);
      expect(result[0].total).toBe(259650);

      // 驗證百分比
      expect(result[2].percentage).toBeCloseTo(30.0, 2);
      expect(result[1].percentage).toBeCloseTo(63.34, 2);
      expect(result[0].percentage).toBe(100);
    });

    it('計算 bids 的累積總量和百分比', () => {
      wrapper.vm.orderBook.bids = [
        [109794.5, 360],
        [109785.3, 30900],
        [109783.4, 92100],
      ];
      const result = wrapper.vm.topBids;
      // 驗證 price 排序結果（高到低顯示）
      expect(result[0].price).toBe(109794.5);
      expect(result[1].price).toBe(109785.3);
      expect(result[2].price).toBe(109783.4);

      // 驗證累積總量計算（由上往下加）
      expect(result[0].total).toBe(360);
      expect(result[1].total).toBe(31260);
      expect(result[2].total).toBe(123360);

      // 驗證百分比計算
      expect(result[0].percentage).toBeCloseTo(0.29, 2);
      expect(result[1].percentage).toBeCloseTo(25.34, 2);
      expect(result[2].percentage).toBe(100);
    });

    it('應該限制顯示最多 8 筆資料', () => {
      // 設置超過 8 筆的資料，價格由低到高
      const manyAsks = Array.from({ length: 15 }, (_, i) => [109820 + i * 0.1, 10000 + i * 1000]);
      wrapper.vm.orderBook.asks = manyAsks;
      const result = wrapper.vm.topAsks;
      expect(result).toHaveLength(8);
      // 驗證價格由低到高
      expect(result[0].price).toBeCloseTo(109820, 2);
      expect(result[7].price).toBeCloseTo(109820 + 0.1 * 7, 2);
    });
  });
});
