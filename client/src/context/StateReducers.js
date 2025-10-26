import IncomingCall from "@/components/common/IncomingCall";
import { reducerCases } from "./constants";

export const initialState = {
  userInfo: undefined,
  newUser: false,
  contactsPage: false,
  groupsPage: false,
  currentChatUser: undefined,
  currentGroup: undefined, // ✅ state สำหรับเก็บกลุ่มปัจจุบัน

  messages: [],
  socket: undefined,
  messagesSearch: false,
  userContacts: [],
  onlineUsers: [],
  filteredContacts: [],

  videoCall: undefined,
  voiceCall: undefined,
  incomingVoiceCall: undefined,
  incomingVideoCall: undefined,
};

const reducer = (state, action) => {
  switch (action.type) {
    case reducerCases.SET_USER_INFO:
      return { ...state, userInfo: action.userInfo };

    case reducerCases.SET_NEW_USER:
      return { ...state, newUser: action.newUser };

    case reducerCases.SET_ALL_CONTACTS_PAGE:
      return { ...state, contactsPage: action.payload };

    case reducerCases.CHANGE_CURRENT_CHAT_USER:
      return { ...state, currentChatUser: action.user };

    case reducerCases.SET_MESSAGES:
      return { ...state, messages: action.messages || [] };

    case reducerCases.SET_SOCKET:
      return { ...state, socket: action.socket };

    case reducerCases.ADD_MESSAGE:
      return {
        ...state,
        messages: [...(state.messages || []), action.newMessage],
      };

    case reducerCases.SET_MESSAGE_SEARCH:
      return { ...state, messagesSearch: !state.messagesSearch };

    case reducerCases.SET_USER_CONTACTS:
      return { ...state, userContacts: action.userContacts };

    case reducerCases.SET_ONLINE_USERS:
      return { ...state, onlineUsers: action.onlineUsers };

    case reducerCases.SET_CONTACT_SEARCH: {
      const filteredContacts = state.userContacts.filter((contact) =>
        `${contact.firstName} ${contact.lastName}`
          .toLowerCase()
          .includes(action.contactSearch.toLowerCase())
      );
      return {
        ...state,
        contactSearch: action.contactSearch,
        filteredContacts,
      };
    }

    case reducerCases.SET_VIDEO_CALL:
      return { ...state, videoCall: action.videoCall };

    case reducerCases.SET_VOICE_CALL:
      return { ...state, voiceCall: action.voiceCall };

    case reducerCases.SET_INCOMING_VOICE_CALL:
      return { ...state, incomingVoiceCall: action.incomingVoiceCall };

    case reducerCases.SET_INCOMING_VIDEO_CALL:
      return { ...state, incomingVideoCall: action.incomingVideoCall };

    case reducerCases.END_CALL:
      return {
        ...state,
        voiceCall: undefined,
        videoCall: undefined,
        incomingVideoCall: undefined,
        incomingVoiceCall: undefined,
      };

    case reducerCases.SET_EXIT_CHAT:
      return { ...state, currentChatUser: undefined };

    case reducerCases.SET_GROUPS_PAGE:
      console.log("📂 Changing groupsPage to:", action.payload);
      return { ...state, groupsPage: action.payload };

    // ✅ เคสใหม่สำหรับตั้งค่ากลุ่มปัจจุบัน
    case reducerCases.SET_CURRENT_GROUP:
      console.log("🟢 SET_CURRENT_GROUP called:", action.group);
      return {
        ...state,
        currentGroup: action.group,
        currentChatUser: undefined, // ป้องกันไม่ให้ชนกับแชท 1-1
      };

    case reducerCases.UPDATE_CONTACT_ROLE:
      return {
        ...state,
        userContacts: state.userContacts.map((u) =>
          u.id === action.payload.id
            ? { ...u, role: action.payload.role }
            : u
        ),
      };

    default:
      return state;
  }
};

export default reducer;
