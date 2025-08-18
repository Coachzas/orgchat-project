import React, { useState } from "react";
import Avatar from "../common/Avatar";
import { useStateProvider } from "@/context/StateContext";
import { BsFillChatLeftTextFill, BsThreeDotsVertical } from "react-icons/bs";
import { reducerCases } from "@/context/constants";
import { useRouter } from "next/router";
import ContextMenu from "../common/ContextMenu";
import { FiUsers } from "react-icons/fi";

function ChatListHeader() {
  const router = useRouter();
  const [{ userInfo, contactsPage }, dispatch] = useStateProvider();

  const [contextMenuCoordinates, setContextMenuCoordinates] = useState({ x: 0, y: 0 });
  const [isContextMenuVisible, setIsContextMenuVisible] = useState(false);

  const showContextMenu = (e) => {
    e.preventDefault();
    setContextMenuCoordinates({ x: e.pageX, y: e.pageY });
    setIsContextMenuVisible(true);
  };

  const contextMenuOptions = [
    {
      name: "Logout",
      callback: async () => {
        setIsContextMenuVisible(false);
        router.push("/logout");
      },
    },
  ];

  const handleAllContactsPage = () => {
    dispatch({
      type: reducerCases.SET_ALL_CONTACTS_PAGE,
      payload: !contactsPage,
    });
  };

  return (
    <div className="h-16 px-4 py-3 flex justify-between items-center">
      <div className="flex items-center gap-4 flex-grow">
        <Avatar
          type="sm"
          image={userInfo?.profilePicture || "/default-profile.png"}
        />
        <div className="flex flex-col overflow-hidden">
          <span className="text-primary-strong text-sm font-semibold truncate">
            {userInfo?.firstName} {userInfo?.lastName}
          </span>
          <span className="text-secondary text-xs truncate">
            {userInfo?.about}
          </span>
        </div>
      </div>
      <div className="flex gap-6">
        <BsFillChatLeftTextFill
          className="text-panel-header-icon cursor-pointer text-xl"
          title="แชทใหม่"
          onClick={handleAllContactsPage}
        />
        <FiUsers
          className="text-panel-header-icon cursor-pointer text-xl"
          title="Group Chat"
          onClick={() => {
            dispatch({ type: reducerCases.SET_ALL_CONTACTS_PAGE, payload: false });
            dispatch({ type: reducerCases.SET_GROUPS_PAGE, payload: true });
          }}
        />
        <BsThreeDotsVertical
          className="text-panel-header-icon cursor-pointer text-xl"
          onClick={showContextMenu}
          id="context-opener"
        />
      </div>
      {isContextMenuVisible && (
        <ContextMenu
          options={contextMenuOptions}
          coordinates={contextMenuCoordinates}
          contextMenu={isContextMenuVisible}
          setContextMenu={setIsContextMenuVisible}
        />
      )}
    </div>
  );
}

export default ChatListHeader;
