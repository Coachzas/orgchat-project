import React, { useEffect, useState } from "react";
import { useStateProvider } from "@/context/StateContext";
import MessageStatus from "../common/MessageStatus";
import { calculateTime } from "@/utils/CalculateTime";
import ImageMessage from "./ImageMessage";
import dynamic from "next/dynamic";
import FileMessage from "./FileMessage";
import GroupFiles from "./GroupFile";
import axios from "axios";
import { GET_GROUP_MESSAGES_ROUTE, GET_MESSAGES_ROUTE } from "@/utils/ApiRoutes";
import { reducerCases } from "@/context/constants";
import IncomingCall from "../common/IncomingCall";

const VoiceMessage = dynamic(() => import("./VoiceMessage"), { ssr: false });

function ChatContainer() {
  const [
    {
      messages,
      currentChatUser,
      currentGroup,
      userInfo,
      socket,
      incomingVoiceCall,
      showGroupFiles,
    },
    dispatch,
  ] = useStateProvider();

  const [loading, setLoading] = useState(false);

  // ✅ เพิ่มผู้ใช้เข้า online list เมื่อ socket เชื่อมต่อ
  useEffect(() => {
    if (socket?.current && userInfo?.id) {
      socket.current.emit("add-user", userInfo.id);
      console.log("🟢 Added user to onlineUsers:", userInfo.id);
    }
  }, [socket, userInfo]);

  // ✅ เข้าห้องกลุ่ม (และออกจากห้องเก่า)
  useEffect(() => {
    if (socket?.current) {
      if (currentGroup) {
        socket.current.emit("leave-all-groups"); // ออกจากทุกกลุ่มก่อน
        socket.current.emit("join-group", currentGroup.id);
        console.log("📡 Joined group:", currentGroup.id);
      }
    }
  }, [socket, currentGroup]);

  // ✅ โหลดข้อความกลุ่ม (ถ้าอยู่ในกลุ่ม)
  useEffect(() => {
    if (!currentGroup || currentChatUser) return;
    setLoading(true);
    const fetchGroupMessages = async () => {
      try {
        const res = await axios.get(GET_GROUP_MESSAGES_ROUTE(currentGroup.id));
        dispatch({ type: reducerCases.SET_MESSAGES, messages: res.data });
      } catch (err) {
        console.error("❌ โหลดข้อความกลุ่มล้มเหลว:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchGroupMessages();
  }, [currentGroup, currentChatUser, dispatch]);

  // ✅ โหลดข้อความ 1-1 (ถ้าอยู่ในแชทส่วนตัว)
  useEffect(() => {
    // ❗ ป้องกันกรณี userInfo หรือ currentChatUser ยังไม่พร้อม
    if (!currentChatUser?.id || !userInfo?.id || currentGroup) return;

    setLoading(true);
    const fetchPrivateMessages = async () => {
      try {
        console.log("📨 Fetching private messages:", {
          from: userInfo.id,
          to: currentChatUser.id,
        });

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
  }, [currentChatUser, currentGroup, dispatch, userInfo]);

  // ✅ ฟังข้อความแบบเรียลไทม์ (กลุ่ม + 1-1)
  useEffect(() => {
    if (!socket?.current) return;

    const handleGroupMessageReceive = ({ message }) => {
      if (
        message?.groupId === currentGroup?.id &&
        message?.senderId !== userInfo?.id
      ) {
        dispatch({ type: reducerCases.ADD_MESSAGE, newMessage: message });
      }
    };

    const handlePrivateMessageReceive = ({ message }) => {
      if (
        (message.receiverId === userInfo?.id || message.senderId === userInfo?.id) &&
        message.senderId !== userInfo?.id
      ) {
        dispatch({ type: reducerCases.ADD_MESSAGE, newMessage: message });
      }
    };

    socket.current.on("group-message-receive", handleGroupMessageReceive);
    socket.current.on("msg-receive", handlePrivateMessageReceive);

    return () => {
      if (socket?.current) {  
        socket.current.off("group-message-receive", handleGroupMessageReceive);
        socket.current.off("msg-receive", handlePrivateMessageReceive);
      }
    };

  }, [socket, currentGroup, currentChatUser, dispatch, userInfo]);

  return (
    <>
      {incomingVoiceCall && <IncomingCall />}

      <div className="h-[80vh] w-full relative flex-grow overflow-auto custom-scrollbar">
        <div className="bg-chat-background bg-fixed h-full w-full opacity-5 fixed left-0 top-0 z-0"></div>

        {currentGroup && (
          <div className="flex justify-end mb-3 mr-6">
            <button
              onClick={() =>
                dispatch({
                  type: reducerCases.SHOW_GROUP_FILES,
                  payload: currentGroup,
                })
              }
              className="bg-icon-green hover:bg-blue-600 text-white font-medium px-3 py-1 rounded-lg transition"
            >
              📂 ดูไฟล์ในกลุ่ม
            </button>
          </div>
        )}

        {showGroupFiles && currentGroup && (
          <GroupFiles
            groupId={currentGroup.id}
            onClose={() => dispatch({ type: reducerCases.HIDE_GROUP_FILES })}
          />
        )}

        <div className="mx-10 my-6 relative bottom-0 z-40 left-0">
          {loading ? (
            <p className="text-gray-400 text-center">กำลังโหลดข้อความ...</p>
          ) : (
            <div className="flex flex-col justify-end w-full gap-1 overflow-auto">
              {messages && messages.length > 0 ? (
                messages.map((message, index) => {
                  const isOwn = message.senderId === userInfo?.id;
                  return (
                    <div
                      key={
                        message.id ||
                        `${message.senderId}-${message.createdAt || index}`
                      }
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
    </>
  );
}

export default ChatContainer;
