import React from "react";
import ChatListHeader from "./ChatListHeader";
import SearchBar from "./SearchBar";
import List from "./List";
import ContactsList from "./ContactsList";
import GroupsList from "./GroupsList";
import { useStateProvider } from "@/context/StateContext";

function ChatList() {
  const [{ contactsPage, groupsPage }] = useStateProvider();

  const pageType = contactsPage
    ? "all-contacts"
    : groupsPage
    ? "group-chat"
    : "default";

  return (
    <div className="bg-panel-header-background flex flex-col max-h-screen z-20">
      {pageType === "default" && (
        <>
          <ChatListHeader />
          <SearchBar />
          <List />
        </>
      )}
      {pageType === "all-contacts" && <ContactsList />}
      {pageType === "group-chat" && <GroupsList />}
    </div>
  );
}

export default ChatList;
