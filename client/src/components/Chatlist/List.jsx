import { reducerCases } from "@/context/constants";
import { useStateProvider } from "@/context/StateContext";
import { GET_INITIAL_CONTACTS_ROUTE } from "@/utils/ApiRoutes";
import axios from "axios";
import React, { useEffect } from "react";
import ChatListItem from "./ChatListItem";

function List() {
  const [{ userInfo, userContacts, filteredContacts }, dispatch] = useStateProvider();

  useEffect(() => {
    const getContacts = async () => {
      try {
        const {
          data: { users, onlineUsers }, // ✅ แก้จาก "user" → "users"
        } = await axios(`${GET_INITIAL_CONTACTS_ROUTE}/${userInfo.id}`);

        dispatch({ type: reducerCases.SET_ONLINE_USERS, onlineUsers });
        dispatch({ type: reducerCases.SET_USER_CONTACTS, userContacts: users }); // ✅ แก้ user → users

        console.log("👥 Contacts:", users);
        console.log("🟢 Online Users:", onlineUsers);
      } catch (err) {
        console.error("❌ Error fetching contacts:", err);
      }
    };

    if (userInfo?.id) {
      getContacts();
    }
  }, [userInfo]);

  return (
    <div className="bg-search-input-container-background flex-auto overflow-auto max-h-full custom-scrollbar">
      {
        filteredContacts && filteredContacts.length>0 
        ? filteredContacts.map((contact) => (
        <ChatListItem data={contact} key={contact.id} />
      )) 
      : userContacts.map((contact) => (
        <ChatListItem data={contact} key={contact.id} />
      ))}
    </div>
  );
}

export default List;
