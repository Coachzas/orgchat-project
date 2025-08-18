export const HOST = "http://localhost:3005";

const AUTH_ROUTE = `${HOST}/api/auth`;
const MESSAGE_ROUTE = `${HOST}/api/messages`;

export const GET_ALL_CONTACTS = `${AUTH_ROUTE}/get-contacts`;
export const GET_CALL_TOKEN = (userId) => `${AUTH_ROUTE}/generate-token/${userId}`;

export const ADD_MESSAGE_ROUTE = `${MESSAGE_ROUTE}/add-message`;

// ทำเป็นฟังก์ชัน จะได้ส่ง path ถูกต้อง
export const GET_MESSAGES_ROUTE_1V1 = (meId, otherId) =>
    `${MESSAGE_ROUTE}/get-messages/${meId}/${otherId}`;
export const GET_GROUP_MESSAGES_ROUTE = (groupId) =>
    `${MESSAGE_ROUTE}/get-group-messages/${groupId}`;

export const ADD_IMAGE_MESSAGES_ROUTE = `${MESSAGE_ROUTE}/add-image-message`;
export const ADD_AUDIO_MESSAGES_ROUTE = `${MESSAGE_ROUTE}/add-audio-message`;

export const GET_INITIAL_CONTACTS_ROUTE = `${MESSAGE_ROUTE}/get-initial-contacts`;

export const ADD_FILE_MESSAGE_ROUTE = `${HOST}/api/files/upload`;
export const ADD_FILE_CHAT_ROUTE = `${MESSAGE_ROUTE}/add-file-message`;

export const REGISTER_ROUTE = `${AUTH_ROUTE}/register`;
export const LOGIN_ROUTE = `${AUTH_ROUTE}/login`;
