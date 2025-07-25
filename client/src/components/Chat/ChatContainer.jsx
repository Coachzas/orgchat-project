import React, { useEffect } from "react";
import { useStateProvider } from "@/context/StateContext";
import MessageStatus from "../common/MessageStatus";
import { calculateTime } from "@/utils/CalculateTime";
import ImageMessage from "./ImageMessage"; // ✅ Import คอมโพเนนต์ ImageMessage 
import dynamic from "next/dynamic";
import FileMessage from "./FileMessage"; 

const VoiceMessage = dynamic(() => import("./VoiceMessage"), { ssr: false });

function ChatContainer() {
  const [{ messages, currentChatUser, userInfo }] = useStateProvider();

  useEffect(() => {
    console.log("📩 Messages in state (Updated):", messages);
  }, [messages]); // ✅ ทำให้ UI อัปเดตเมื่อ messages เปลี่ยน

  return (
    <div className="h-[80vh] w-full relative flex-grow overflow-auto custom-scrollbar">
      <div className="bg-chat-background bg-fixed h-full w-full opacity-5 fixed left-0 top-0 z-0"></div>

      <div className="mx-10 my-6 relative bottom-0 z-40 left-0">
        <div className="flex flex-col justify-end w-full gap-1 overflow-auto">
          {messages && messages.length > 0 ? (
            messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.senderId === currentChatUser?.id
                    ? "justify-start"
                    : "justify-end"
                }`}
              >
                {/* ✅ แสดงข้อความปกติ */}
                {message.type === "text" && (
                  <div
                    className={`text-white px-2 py-[5px] text-sm rounded-md flex gap-2 items-end max-w-[45%] ${
                      message.senderId === currentChatUser?.id
                        ? "bg-incoming-background"
                        : "bg-outgoing-background"
                    }`}
                  >
                    <span className="break-all">{message?.message}</span>
                    <div className="flex gap-1 items-end">
                      <span className="text-bubble-meta text-[11px] px-1 min-w-fit">
                        {message.createdAt ? calculateTime(message.createdAt) : ""}
                      </span>
                      {message.senderId === userInfo?.id && (
                        <MessageStatus messageStatus={message.messageStatus} />
                      )}
                    </div>
                  </div>
                )}

                {/* ✅ แสดงรูปภาพถ้าเป็นข้อความประเภท image */}
                {message.type === "image" && <ImageMessage message={message} />}
                {message.type === "audio" && <VoiceMessage message={message} />}
                {message.type === "file" && (
                  <FileMessage message={message} isOwnMessage={message.senderId === userInfo?.id} />
                )}
              </div>
            ))
          ) : (
            <p className="text-gray-400 text-center">No messages yet</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default ChatContainer;
