import React from "react";
import { BsCheck, BsCheckAll } from "react-icons/bs";

function MessageStatus({ messageStatus }) {
  if (!messageStatus) return null; // ✅ ป้องกัน messageStatus เป็น undefined

  return (
    <>
      {messageStatus === "sent" && <BsCheck className="text-lg text-gray-500" />}
      {messageStatus === "delivered" && <BsCheckAll className="text-lg text-gray-500" />}
      {messageStatus === "read" && <BsCheckAll className="text-lg text-blue-500" />}
    </>
  );
}

export default MessageStatus;
