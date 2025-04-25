import React from "react";
import Avatar from "../common/Avatar";
import { useStateProvider } from "@/context/StateContext";
import { BsFillChatLeftTextFill, BsThreeDotsVertical } from "react-icons/bs";
import { reducerCases } from "@/context/constants";

function ChatListHeader() {
  const [{ userInfo, contactsPage }, dispatch] = useStateProvider();

  const handleAllContactsPage = () => {
    console.log("Dispatching SET_ALL_CONTACTS_PAGE, Current State:", contactsPage);
    dispatch({
      type: reducerCases.SET_ALL_CONTACTS_PAGE,
      payload: !contactsPage, // ✅ เปลี่ยนค่า contactsPage (toggle)
    });
  };

  return (
    <div className="h-16 px-4 py-3 flex justify-between items-center">
      <div className="cursor-pointer">
        <Avatar type="sm" image={userInfo?.profileImage || "/default-profile.png"} />
      </div>
      <div className="flex gap-6">
        <BsFillChatLeftTextFill
          className="text-panel-header-icon cursor-pointer text-xl"
          title="New Chat"
          onClick={handleAllContactsPage}
        />
        <BsThreeDotsVertical className="text-panel-header-icon cursor-pointer text-xl" />
      </div>
    </div>
  );
}

export default ChatListHeader;
