import { create } from 'zustand';
import { Bill, Payee, SplitRecord, Todo, SplitStatus, DashboardStats } from '@/types';
import { mockBills } from '@/data/bills';
import { mockPayees } from '@/data/payees';
import { mockSplitRecords } from '@/data/splitRecords';
import { mockTodos } from '@/data/todos';
import { generateId, generateVoucherNo } from '@/utils/format';
import dayjs from 'dayjs';

interface BillStoreState {
  bills: Bill[];
  payees: Payee[];
  splitRecords: SplitRecord[];
  todos: Todo[];

  // 选中状态
  selectedBillId: string | null;
  selectedPayeeId: string | null;

  // Actions - 票据
  addBill: (bill: Omit<Bill, 'id' | 'createdAt' | 'splitCount' | 'status' | 'remainingAmount'>) => void;
  setSelectedBill: (id: string | null) => void;
  getBillById: (id: string) => Bill | undefined;

  // Actions - 收款方
  addPayee: (payee: Omit<Payee, 'id' | 'totalReceived' | 'lastUsedAt'>) => void;
  toggleFavorite: (id: string) => void;
  setSelectedPayee: (id: string | null) => void;
  getFavoritePayees: () => Payee[];

  // Actions - 拆分
  createSplit: (data: {
    billId: string;
    amount: number;
    purpose: string;
    payeeId: string;
  }) => SplitRecord | null;
  approveSplit: (splitId: string) => void;
  rejectSplit: (splitId: string, reason: string) => void;
  signSplit: (splitId: string) => void;
  urgeSplit: (splitId: string) => void;
  getSplitsByBillId: (billId: string) => SplitRecord[];

  // Actions - 待办
  markTodoDone: (id: string) => void;

  // Actions - 统计
  getDashboardStats: () => DashboardStats;
}

