export const formatNumber = (num: number) => {
  return num.toLocaleString('en-US', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 5,
  });
};