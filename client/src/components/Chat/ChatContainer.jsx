// ✅ ChatContainer.jsx (แก้ socket.current ครบทุกจุด)
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
import IncomingCall from "../common/IncomingCall";

const VoiceMessage = dynamic(() => import("./VoiceMessage"), { ssr: false });

function ChatContainer() {
  const [
    { messages, currentChatUser, currentGroup, userInfo, socket, incomingVoiceCall },
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

  // ✅ ฟังสายเข้า (voice)
  useEffect(() => {
    if (!socket?.current) return;

    const handleIncomingVoice = (data) => {
      console.log("📞 Incoming voice call detected:", data);
      dispatch({
        type: reducerCases.SET_INCOMING_VOICE_CALL,
        incomingVoiceCall: {
          id: data.from.id,
          firstName: data.from.firstName || data.from.name?.split(" ")[0],
          lastName: data.from.lastName || data.from.name?.split(" ")[1] || "",
          profilePicture: data.from.profilePicture,
          callType: data.callType,
          roomId: data.roomId,
        },
      });
    };

    const handleCancelCall = () => {
      dispatch({
        type: reducerCases.SET_INCOMING_VOICE_CALL,
        incomingVoiceCall: undefined,
      });
    };

    // ✅ ใช้ socket.current แทน socket
    socket.current.on("incoming-voice-call", handleIncomingVoice);
    socket.current.on("cancel-voice-call", handleCancelCall);

    return () => {
      socket.current?.off("incoming-voice-call", handleIncomingVoice);
      socket.current?.off("cancel-voice-call", handleCancelCall);
    };
  }, [socket, dispatch]);

  // ✅ เข้าห้องกลุ่มเมื่อ currentGroup เปลี่ยน
  useEffect(() => {
    if (socket?.current && currentGroup) {
      socket.current.emit("join-group", currentGroup.id);
    }
  }, [socket, currentGroup]);

  // ✅ โหลดข้อความกลุ่มจากฐานข้อมูล
  useEffect(() => {
    const fetchGroupMessages = async () => {
      if (!currentGroup) return;
      setLoading(true);
      try {
        const res = await axios.get(`${GET_GROUP_MESSAGES_ROUTE}/${currentGroup.id}`);
        dispatch({ type: reducerCases.SET_MESSAGES, messages: res.data });
      } catch (err) {
        console.error("❌ โหลดข้อความกลุ่มล้มเหลว:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchGroupMessages();
  }, [currentGroup, dispatch]);

  // ✅ โหลดข้อความ 1-1 จากฐานข้อมูล
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

  // ✅ ฟังข้อความกลุ่มแบบเรียลไทม์
  useEffect(() => {
    if (!socket?.current) return;

    const handleGroupMessageReceive = (data) => {
      const { message } = data;
      if (
        message?.groupId === currentGroup?.id &&
        message?.senderId !== userInfo?.id
      ) {
        dispatch({
          type: reducerCases.ADD_MESSAGE,
          newMessage: message,
        });
      }
    };

    socket.current.on("group-message-receive", handleGroupMessageReceive);
    return () => socket.current?.off("group-message-receive", handleGroupMessageReceive);
  }, [socket, currentGroup, dispatch, userInfo]);

  // ✅ ฟังข้อความ 1-1 แบบเรียลไทม์
  useEffect(() => {
    if (!socket?.current) return;

    const handlePrivateMessageReceive = (data) => {
      const { message } = data;
      if (
        (message.receiverId === userInfo?.id ||
          message.senderId === userInfo?.id) &&
        message.senderId !== userInfo?.id
      ) {
        console.log("💬 รับข้อความเรียลไทม์:", message);
        dispatch({
          type: reducerCases.ADD_MESSAGE,
          newMessage: message,
        });
      }
    };

    socket.current.on("msg-receive", handlePrivateMessageReceive);
    return () => socket.current?.off("msg-receive", handlePrivateMessageReceive);
  }, [socket, currentChatUser, dispatch, userInfo]);

  // ✅ แสดง popup รับสายเมื่อมี incoming call
  return (
    <>
      {incomingVoiceCall && <IncomingCall />}

      <div className="h-[80vh] w-full relative flex-grow overflow-auto custom-scrollbar">
        <div className="bg-chat-background bg-fixed h-full w-full opacity-5 fixed left-0 top-0 z-0"></div>
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
                          className={`text-white px-2 py-[5px] text-sm rounded-md flex gap-2 items-end max-w-[45%] ${
                            isOwn
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
