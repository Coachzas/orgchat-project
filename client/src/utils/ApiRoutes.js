// 🌐 Base Host
export const HOST = "http://localhost:3005";

// 🔐 AUTH ROUTES
export const AUTH_ROUTE = `${HOST}/api/auth`;
export const REGISTER_ROUTE = `${AUTH_ROUTE}/register`;
export const LOGIN_ROUTE = `${AUTH_ROUTE}/login`;
export const LOGOUT_ROUTE = `${AUTH_ROUTE}/logout`;
export const CHECK_AUTH_ROUTE = `${AUTH_ROUTE}/check-auth`;

// 📞 Token for Call
export const GET_CALL_TOKEN = (userId) => `${AUTH_ROUTE}/generate-token/${userId}`;

// 👤 CONTACTS ROUTES
export const MESSAGE_ROUTE = `${HOST}/api/messages`;
export const GET_ALL_CONTACTS = `${AUTH_ROUTE}/get-contacts`;
export const GET_INITIAL_CONTACTS_ROUTE = `${MESSAGE_ROUTE}/get-initial-contacts`;

// 💬 MESSAGES ROUTES

// ส่งข้อความปกติ
export const ADD_MESSAGE_ROUTE = `${MESSAGE_ROUTE}/add-message`;

// ✅ ดึงข้อความแชท 1-1 (แก้แล้วให้ตรงกับ server)
export const GET_MESSAGES_ROUTE = `${MESSAGE_ROUTE}/get-messages`;

// หรือถ้าอยากส่งแบบ dynamic function ก็ได้ (อีกวิธี)
export const GET_MESSAGES_ROUTE_1V1 = (meId, otherId) =>
  `${MESSAGE_ROUTE}/get-messages/${meId}/${otherId}`;

// ดึงข้อความกลุ่ม
export const GET_GROUP_MESSAGES_ROUTE = (groupId) =>
  `${HOST}/api/groups/${groupId}/messages`;


// ส่งข้อความแบบรูปภาพ
export const ADD_IMAGE_MESSAGES_ROUTE = `${MESSAGE_ROUTE}/add-image-message`;

// ส่งข้อความเสียง
export const ADD_AUDIO_MESSAGES_ROUTE = `${MESSAGE_ROUTE}/add-audio-message`;

// ส่งไฟล์เอกสาร
export const ADD_FILE_CHAT_ROUTE = `${MESSAGE_ROUTE}/add-file-message`;

// 📎 FILE ROUTES
export const ADD_FILE_MESSAGE_ROUTE = `${HOST}/api/files/upload`;
export const ADD_GROUP_MESSAGE_ROUTE = `${MESSAGE_ROUTE}/add-group-message`;

// 🧩 GROUP ROUTES
export const ADD_GROUP_ROUTE = `${HOST}/api/groups/create`;

// 👑 ADMIN ROLE ROUTES (optional)
const USER_ROUTE = `${HOST}/api/users`;
export const CHANGE_USER_ROLE_ROUTE = (userId) => `${USER_ROUTE}/role/${userId}`;
