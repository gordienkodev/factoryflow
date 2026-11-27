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
  name: string;
  startTime: string;
  endTime: string;
  status: 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED';
  createdAt: string;
};

export type Downtime = {
  id: number;
  machineId: number;
  reason: string;
  type: 'MAINTENANCE' | 'BREAKDOWN' | 'OTHER';
  startTime: string;
  endTime: string;
  createdAt: string;
};
