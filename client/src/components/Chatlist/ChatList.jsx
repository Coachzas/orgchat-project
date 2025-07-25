import React, { useEffect, useState } from "react";
import ChatListHeader from "./ChatListHeader";
import SearchBar from "./SearchBar";
import List from "./List";
import { useStateProvider } from "@/context/StateContext";
import ContactsList from "./ContactsList";
import GroupsList from "./GroupsList";


function ChatList() {
  const [{contactsPage, groupsPage}] = useStateProvider();
  const [pageType, setPageType] = useState("default");

  useEffect(() => {
  if (contactsPage) {
    setPageType("all-contacts");
  } else if (groupsPage) {
    setPageType("group-chat");
  } else {
    setPageType("default");
  }
}, [contactsPage, groupsPage]);
  return(
    <div className="bg-panel-header-background flex flex-col max-h-screen z-20">
      {pageType ==="default" && (

  <>
  <ChatListHeader />
  <SearchBar />
  <List />
  </>
  )}
  {pageType === "all-contacts" && <ContactsList/>}
  {pageType === "group-chat" && <GroupsList />}
    </div>
  );
}

export default ChatList;
