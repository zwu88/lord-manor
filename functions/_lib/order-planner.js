import {
  addChronicleDays,
  normalizeBoolean,
  validateChronicleDate
} from "./chronicle.js";

export function validatePlannerDate(value) {
  return validateChronicleDate(value);
}

export function buildPlannerWeek(today) {
  return Array.from({ length: 7 }, (_, index) => ({
    date: addChronicleDays(today, index),
    activeCount: 0
  }));
}

export function countActiveOrdersByDate(
  orders,
  week
) {
  const counts = new Map(
    week.map(day => [day.date, 0])
  );

  for (const order of orders) {
    if (
      counts.has(order.taskDate) &&
      !normalizeBoolean(order.completed)
    ) {
      counts.set(
        order.taskDate,
        counts.get(order.taskDate) + 1
      );
    }
  }

  return week.map(day => ({
    ...day,
    activeCount: counts.get(day.date) ?? 0
  }));
}

export function normalizePlannerOrders(orders) {
  return orders.map(order => ({
    ...order,
    completed: normalizeBoolean(order.completed)
  }));
}

export function buildPlannerResponse({
  selectedDate,
  today,
  selectedOrders,
  overdueOrders,
  week
}) {
  return {
    selectedDate,
    today,
    tomorrow: addChronicleDays(today, 1),
    weekStart: today,
    weekEnd: addChronicleDays(today, 6),
    selectedOrders:
      normalizePlannerOrders(selectedOrders),
    overdueOrders:
      normalizePlannerOrders(overdueOrders),
    week
  };
}
