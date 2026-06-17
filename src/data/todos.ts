import { Todo } from '@/types';

export const mockTodos: Todo[] = [
  {
    id: 'todo-001',
    type: 'boss_approval',
    relatedId: 'split-007',
    title: '待审批：广东包装材料厂 6万元',
    description: '6月包装材料款 - 票据号 BK2026030500011122',
    amount: 60000,
    createdAt: '2026-06-15 16:30:00',
    deadlineAt: '2026-06-17 16:30:00',
    isDone: false,
    priority: 'high'
  },
  {
    id: 'todo-002',
    type: 'boss_approval',
    relatedId: 'split-011',
    title: '待审批：顺丰速运 5万元',
    description: '5月物流运输费用 - 票据号 BK2025121500055566',
    amount: 50000,
    createdAt: '2026-06-16 09:00:00',
    deadlineAt: '2026-06-18 09:00:00',
    isDone: false,
    priority: 'high'
  },
  {
    id: 'todo-003',
    type: 'sign_confirm',
    relatedId: 'split-003',
    title: '待对方签收：浙江印染加工厂 5万元',
    description: '5月印染加工费 - 已发送4天',
    amount: 50000,
    createdAt: '2026-06-10 13:30:00',
    deadlineAt: '2026-06-17 13:30:00',
    isDone: false,
    priority: 'medium'
  },
  {
    id: 'todo-004',
    type: 'overdue_urge',
    relatedId: 'split-005',
    title: '逾期未签：江苏化工原料 8万元',
    description: '已发送14天，催办3次 - 建议电话联系',
    amount: 80000,
    createdAt: '2026-06-01 11:30:00',
    deadlineAt: '2026-06-08 11:30:00',
    isDone: false,
    priority: 'high'
  },
  {
    id: 'todo-005',
    type: 'mature_remind',
    relatedId: 'bill-005',
    title: '票据即将到期：45万元',
    description: '票据号 BK2025121500055566 - 2天前到期',
    amount: 450000,
    createdAt: '2026-06-13 00:00:00',
    deadlineAt: '2026-06-20 00:00:00',
    isDone: false,
    priority: 'medium'
  },
  {
    id: 'todo-006',
    type: 'mature_remind',
    relatedId: 'bill-008',
    title: '票据已逾期：28万元',
    description: '票据号 BK2025112000012300 - 请及时处理',
    amount: 280000,
    createdAt: '2026-05-20 00:00:00',
    deadlineAt: '2026-05-27 00:00:00',
    isDone: false,
    priority: 'high'
  }
];
