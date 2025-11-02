import React from "react";
import { calculateTime } from "@/utils/CalculateTime";
import MessageStatus from "../common/MessageStatus";
import { useStateProvider } from "@/context/StateContext";

function FileMessage({ message, isOwnMessage }) {
  const { fileUrl, fileName, createdAt, messageStatus, absoluteUrl } = message;
  const [{ userInfo }] = useStateProvider();
  const sender = message.sender || null;
  const senderName = sender
    ? `${(sender.firstName || "").trim()} ${(sender.lastName || "").trim()}`.trim() || sender.name || ""
    : "";

  if (!fileUrl || !fileName) return null;

  //  ใช้ absoluteUrl ถ้ามี, ถ้าไม่มีใช้ NEXT_PUBLIC_STATIC_URL + fileUrl
  const url = absoluteUrl || `${process.env.NEXT_PUBLIC_STATIC_URL}${fileUrl}`;

  return (
    <div className={`flex ${isOwnMessage ? "justify-end" : "justify-start"}`}>
      <div className={`${isOwnMessage ? "bg-outgoing-background text-white" : "bg-incoming-background text-white"} rounded-[14px] px-[14px] py-[10px] max-w-[78%] leading-[1.4]` }>
      {/* For group messages show sender info on top */}
      {message.groupId && sender && (
        <div className="flex items-center gap-2 mb-2">
          {senderName && <div className="text-sm text-white font-medium">{senderName}</div>}
        </div>
      )}
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-400 hover:underline max-w-full inline-block"
        >
          📄 {fileName}
        </a>
        <div className="flex justify-end items-center gap-1 mt-2">
          <span className="text-bubble-meta text-[11px]">
            {createdAt ? calculateTime(createdAt) : ""}
          </span>
          {isOwnMessage && <MessageStatus messageStatus={messageStatus} />}
        </div>
      </div>
    </div>
  );
}

export default FileMessage;
