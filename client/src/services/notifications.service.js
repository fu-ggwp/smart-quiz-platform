import axiosClient from "./axios-client";

export const notificationsService = {
  list: ({ limit = 20, offset = 0 } = {}) =>
    axiosClient
      .get("/api/notifications", { params: { limit, offset } })
      .then((response) => response.data.data),

  getUnreadCount: () =>
    axiosClient
      .get("/api/notifications/unread-count")
      .then((response) => response.data.data),

  markAsRead: (notificationId) =>
    axiosClient
      .patch(`/api/notifications/${notificationId}/read`)
      .then((response) => response.data.data),

  markAllAsRead: () =>
    axiosClient
      .patch("/api/notifications/read-all")
      .then((response) => response.data.data),

  remove: (notificationId) =>
    axiosClient
      .delete(`/api/notifications/${notificationId}`)
      .then((response) => response.data.data),

};
