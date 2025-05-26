import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import LastPrice from '@/components/LastPrice.vue';

describe('LastPrice.vue', () => {
  const createWrapper = (priceData) => {
    return mount(LastPrice, {
      props: {
        priceData,
      },
    });
  };

  it('渲染元件', () => {
    const priceData = {
      price: 50000,
      prevPrice: 49000,
    };
    const wrapper = createWrapper(priceData);
    expect(wrapper.exists()).toBe(true);
  });

  it('當價格上漲時應該顯示 up 樣式', () => {
    const priceData = {
      price: 50000,
      prevPrice: 49000,
    };
    const wrapper = createWrapper(priceData);
    
    expect(wrapper.classes()).toContain('up');
  });

  it('當價格下跌時應該顯示 down 樣式', () => {
    const priceData = {
      price: 49000,
      prevPrice: 50000,
    };
    const wrapper = createWrapper(priceData);
    
    expect(wrapper.classes()).toContain('down');
  });

  it('當價格相同時應該顯示 same 樣式', () => {
    const priceData = {
      price: 50000,
      prevPrice: 50000,
    };
    const wrapper = createWrapper(priceData);
    
    expect(wrapper.classes()).toContain('same');
  });

  it('應該正確顯示格式化的價格', () => {
    const priceData = {
      price: 50000.123,
      prevPrice: 49000,
    };
    const wrapper = createWrapper(priceData);
    
    expect(wrapper.text()).toContain('50,000.123');
  });

  it('箭頭圖示應該根據價格變化顯示正確的樣式', () => {
    const priceDataUp = {
      price: 50000,
      prevPrice: 49000,
    };
    const wrapperUp = createWrapper(priceDataUp);
    const arrowUp = wrapperUp.find('.arrow');
    
    expect(arrowUp.classes()).toContain('up');

    const priceDataDown = {
      price: 49000,
      prevPrice: 50000,
    };
    const wrapperDown = createWrapper(priceDataDown);
    const arrowDown = wrapperDown.find('.arrow');
    
    expect(arrowDown.classes()).toContain('down');
  });

  it('當價格相同時箭頭應該隱藏', () => {
    const priceData = {
      price: 50000,
      prevPrice: 50000,
    };
    const wrapper = createWrapper(priceData);
    const arrow = wrapper.find('.arrow');
    
    expect(arrow.classes()).toContain('same');
  });
}); 