import { reducerCases } from "./constants";

export const initialState = {
  userInfo: undefined,
  newUser: false,
  contactsPage: false, // ✅ เพิ่มค่าเริ่มต้นให้ contactsPage
  currentChatUser: undefined,
  messages: [],
  socket: undefined,
};

const reducer = (state, action) => {
  switch (action.type) {
    case reducerCases.SET_USER_INFO:
      return { ...state, userInfo: action.userInfo };

    case reducerCases.SET_NEW_USER:
      return { ...state, newUser: action.newUser };

    case reducerCases.SET_ALL_CONTACTS_PAGE:
      console.log("🚀 Changing contactsPage to:", action.payload);
      return { ...state, contactsPage: action.payload }; // ✅ ใช้ค่า payload

    case reducerCases.CHANGE_CURRENT_CHAT_USER:
      return { ...state, currentChatUser: action.user };

    case reducerCases.SET_MESSAGES:
      return { ...state, messages: action.messages || [] };

    case reducerCases.SET_SOCKET:
      case reducerCases.SET_SOCKET:
        console.log("🔌 Setting socket in Redux:", action.socket);
      return { ...state, socket: action.socket };

    case reducerCases.ADD_MESSAGE:
      console.log("🆕 Redux: Adding new message:", action.newMessage);
      return { ...state, messages: [...(state.messages || []), action.newMessage] };

    default:
      return state;
  }
};

export default reducer;
