// 票据类型
export type BillType = 'bank_acceptance' | 'commercial_acceptance' | 'electronic';

// 票据状态
export type BillStatus = 'active' | 'partial_split' | 'fully_split' | 'matured' | 'expired';

// 票据接口
export interface Bill {
  id: string;
  billNo: string;            // 票据号
  type: BillType;            // 票据类型
  amount: number;            // 票面金额
  remainingAmount: number;   // 可拆余额
  issueDate: string;         // 出票日期
  dueDate: string;           // 到期日期
  issuer: string;            // 出票方（核心企业）
  payer: string;             // 付款方
  payee: string;             // 收款人（我方）
  status: BillStatus;        // 状态
  splitCount: number;        // 已拆次数
  createdAt: string;
}

// 收款方类型
export type PayeeCategory = 'material' | 'logistics' | 'processor' | 'other';

// 收款方接口
export interface Payee {
  id: string;
  name: string;              // 公司名称
  category: PayeeCategory;   // 类别
  contactName: string;       // 联系人
  contactPhone: string;      // 联系电话
  bankName: string;          // 开户行
  bankAccount: string;       // 银行账号
  isFavorite: boolean;       // 是否常用
  totalReceived: number;     // 累计收款金额
  lastUsedAt: string;        // 最近使用时间
}

// 拆分单状态
export type SplitStatus = 'pending_boss' | 'rejected' | 'pending_sign' | 'signed' | 'overdue';

// 拆分记录接口
export interface SplitRecord {
  id: string;
  billId: string;            // 关联票据ID
  billNo: string;            // 关联票据号
  amount: number;            // 拆分金额
  purpose: string;           // 背书用途
  payeeId: string;           // 收款方ID
  payeeName: string;         // 收款方名称
  payeeCategory: PayeeCategory;
  status: SplitStatus;       // 状态
  createdAt: string;         // 创建时间
  approvedAt?: string;       // 老板批准时间
  approvedBy?: string;       // 批准人
  signedAt?: string;         // 对方签收时间
  rejectedAt?: string;       // 驳回时间
  rejectReason?: string;     // 驳回原因
  urgedCount: number;        // 催办次数
  lastUrgedAt?: string;      // 最近催办时间
  voucherNo: string;         // 凭证号
}

// 待办类型
export type TodoType = 'boss_approval' | 'sign_confirm' | 'overdue_urge' | 'mature_remind';

// 待办接口
export interface Todo {
  id: string;
  type: TodoType;
  relatedId: string;         // 关联ID（票据或拆分单）
  title: string;
  description: string;
  amount?: number;
  createdAt: string;
  deadlineAt: string;
  isDone: boolean;
  priority: 'high' | 'medium' | 'low';
}

// 统计数据
export interface DashboardStats {
  totalBillAmount: number;   // 票据总金额
  remainingAmount: number;   // 总可拆余额
  pendingApproval: number;   // 待审批数量
  pendingSign: number;       // 待签收数量
  overdueCount: number;      // 逾期数量
  monthlySplitAmount: number; // 本月拆分金额
  monthlySignedAmount: number; // 本月已签收金额
}

// 筛选条件
export interface BillFilter {
  status?: BillStatus[];
  keyword?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface SplitFilter {
  status?: SplitStatus[];
  payeeCategory?: PayeeCategory[];
  payeeId?: string;
  keyword?: string;
  dateFrom?: string;
  dateTo?: string;
}

// 票据类型名称映射
export const BILL_TYPE_LABEL: Record<BillType, string> = {
  bank_acceptance: '银行承兑',
  commercial_acceptance: '商业承兑',
  electronic: '电子票据'
};

// 票据状态名称映射
export const BILL_STATUS_LABEL: Record<BillStatus, string> = {
  active: '可用',
  partial_split: '部分拆分',
  fully_split: '已拆完',
  matured: '已到期',
  expired: '已逾期'
};

// 收款方类别名称
export const PAYEE_CATEGORY_LABEL: Record<PayeeCategory, string> = {
  material: '原料商',
  logistics: '物流商',
  processor: '加工商',
  other: '其他'
};

// 拆分状态名称
export const SPLIT_STATUS_LABEL: Record<SplitStatus, string> = {
  pending_boss: '待老板确认',
  rejected: '已驳回',
  pending_sign: '待对方签收',
  signed: '已签收',
  overdue: '逾期未签'
};

// 待办类型名称
export const TODO_TYPE_LABEL: Record<TodoType, string> = {
  boss_approval: '待审批',
  sign_confirm: '待签收',
  overdue_urge: '逾期催办',
  matured_remind: '到期提醒'
};
