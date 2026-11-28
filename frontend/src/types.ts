export type Machine = {
  id: number;
  name: string;
  createdAt: string;
  isActive: boolean;
};

export type Order = {
  id: number;
  number: string;
  name: string;
  status: 'pending' | 'completed';
};

export type Operation = {
  id: number;
  orderId: number;
  machineId: number;
  startTime: string;
  endTime: string;
  order: Order;
};

export type Downtime = {
  id: number;
  machineId: number;
  reason: string;
  type: 'MAINTENANCE' | 'BREAKDOWN' | 'OTHER';
  startTime: string;
  endTime: string;
};
