import React from "react";
import Avatar from "../common/Avatar";
import { useStateProvider } from "@/context/StateContext";
import { reducerCases } from "@/context/constants";

function ChatListItem({ data = {} }) { // ✅ รับ `data` เป็น props และตั้งค่าเริ่มต้น
  const [{ userInfo, currentChatUser }, dispatch] = useStateProvider();

  const handleAllContactsClick = () => {
    if (!data?.id) return; // ✅ ป้องกัน `undefined`
    dispatch({
      type: reducerCases.CHANGE_CURRENT_CHAT_USER,
      user: { ...data },
    });
    dispatch({
      type: reducerCases.SET_ALL_CONTACTS_PAGE,
    });
  };

  return (
    <div 
      className="flex cursor-pointer items-center hover:bg-background-default-hover"
      onClick={handleAllContactsClick}
    >
      <div className="min-w-fit px-5 pt-3 pb-1">
        <Avatar type="lg" image={data?.profilePicture || "/default-profile.png"} />
      </div>
      <div className="min-full flex flex-col justify-center mt-3 pr-2 w-full">
        <div className="flex justify-between">
          <div>
            <span className="text-white">{data?.name || "Unknown"}</span>
          </div>
        </div>
        <div className="flex border-b border-conversation-border pb-2 pt-1 p3-2">
          <div className="flex justify-between w-full">
            <span className="text-secondary line-clamp-1 text-sm">
              {data?.about || "\u00A0"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ChatListItem;
