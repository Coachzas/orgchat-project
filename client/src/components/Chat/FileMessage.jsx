import React from "react";
import { calculateTime } from "@/utils/CalculateTime";
import MessageStatus from "../common/MessageStatus";

function FileMessage({ message, isOwnMessage }) {
  const { fileUrl, message: fileName, createdAt, messageStatus } = message;

  return (
    <div
      className={`text-white px-3 py-2 text-sm rounded-md flex flex-col max-w-[60%] ${
        isOwnMessage ? "bg-outgoing-background" : "bg-incoming-background"
      }`}
    >
      <a
        href={fileUrl}
        download={fileName}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-400 hover:underline break-all"
      >
        📄 {fileName}
      </a>
      <div className="flex justify-end items-center gap-1 mt-1">
        <span className="text-bubble-meta text-[11px]">
          {createdAt ? calculateTime(createdAt) : ""}
        </span>
        {isOwnMessage && <MessageStatus messageStatus={messageStatus} />}
      </div>
    </div>
  );
}

export default FileMessage;
