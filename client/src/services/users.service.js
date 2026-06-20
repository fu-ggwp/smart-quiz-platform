import axiosClient from "./axiosClient";

export const usersService = {
  listPublic: (params) =>
    axiosClient.get("/api/users/public", { params }).then((r) => r.data),
};
