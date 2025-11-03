// Use relative routes so the Next dev server can proxy them to the backend.
// This keeps requests same-origin (http://localhost:3000) and ensures cookies
// are sent in development when using the rewrite/proxy in next.config.js.
// Backend host (used for socket connection). Use env var in production if available.
export const HOST = process.env.NEXT_PUBLIC_API_HOST || "http://localhost:3005";
export const SOCKET_HOST = HOST;

export const AUTH_ROUTE = `/api/auth`;
export const LOGIN_ROUTE = `${AUTH_ROUTE}/login`;
export const LOGOUT_ROUTE = `${AUTH_ROUTE}/logout`;
// NOTE: server implements GET /api/auth/me to return current session user
export const CHECK_AUTH_ROUTE = `${AUTH_ROUTE}/me`;

// 📞 Token for Call
export const GET_CALL_TOKEN = (userId) => `${AUTH_ROUTE}/generate-token/${userId}`;

// 👤 CONTACTS ROUTES
export const MESSAGE_ROUTE = `/api/messages`;
export const GET_ALL_CONTACTS = `${AUTH_ROUTE}/get-contacts`;
export const GET_INITIAL_CONTACTS_ROUTE = `${MESSAGE_ROUTE}/get-initial-contacts`;

// 💬 MESSAGES ROUTES

// ส่งข้อความปกติ
export const ADD_MESSAGE_ROUTE = `${MESSAGE_ROUTE}/add-message`;

//  ดึงข้อความแชท 1-1 (แก้แล้วให้ตรงกับ server)
export const GET_MESSAGES_ROUTE = `${MESSAGE_ROUTE}/get-messages`;

// หรือถ้าอยากส่งแบบ dynamic function ก็ได้ (อีกวิธี)
export const GET_MESSAGES_ROUTE_1V1 = (meId, otherId) =>
  `${MESSAGE_ROUTE}/get-messages/${meId}/${otherId}`;

// ดึงข้อความกลุ่ม
export const GET_GROUP_MESSAGES_ROUTE = (groupId) => `/api/groups/${groupId}/messages`;

// Group notes (admin notes)
export const GET_GROUP_NOTES_ROUTE = (groupId) => `/api/groups/${groupId}/notes`;
export const ADD_GROUP_NOTE_ROUTE = (groupId) => `/api/groups/${groupId}/notes`;


// ส่งข้อความแบบรูปภาพ
export const ADD_IMAGE_MESSAGES_ROUTE = `${MESSAGE_ROUTE}/add-image-message`;

// ส่งข้อความเสียง
export const ADD_AUDIO_MESSAGES_ROUTE = `${MESSAGE_ROUTE}/add-audio-message`;

// ส่งไฟล์เอกสาร
export const ADD_FILE_CHAT_ROUTE = `${MESSAGE_ROUTE}/add-file-message`;

// 📎 FILE ROUTES
export const ADD_FILE_MESSAGE_ROUTE = `/api/files/upload`;
export const ADD_GROUP_MESSAGE_ROUTE = `${MESSAGE_ROUTE}/add-group-message`;

// 🧩 GROUP ROUTES
export const ADD_GROUP_ROUTE = `/api/groups/create`;

// ลบกลุ่ม
export const DELETE_GROUP_ROUTE = (groupId) => `/api/groups/${groupId}/delete`;

// 👑 ADMIN ROLE ROUTES (optional)
const USER_ROUTE = `/api/users`;
export const CHANGE_USER_ROLE_ROUTE = (userId) => `${USER_ROUTE}/role/${userId}`;

// Admin create user (server admin routes)
export const ADMIN_CREATE_USER_ROUTE = `/api/admin/users`;
export const ADMIN_USERS_ROUTE = `/api/admin/users`;
// Admin/Manager get public users for group creation
export const ADMIN_USERS_PUBLIC_ROUTE = `/api/admin/users/public`;

// Auth extras: change password and update profile pic
export const CHANGE_PASSWORD_ROUTE = `${AUTH_ROUTE}/change-password`;
export const UPDATE_PROFILE_PIC_ROUTE = `${AUTH_ROUTE}/profile-photo`;

// Update profile fields (PATCH)
export const UPDATE_USER_PROFILE_ROUTE = `${AUTH_ROUTE}/profile`;

// ดึงโน้ตล่าสุดของกลุ่ม
export const GET_LATEST_GROUP_NOTE_ROUTE = (groupId) =>
  `${HOST}/api/groups/${groupId}/latest-note`;

// ลบโน้ตของกลุ่ม
export const DELETE_GROUP_NOTE_ROUTE = (groupId, noteId) =>
  `${HOST}/api/messages/groups/${groupId}/notes/${noteId}`;