export const useBillStore = create<BillStoreState>((set, get) => ({
  bills: [...mockBills],
  payees: [...mockPayees],
  splitRecords: [...mockSplitRecords],
  todos: [...mockTodos],

  selectedBillId: null,
  selectedPayeeId: null,

  // 添加票据
  addBill: (billData) => {
    const newBill: Bill = {
      ...billData,
      id: generateId(),
      remainingAmount: billData.amount,
      splitCount: 0,
      status: 'active',
      createdAt: dayjs().format('YYYY-MM-DD HH:mm:ss')
    };
    set((state) => ({ bills: [newBill, ...state.bills] }));
  },

  setSelectedBill: (id) => set({ selectedBillId: id }),
  getBillById: (id) => get().bills.find((b) => b.id === id),

  // 收款方
  addPayee: (payeeData) => {
    const newPayee: Payee = {
      ...payeeData,
      id: generateId(),
      totalReceived: 0,
      lastUsedAt: dayjs().format('YYYY-MM-DD HH:mm:ss')
    };
    set((state) => ({ payees: [newPayee, ...state.payees] }));
  },

  toggleFavorite: (id) => {
    set((state) => ({
      payees: state.payees.map((p) =>
        p.id === id ? { ...p, isFavorite: !p.isFavorite } : p
      )
    }));
  },

  setSelectedPayee: (id) => set({ selectedPayeeId: id }),
  getFavoritePayees: () => get().payees.filter((p) => p.isFavorite),

  // 创建拆分
  createSplit: ({ billId, amount, purpose, payeeId }) => {
    const state = get();
    const bill = state.bills.find((b) => b.id === billId);
    const payee = state.payees.find((p) => p.id === payeeId);

    if (!bill || !payee) {
      console.error('[Split] 票据或收款方不存在');
      return null;
    }
    if (amount > bill.remainingAmount) {
      console.error('[Split] 拆分金额超出可拆余额');
      return null;
    }
    if (amount <= 0) {
      console.error('[Split] 拆分金额必须大于0');
      return null;
    }

    const now = dayjs();
    const newSplit: SplitRecord = {
      id: generateId(),
      billId: bill.id,
      billNo: bill.billNo,
      amount,
      purpose,
      payeeId: payee.id,
      payeeName: payee.name,
      payeeCategory: payee.category,
      status: 'pending_boss',
      createdAt: now.format('YYYY-MM-DD HH:mm:ss'),
      urgedCount: 0,
      voucherNo: generateVoucherNo()
    };

    // 更新票据余额和状态
    const newRemaining = bill.remainingAmount - amount;
    const newSplitCount = bill.splitCount + 1;
    const newStatus: SplitStatus = newRemaining === 0 ? 'fully_split' : 'partial_split';

    set((state) => ({
      splitRecords: [newSplit, ...state.splitRecords],
      bills: state.bills.map((b) =>
        b.id === billId
          ? {
              ...b,
              remainingAmount: newRemaining,
              splitCount: newSplitCount,
              status: newRemaining === 0 ? 'fully_split' : b.status === 'active' ? 'partial_split' : b.status
            }
          : b
      ),
      payees: state.payees.map((p) =>
        p.id === payeeId
          ? {
              ...p,
              totalReceived: p.totalReceived + amount,
              lastUsedAt: now.format('YYYY-MM-DD HH:mm:ss')
            }
          : p
      ),
      todos: [
        {
          id: generateId(),
          type: 'boss_approval',
          relatedId: newSplit.id,
          title: `待审批：${payee.name} ${(amount / 10000).toFixed(0)}万元`,
          description: `${purpose} - 票据号 ${bill.billNo.slice(0, 4)}****${bill.billNo.slice(-4)}`,
          amount,
          createdAt: now.format('YYYY-MM-DD HH:mm:ss'),
          deadlineAt: now.add(2, 'day').format('YYYY-MM-DD HH:mm:ss'),
          isDone: false,
          priority: 'high'
        },
        ...state.todos
      ]
    }));

    console.info('[Split] 创建拆分单成功:', newSplit.id);
    return newSplit;
  },

  // 老板批准
  approveSplit: (splitId) => {
    const now = dayjs();
    set((state) => ({
      splitRecords: state.splitRecords.map((s) =>
        s.id === splitId
          ? {
              ...s,
              status: 'pending_sign',
              approvedAt: now.format('YYYY-MM-DD HH:mm:ss'),
              approvedBy: '李总'
            }
          : s
      ),
      todos: state.todos.map((t) =>
        t.relatedId === splitId && t.type === 'boss_approval'
          ? { ...t, isDone: true }
          : t
      )
    }));
    console.info('[Split] 审批通过:', splitId);
  },

  // 老板驳回
  rejectSplit: (splitId, reason) => {
    const now = dayjs();
    const state = get();
    const split = state.splitRecords.find((s) => s.id === splitId);
    if (!split) return;

    // 退回金额到票据
    set((state) => ({
      splitRecords: state.splitRecords.map((s) =>
        s.id === splitId
          ? {
              ...s,
              status: 'rejected',
              rejectedAt: now.format('YYYY-MM-DD HH:mm:ss'),
              rejectReason: reason
            }
          : s
      ),
      bills: state.bills.map((b) =>
        b.id === split.billId
          ? {
              ...b,
              remainingAmount: b.remainingAmount + split.amount,
              splitCount: Math.max(0, b.splitCount - 1),
              status: b.remainingAmount + split.amount === b.amount ? 'active' : 'partial_split'
            }
          : b
      ),
      todos: state.todos.map((t) =>
        t.relatedId === splitId && t.type === 'boss_approval'
          ? { ...t, isDone: true }
          : t
      )
    }));
    console.info('[Split] 审批驳回:', splitId, reason);
  },

  // 对方签收
  signSplit: (splitId) => {
    const now = dayjs();
    set((state) => ({
      splitRecords: state.splitRecords.map((s) =>
        s.id === splitId
          ? {
              ...s,
              status: 'signed',
              signedAt: now.format('YYYY-MM-DD HH:mm:ss')
            }
          : s
      ),
      todos: state.todos.map((t) =>
        t.relatedId === splitId && (t.type === 'sign_confirm' || t.type === 'overdue_urge')
          ? { ...t, isDone: true }
          : t
      )
    }));
    console.info('[Split] 签收完成:', splitId);
  },

  // 催办
  urgeSplit: (splitId) => {
    const now = dayjs();
    set((state) => ({
      splitRecords: state.splitRecords.map((s) =>
        s.id === splitId
          ? {
              ...s,
              urgedCount: s.urgedCount + 1,
              lastUrgedAt: now.format('YYYY-MM-DD HH:mm:ss')
            }
          : s
      )
    }));
    console.info('[Split] 发送催办:', splitId);
  },

  getSplitsByBillId: (billId) => get().splitRecords.filter((s) => s.billId === billId),

  // 待办
  markTodoDone: (id) => {
    set((state) => ({
      todos: state.todos.map((t) => (t.id === id ? { ...t, isDone: true } : t))
    }));
  },

  // 统计数据
  getDashboardStats: () => {
    const state = get();
    const now = dayjs();
    const thisMonthStart = now.startOf('month');

    const totalBillAmount = state.bills.reduce((sum, b) => sum + b.amount, 0);
    const remainingAmount = state.bills.reduce((sum, b) => sum + b.remainingAmount, 0);
    const pendingApproval = state.splitRecords.filter((s) => s.status === 'pending_boss').length;
    const pendingSign = state.splitRecords.filter((s) => s.status === 'pending_sign').length;
    const overdueCount = state.splitRecords.filter((s) => s.status === 'overdue').length;

    const monthlySplitAmount = state.splitRecords
      .filter((s) => dayjs(s.createdAt).isAfter(thisMonthStart) || dayjs(s.createdAt).isSame(thisMonthStart))
      .reduce((sum, s) => sum + s.amount, 0);

    const monthlySignedAmount = state.splitRecords
      .filter(
        (s) =>
          s.status === 'signed' &&
          s.signedAt &&
          (dayjs(s.signedAt).isAfter(thisMonthStart) || dayjs(s.signedAt).isSame(thisMonthStart))
      )
      .reduce((sum, s) => sum + s.amount, 0);

    return {
      totalBillAmount,
      remainingAmount,
      pendingApproval,
      pendingSign,
      overdueCount,
      monthlySplitAmount,
      monthlySignedAmount
    };
  }
}));
