import React from "react";
import Avatar from "../common/Avatar";
import { useStateProvider } from "@/context/StateContext";
import { reducerCases } from "@/context/constants";
import { calculateTime } from "@/utils/CalculateTime";
import MessageStatus from "../common/MessageStatus";
import { FaCamera, FaMicrophone } from "react-icons/fa";

function ChatListItem({ data, isContactsPage = false }) {
  const [{ userInfo }, dispatch] = useStateProvider();

  const handleAllContactsClick = () => {
    const chatUser = isContactsPage
      ? { ...data }
      : {
          name: data.name,
          about: data.about,
          profilePicture: data.profilePicture,
          email: data.email,
          id: userInfo.id === data.senderId ? data.receiverId : data.senderId,
        };

    dispatch({ type: reducerCases.CHANGE_CURRENT_CHAT_USER, user: chatUser });

    if (isContactsPage) {
      dispatch({ type: reducerCases.SET_ALL_CONTACTS_PAGE, payload: false });
    }
  };

  return (
    <div
      className="flex cursor-pointer items-center hover:bg-background-default-hover"
      onClick={handleAllContactsClick}
    >
      <div className="min-w-fit px-5 pt-3 pb-1">
        <Avatar
          type="lg"
          image={data?.profilePicture || "/default-profile.png"}
        />
      </div>
      <div className="min-full flex flex-col justify-center mt-3 pr-2 w-full">
        <div className="flex justify-between">
          <div>
            <span className="text-white">{data?.name || "Unknown"}</span>
          </div>
          {!isContactsPage && (
            <span
              className={`${
                data.totalUnreadMessages > 0
                  ? "text-blue-600"
                  : "text-secondary"
              } text-sm`}
            >
              {calculateTime(data.createdAt)}
            </span>
          )}
        </div>

        <div className="flex border-b border-conversation-border pb-2 pt-1 pr-2">
          <div className="flex justify-between w-full">
            {isContactsPage ? (
              <span className="text-secondary line-clamp-1 text-sm">
                {data?.about || "\u00A0"}
              </span>
            ) : (
              <div
                className="flex items-center gap-1 text-sm text-secondary
                           max-w-[200px] sm:max-w-[250px] md:max-w-[300px] 
                           lg:max-w-[200px] xl:max-w-[300px]"
              >
                {data.senderId === userInfo.id && (
                  <MessageStatus messageStatus={data.messageStatus} />
                )}
                {data.type === "text" && (
                  <span className="truncate">{data.message}</span>
                )}
                {data.type === "audio" && (
                  <span className="flex gap-1 items-center">
                    <FaMicrophone className="text-panel-header-icon" />
                    Audio
                  </span>
                )}
                {data.type === "image" && (
                  <span className="flex gap-1 items-center">
                    <FaCamera className="text-panel-header-icon" />
                    Image
                  </span>
                )}
              </div>
            )}
            {data.totalUnreadMessages > 0 && (
              <span className="bg-blue-300 px-[50px] rounded-full text-sm">
                 {data.totalUnreadMessages}
             </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ChatListItem;
