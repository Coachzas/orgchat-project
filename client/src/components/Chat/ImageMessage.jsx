import React from "react";
import { useStateProvider } from "@/context/StateContext"; //  Import useStateProvider
import { calculateTime } from "@/utils/CalculateTime";
import MessageStatus from "../common/MessageStatus"; 

function ImageMessage({ message }) {
  const [{ userInfo }] = useStateProvider();

  return (
    <div className={`flex ${message.senderId === userInfo?.id ? "justify-end" : "justify-start"}`}>
      <div className={`${message.senderId === userInfo?.id ? "bg-outgoing-background text-white" : "bg-incoming-background text-white"} rounded-[14px] px-[14px] py-[10px] max-w-[75%] leading-[1.4]` }>
        <div className="relative">
          <img
            src={message.message}
            className="rounded-lg max-w-full h-auto object-contain max-h-[80vh]"
            alt="Sent Image"
          />
          <div className="absolute bottom-1 right-1 flex items-end gap-1">
            <span className="text-bubble-meta text-[11px] px-1">
              {message.createdAt ? calculateTime(message.createdAt) : ""}
            </span>
            {message.senderId === userInfo?.id && (
              <MessageStatus messageStatus={message.messageStatus} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ImageMessage;
