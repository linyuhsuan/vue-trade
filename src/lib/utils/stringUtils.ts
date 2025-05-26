export const formatNumber = (num: number) => {
  if (num === null || num === undefined || isNaN(num as number)) return '';
  const n = Number(num);
  const [intPart, decPart] = n.toString().split('.');
  // 加千分號
  const intWithComma = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  if (!decPart || Number(decPart) === 0) {
    return intWithComma;
  }
  // 小數部分不補0
  return `${intWithComma}.${decPart.replace(/0+$/, '')}`;
};