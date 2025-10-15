import React, { useEffect, useState } from "react";
import { useStateProvider } from "@/context/StateContext";
import MessageStatus from "../common/MessageStatus";
import { calculateTime } from "@/utils/CalculateTime";
import ImageMessage from "./ImageMessage";
import dynamic from "next/dynamic";
import FileMessage from "./FileMessage";
import axios from "axios";
import {
  GET_GROUP_MESSAGES_ROUTE,
  GET_MESSAGES_ROUTE,
} from "@/utils/ApiRoutes";
import { reducerCases } from "@/context/constants";

const VoiceMessage = dynamic(() => import("./VoiceMessage"), { ssr: false });

function ChatContainer() {
  const [
    { messages, currentChatUser, currentGroup, userInfo, socket },
    dispatch,
  ] = useStateProvider();

  const [loading, setLoading] = useState(false);

  // ✅ โหลดข้อความของ "กลุ่ม" จากฐานข้อมูลเมื่อเปลี่ยนกลุ่ม
  useEffect(() => {
    const fetchGroupMessages = async () => {
      if (!currentGroup) return;
      setLoading(true);
      try {
        const res = await axios.get(
          `${GET_GROUP_MESSAGES_ROUTE}/${currentGroup.id}`
        );
        dispatch({ type: reducerCases.SET_MESSAGES, messages: res.data });
      } catch (err) {
        console.error("❌ โหลดข้อความกลุ่มล้มเหลว:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchGroupMessages();
  }, [currentGroup, dispatch]);

  // ✅ โหลดข้อความของ "แชท 1-1" จากฐานข้อมูลเมื่อเปลี่ยนผู้สนทนา
  useEffect(() => {
    const fetchPrivateMessages = async () => {
      if (!currentChatUser) return;
      setLoading(true);
      try {
        const res = await axios.get(
          `${GET_MESSAGES_ROUTE}/${userInfo.id}/${currentChatUser.id}`
        );
        dispatch({ type: reducerCases.SET_MESSAGES, messages: res.data });
      } catch (err) {
        console.error("❌ โหลดข้อความ 1-1 ล้มเหลว:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchPrivateMessages();
  }, [currentChatUser, dispatch, userInfo]);

  // ✅ ฟังข้อความใหม่จาก socket (แชทกลุ่ม)
  useEffect(() => {
    if (!currentGroup) return;
    if (!socket) return;

    const handleGroupMessageReceive = (data) => {
      if (data.message.groupId === currentGroup.id) {
        console.log("📩 ข้อความใหม่ในกลุ่ม:", data.message);
        dispatch({
          type: reducerCases.ADD_MESSAGE,
          newMessage: data.message,
        });
      }
    };

    socket.on("group-message-receive", handleGroupMessageReceive);
    return () => {
      socket.off("group-message-receive", handleGroupMessageReceive);
    };
  }, [socket, currentGroup, dispatch]);

  // ✅ ฟังข้อความใหม่จาก socket (แชท 1-1)
  useEffect(() => {
    if (!socket) return;

    const handlePrivateMessageReceive = (data) => {
      // ตรวจว่าข้อความเกี่ยวข้องกับเราหรือไม่
      if (
        data.message.receiverId === userInfo?.id ||
        data.message.senderId === currentChatUser?.id
      ) {
        console.log("💬 ข้อความใหม่ (1-1):", data.message);
        dispatch({
          type: reducerCases.ADD_MESSAGE,
          newMessage: data.message,
        });
      } else {
        console.log("⚠️ ข้ามข้อความของคนอื่น:", data.message);
      }
    };

    socket.on("msg-receive", handlePrivateMessageReceive);
    return () => {
      socket.off("msg-receive", handlePrivateMessageReceive);
    };
  }, [socket, currentChatUser, dispatch, userInfo]);

  return (
    <div className="h-[80vh] w-full relative flex-grow overflow-auto custom-scrollbar">
      <div className="bg-chat-background bg-fixed h-full w-full opacity-5 fixed left-0 top-0 z-0"></div>

      <div className="mx-10 my-6 relative bottom-0 z-40 left-0">
        {loading ? (
          <p className="text-gray-400 text-center">กำลังโหลดข้อความ...</p>
        ) : (
          <div className="flex flex-col justify-end w-full gap-1 overflow-auto">
            {messages && messages.length > 0 ? (
              messages.map((message) => {
                const isOwn = message.senderId === userInfo?.id;
                return (
                  <div
                    key={message.id}
                    className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
                  >
                    {message.type === "text" && (
                      <div
                        className={`text-white px-2 py-[5px] text-sm rounded-md flex gap-2 items-end max-w-[45%] ${isOwn
                            ? "bg-outgoing-background"
                            : "bg-incoming-background"
                          }`}
                      >
                        <span className="break-all">{message?.message}</span>
                        <div className="flex gap-1 items-end">
                          <span className="text-bubble-meta text-[11px] px-1 min-w-fit">
                            {message.createdAt
                              ? calculateTime(message.createdAt)
                              : ""}
                          </span>
                          {isOwn && (
                            <MessageStatus
                              messageStatus={message.messageStatus}
                            />
                          )}
                        </div>
                      </div>
                    )}

                    {message.type === "image" && (
                      <ImageMessage message={message} />
                    )}
                    {message.type === "audio" && (
                      <VoiceMessage message={message} />
                    )}
                    {message.type === "file" && (
                      <FileMessage message={message} isOwnMessage={isOwn} />
                    )}
                  </div>
                );
              })
            ) : (
              <p className="text-gray-400 text-center">
                ยังไม่มีข้อความในห้องนี้
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default ChatContainer;
