import dayjs from 'dayjs';

// 金额格式化：保留2位小数，千分位分隔
export const formatAmount = (amount: number): string => {
  return amount.toLocaleString('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};

// 金额大金额显示（万元）
export const formatAmountWan = (amount: number): string => {
  if (amount >= 10000) {
    return (amount / 10000).toFixed(2) + '万';
  }
  return formatAmount(amount);
};

// 票据号脱敏：前4后4，中间用*号
export const maskBillNo = (billNo: string): string => {
  if (billNo.length <= 8) return billNo;
  return billNo.slice(0, 4) + ' **** ' + billNo.slice(-4);
};

// 银行卡号脱敏
export const maskBankAccount = (account: string): string => {
  if (account.length <= 8) return account;
  return account.slice(0, 4) + ' **** **** ' + account.slice(-4);
};

// 格式化日期
export const formatDate = (dateStr: string, format: string = 'YYYY-MM-DD'): string => {
  return dayjs(dateStr).format(format);
};

// 格式化日期时间
export const formatDateTime = (dateStr: string): string => {
  return dayjs(dateStr).format('YYYY-MM-DD HH:mm');
};

// 计算距今天数（正数=未来天数，负数=已过天数）
export const daysFromNow = (dateStr: string): number => {
  return dayjs(dateStr).diff(dayjs(), 'day');
};

// 人性化日期显示
export const humanizeDate = (dateStr: string): string => {
  const days = daysFromNow(dateStr);
  if (days === 0) return '今天';
  if (days === 1) return '明天';
  if (days === -1) return '昨天';
  if (days > 0 && days <= 7) return `${days}天后`;
  if (days < 0 && days >= -7) return `${Math.abs(days)}天前`;
  return formatDate(dateStr);
};

// 生成凭证号
export const generateVoucherNo = (prefix: string = 'PZ'): string => {
  const now = dayjs();
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `${prefix}${now.format('YYYYMMDDHHmmss')}${random}`;
};

// 生成唯一ID
export const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
};

// 计算剩余百分比
export const calcRemainingPercent = (total: number, remaining: number): number => {
  if (total === 0) return 0;
  return Math.round((remaining / total) * 100);
};
