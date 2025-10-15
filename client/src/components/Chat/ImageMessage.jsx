import React from "react";
import { useStateProvider } from "@/context/StateContext"; // ✅ Import useStateProvider
import { calculateTime } from "@/utils/CalculateTime";
import MessageStatus from "../common/MessageStatus"; 

function ImageMessage({ message }) {
  const [{ currentChatUser, userInfo }] = useStateProvider(); // ✅ ใช้งาน useStateProvider อย่างถูกต้อง

  return (
    <div
      className={`p-1 rounded-lg ${
        message.senderId === currentChatUser.id ? "bg-incoming-background" : "bg-out-background"
      }`}
    >
      <div className="relative">
        <img
          src={message.message}
          className="rounded-lg"
          alt="Sent Image"
          height={300}
          width={300}
        />
        <div className="absolute bottom-1 right-1 flex items-end gap-1">
          <span className="text-bubble-meta text-[11px] px-1 min-w-fit">
            {message.createdAt ? calculateTime(message.createdAt) : ""}
          </span>
          {message.senderId === userInfo.id && (
            <MessageStatus messageStatus={message.messageStatus} />
          )}
        </div>
      </div>
    </div>
  );
}

export default ImageMessage;
