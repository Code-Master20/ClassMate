import { createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../lib/api";

export const fetchNotifications = createAsyncThunk(
  "notifications/fetchNotifications",
  async (params = {}, thunkAPI) => {
    try {
      const response = await api.get("/network/notifications", {
        params: {
          page: params.page ?? 1,
          limit: params.limit ?? 30,
        },
      });

      // From backend  data would be loked like this ---->
                                  //       {
                                  //   "status": 200,
                                  //   "success": true,
                                  //   "message": "Notifications",
                                  //   "data": {
                                  //     "items": [
                                  //       {
                                  //         "_id": "notification123",
                                  //         "type": "friend_request",
                                  //         "message": "John sent you a friend request",
                                  //         "link": null,
                                  //         "read": false,
                                  //         "createdAt": "2026-09-06T00:20:00.000Z",
                                  //         "actor": {
                                  //           "_id": "john123",
                                  //           "username": "john",
                                  //           "avatar": "john.jpg",
                                  //           "profession": "Developer"
                                  //         }
                                  //       }
                                  //     ],
                                  //     "unreadCount": 1,
                                  //     "page": 1,
                                  //     "limit": 30,
                                  //     "hasMore": false
                                  //   }
                                  // }


      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue({
        status: error.response?.status,
        message:
          error.response?.data?.message ||
          "Could not fetch notifications",
      });
    }
  },
);

export const deleteNotification = createAsyncThunk(
  "notifications/deleteNotification",
  async (notificationId, thunkAPI) => {
    try {
      const response = await api.delete(`/network/notifications/${notificationId}`);
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue({
        status: error.response?.status,
        message: error.response?.data?.message || "Could not remove notification",
        notificationId,
      });
    }
  },
);

export const markNotificationsRead = createAsyncThunk(
  "notifications/markNotificationsRead",
  async (_, thunkAPI) => {
    try {
      const response = await api.patch("/network/notifications/read");
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue({
        status: error.response?.status,
        message:
          error.response?.data?.message || "Could not mark notifications as read",
      });
    }
  },
);
