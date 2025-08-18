import React from "react";
import Avatar from "../common/Avatar";
import { useStateProvider } from "@/context/StateContext";
import { reducerCases } from "@/context/constants";
import { calculateTime } from "@/utils/CalculateTime";
import MessageStatus from "../common/MessageStatus";
import { FaCamera, FaMicrophone, FaPaperclip } from "react-icons/fa";

function ChatListItem({ data, isContactsPage = false }) {
  const [{ userInfo }, dispatch] = useStateProvider();

  const handleAllContactsClick = () => {
    // คำนวณ targetId ให้ครอบคลุมทั้งเคสมี/ไม่มีข้อความล่าสุด
    const hasLastMsgIds =
      typeof data?.senderId === "number" || typeof data?.receiverId === "number";

    const targetId = hasLastMsgIds
      ? (userInfo.id === data.senderId ? data.receiverId : data.senderId)
      : data.id; // ถ้ายังไม่มีข้อความ ให้ fallback เป็น id ของอีกฝ่าย

    const chatUser = isContactsPage
      ? { ...data }
      : {
          firstName: data.firstName,
          lastName: data.lastName,
          about: data.about,
          profilePicture: data.profilePicture,
          email: data.email,
          id: targetId,
        };

    dispatch({ type: reducerCases.CHANGE_CURRENT_CHAT_USER, user: chatUser });

    if (isContactsPage) {
      dispatch({ type: reducerCases.SET_ALL_CONTACTS_PAGE, payload: false });
    }
  };

  // เตรียมค่า preview (รองรับ text / image / audio / file)
  const renderPreview = () => {
    if (isContactsPage) {
      return <span className="text-secondary line-clamp-1 text-sm">{data?.about || "\u00A0"}</span>;
    }

    return (
      <div
        className="flex items-center gap-1 text-sm text-secondary
                   max-w-[200px] sm:max-w-[250px] md:max-w-[300px]
                   lg:max-w-[200px] xl-max-w-[300px]"
      >
        {/* แสดงสถานะเฉพาะถ้าเราเป็นผู้ส่ง */}
        {data.senderId === userInfo.id && (
          <MessageStatus messageStatus={data.messageStatus} />
        )}

        {data.type === "text" && <span className="truncate">{data.message || ""}</span>}

        {data.type === "image" && (
          <span className="flex gap-1 items-center">
            <FaCamera className="text-panel-header-icon" />
            รูปภาพ
          </span>
        )}

        {data.type === "audio" && (
          <span className="flex gap-1 items-center">
            <FaMicrophone className="text-panel-header-icon" />
            เสียง
          </span>
        )}

        {data.type === "file" && (
          <span className="flex gap-1 items-center">
            <FaPaperclip className="text-panel-header-icon" />
            {data.fileName ? `ไฟล์: ${data.fileName}` : "ไฟล์แนบ"}
          </span>
        )}

        {/* เผื่อเคส type ว่าง/ไม่รู้จัก */}
        {!data.type && <span className="truncate">{data.message || "\u00A0"}</span>}
      </div>
    );
  };

  return (
    <div
      role="button"
      aria-label={`เปิดแชทกับ ${data.firstName || ""} ${data.lastName || ""}`}
      className="flex cursor-pointer items-center hover:bg-background-default-hover"
      onClick={handleAllContactsClick}
    >
      <div className="min-w-fit px-5 pt-3 pb-1">
        <Avatar type="lg" image={data?.profilePicture || "/default-profile.png"} />
      </div>

      <div className="min-w-full flex flex-col justify-center mt-3 pr-2 w-full">
        <div className="flex justify-between">
          <div>
            <span className="text-white">{`${data.firstName ?? ""} ${data.lastName ?? ""}`}</span>
          </div>

          {!isContactsPage && (
            <span
              className={`${
                data.totalUnreadMessages > 0 ? "text-blue-500" : "text-secondary"
              } text-sm`}
            >
              {data?.createdAt ? calculateTime(data.createdAt) : ""}
            </span>
          )}
        </div>

        <div className="flex border-b border-conversation-border pb-2 pt-1 pr-2">
          <div className="flex justify-between w-full">
            {renderPreview()}

            {data.totalUnreadMessages > 0 && (
              <span className="bg-blue-500 text-white px-2 min-w-[1.5rem] text-center rounded-full text-xs ml-2">
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
