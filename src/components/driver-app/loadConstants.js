// L28: Central load status constants — use these instead of bare strings to avoid typos
export const LOAD_STATUS = {
  AVAILABLE:          'available',
  ASSIGNED:           'assigned',
  PENDING:            'pending',
  EN_ROUTE_PICKUP:    'en_route_pickup',
  ARRIVED_PICKUP:     'arrived_pickup',
  LOADED:             'loaded',
  EN_ROUTE_DELIVERY:  'en_route_delivery',
  ARRIVED_DELIVERY:   'arrived_delivery',
  DELIVERED:          'delivered',
  REJECTED:           'rejected',
  PROBLEM:            'problem',
};

/** Statuses that represent a load that has not yet been acted on by the driver */
export const PENDING_STATUSES = [
  LOAD_STATUS.AVAILABLE,
  LOAD_STATUS.ASSIGNED,
  LOAD_STATUS.PENDING,
];

/** Statuses that are considered "in progress" (driver is actively working the load) */
export const ACTIVE_STATUSES = [
  LOAD_STATUS.EN_ROUTE_PICKUP,
  LOAD_STATUS.ARRIVED_PICKUP,
  LOAD_STATUS.LOADED,
  LOAD_STATUS.EN_ROUTE_DELIVERY,
  LOAD_STATUS.ARRIVED_DELIVERY,
];

/** Terminal statuses — load is done */
export const TERMINAL_STATUSES = [
  LOAD_STATUS.DELIVERED,
  LOAD_STATUS.REJECTED,
];
