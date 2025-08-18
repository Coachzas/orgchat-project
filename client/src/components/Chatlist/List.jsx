import { reducerCases } from "@/context/constants";
import { useStateProvider } from "@/context/StateContext";
import { GET_INITIAL_CONTACTS_ROUTE } from "@/utils/ApiRoutes";
import axios from "axios";
import React, { useEffect } from "react";
import ChatListItem from "./ChatListItem";

function List() {
  const [{ userInfo, userContacts = [], filteredContacts = [] }, dispatch] =
    useStateProvider();

  useEffect(() => {
    if (!userInfo?.id) return;
    let cancelled = false;

    const getContacts = async () => {
      try {
        const { data } = await axios.get(
          `${GET_INITIAL_CONTACTS_ROUTE}/${userInfo.id}`
        );

        // รองรับหลายรูปแบบของ response
        const users = data?.users ?? data?.data?.users ?? [];
        const onlineUsers = data?.onlineUsers ?? data?.data?.onlineUsers ?? [];

        if (cancelled) return;
        dispatch({ type: reducerCases.SET_ONLINE_USERS, onlineUsers });
        dispatch({ type: reducerCases.SET_USER_CONTACTS, userContacts: users });

        console.log("👥 Contacts:", users);
        console.log("🟢 Online Users:", onlineUsers);
      } catch (err) {
        if (!cancelled) console.error("❌ Error fetching contacts:", err);
      }
    };

    getContacts();
    return () => {
      cancelled = true;
    };
  }, [userInfo?.id, dispatch]);

  const list =
    filteredContacts && filteredContacts.length > 0
      ? filteredContacts
      : userContacts;

  return (
    <div className="bg-search-input-container-background flex-auto overflow-auto max-h-full custom-scrollbar">
      {list.map((contact) => (
        <ChatListItem data={contact} key={contact.id} />
      ))}
    </div>
  );
}

export default List;
