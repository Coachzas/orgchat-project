
export const HOST = "http://localhost:3005";
export const AUTH_ROUTE = `${HOST}/api/auth`;
export const MESSAGE_ROUTE = `${HOST}/api/messages`;

// 🔐 Auth
export const REGISTER_ROUTE = `${AUTH_ROUTE}/register`;
export const LOGIN_ROUTE = `${AUTH_ROUTE}/login`;
export const LOGOUT_ROUTE = `${AUTH_ROUTE}/logout`;
export const CHECK_AUTH_ROUTE = `${AUTH_ROUTE}/check-auth`;

// 📞 Token for Call
export const GET_CALL_TOKEN = (userId) => `${AUTH_ROUTE}/generate-token/${userId}`;

// 👤 Contacts
export const GET_ALL_CONTACTS = `${AUTH_ROUTE}/get-contacts`;
export const GET_INITIAL_CONTACTS_ROUTE = `${MESSAGE_ROUTE}/get-initial-contacts`;

// 💬 Messages
export const ADD_MESSAGE_ROUTE = `${MESSAGE_ROUTE}/add-message`;
export const GET_MESSAGES_ROUTE_1V1 = (meId, otherId) =>
  `${MESSAGE_ROUTE}/get-messages/${meId}/${otherId}`;
export const GET_GROUP_MESSAGES_ROUTE = (groupId) =>
  `${MESSAGE_ROUTE}/get-group-messages/${groupId}`;
export const ADD_IMAGE_MESSAGES_ROUTE = `${MESSAGE_ROUTE}/add-image-message`;
export const ADD_AUDIO_MESSAGES_ROUTE = `${MESSAGE_ROUTE}/add-audio-message`;
export const ADD_FILE_CHAT_ROUTE = `${MESSAGE_ROUTE}/add-file-message`;

// 📎 Files
export const ADD_FILE_MESSAGE_ROUTE = `${HOST}/api/files/upload`;

// 👑 Admin Role Management (optional)
const USER_ROUTE = `${HOST}/api/users`;
export const CHANGE_USER_ROLE_ROUTE = (userId) => `${USER_ROUTE}/role/${userId}`;
