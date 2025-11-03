import React, { useEffect, useState } from "react";
import { useStateProvider } from "@/context/StateContext";
import MessageStatus from "../common/MessageStatus";
import { calculateTime } from "@/utils/CalculateTime";
import ImageMessage from "./ImageMessage";
import dynamic from "next/dynamic";
import FileMessage from "./FileMessage";
import GroupFiles from "./GroupFile";
import AdminNote from "./AdminNote";
import axios from "axios";
import {
  GET_GROUP_MESSAGES_ROUTE,
  GET_MESSAGES_ROUTE,
  GET_ALL_CONTACTS,
  GET_LATEST_GROUP_NOTE_ROUTE, //  เพิ่ม
} from "@/utils/ApiRoutes";
import { reducerCases } from "@/context/constants";
import IncomingCall from "../common/IncomingCall";
import Avatar from "../common/Avatar";

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
  const [showAdminNotes, setShowAdminNotes] = useState(false);
  const [latestNote, setLatestNote] = useState(null); //  ประกาศล่าสุด

  // 🟢 โหลดประกาศล่าสุด
  useEffect(() => {
    if (!currentGroup?.id) return;
    const fetchLatestNote = async () => {
      try {
        const res = await axios.get(GET_LATEST_GROUP_NOTE_ROUTE(currentGroup.id), {
          withCredentials: true,
        });
        setLatestNote(res.data);
      } catch (err) {
        console.error("❌ โหลดประกาศล่าสุดล้มเหลว:", err);
      }
    };
    fetchLatestNote();
  }, [currentGroup]);

  //  เพิ่มผู้ใช้เข้า online list เมื่อ socket เชื่อมต่อ
  useEffect(() => {
    if (socket?.current && userInfo?.id) {
      socket.current.emit("add-user", userInfo.id);
      console.log("🟢 Added user to onlineUsers:", userInfo.id);
    }
  }, [socket, userInfo]);

  //  เข้าห้องกลุ่ม (และออกจากห้องเก่า)
  useEffect(() => {
    if (socket?.current) {
      if (currentGroup) {
        socket.current.emit("leave-all-groups");
        socket.current.emit("join-group", currentGroup.id);
        console.log("📡 Joined group:", currentGroup.id);
      }
    }
  }, [socket, currentGroup]);

  //  โหลดข้อความกลุ่ม (ถ้าอยู่ในกลุ่ม)
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

  //  โหลดข้อความ 1-1 (ถ้าอยู่ในแชทส่วนตัว)
  useEffect(() => {
    if (!currentChatUser?.id || !userInfo?.id || currentGroup) return;
    setLoading(true);
    const fetchPrivateMessages = async () => {
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
  }, [currentChatUser, currentGroup, dispatch, userInfo]);

  //  ฟังข้อความแบบเรียลไทม์ (กลุ่ม + 1-1)
  useEffect(() => {
    if (!socket?.current) return;

    const handleGroupMessageReceive = async ({ message }) => {
      if (message?.groupId !== currentGroup?.id) return;

      if (!message.sender) {
        try {
          const res = await axios.get(GET_ALL_CONTACTS);
          const grouped = res.data?.users;
          const contacts = grouped ? Object.values(grouped).flat() : res.data || [];
          const found = contacts.find(
            (u) =>
              String(u.id) === String(message.senderId) ||
              String(u.userId) === String(message.senderId)
          );
          if (found) message.sender = found;
        } catch (err) {
          console.warn("Could not fetch contacts to resolve sender:", err);
        }
      }

      dispatch({ type: reducerCases.ADD_MESSAGE, newMessage: message });
    };

    socket.current.on("group-message-receive", handleGroupMessageReceive);
    return () => {
      if (socket?.current)
        socket.current.off("group-message-receive", handleGroupMessageReceive);
    };
  }, [socket, currentGroup, currentChatUser, dispatch, userInfo]);

  return (
    <>
      {incomingVoiceCall && <IncomingCall />}

      <div className="h-[80vh] w-full relative flex-grow overflow-y-auto overflow-x-hidden custom-scrollbar">
        <div className="bg-chat-background bg-fixed h-full w-full opacity-5 fixed left-0 top-0 z-0 pointer-events-none"></div>

        {/*  แสดงประกาศแอดมิน */}
        {latestNote && currentGroup && (
          <div className="bg-yellow-500/15 border border-yellow-400/60 text-yellow-300
                  px-3 py-1.5 rounded-lg mx-6 mb-2 shadow-sm
                  flex items-center gap-2 sticky top-0 z-40 backdrop-blur-sm">
            <span className="text-lg">📢</span>
            <div className="flex flex-col">
              <span className="text-sm text-white font-medium">
                {latestNote.message}
              </span>
              <span className="text-[11px] text-yellow-200 font-light">
                โดย {latestNote.sender?.firstName} {latestNote.sender?.lastName} •{" "}
                {new Date(latestNote.createdAt).toLocaleString()}
              </span>
            </div>
          </div>
        )}

        {/* ปุ่มดูไฟล์/โน้ต */}
        {currentGroup && (
          <div className="flex justify-end mb-3 mr-6 gap-3">
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

            {userInfo?.role === "admin" && (
              <button
                onClick={() => {
                  console.log("🟡 Admin Notes clicked");
                  setShowAdminNotes(true);
                }}
                className="bg-yellow-500 hover:bg-yellow-600 text-black font-medium px-3 py-1 rounded-lg transition"
              >
                📝 Admin Notes
              </button>
            )}
          </div>
        )}

        {/* Modal ไฟล์กลุ่ม */}
        {showGroupFiles && currentGroup && (
          <GroupFiles
            groupId={currentGroup.id}
            onClose={() => dispatch({ type: reducerCases.HIDE_GROUP_FILES })}
          />
        )}

        {/* Modal โน้ตแอดมิน */}
        {showAdminNotes && currentGroup && userInfo?.role === "admin" && (
          <>
            <AdminNote
              groupId={currentGroup.id}
              onClose={() => setShowAdminNotes(false)}
            />
            {console.log("🟢 Rendering AdminNote for group:", currentGroup?.id)}
          </>
        )}

        {/* ข้อความแชท */}
        <div className="mx-10 my-6 relative bottom-0 z-40 left-0">
          {loading ? (
            <p className="text-gray-400 text-center">กำลังโหลดข้อความ...</p>
          ) : (
            <div className="flex flex-col justify-end w-full gap-1">
              {messages && messages.length > 0 ? (
                messages.map((message, index) => {
                  const isOwn = message.senderId === userInfo?.id;
                  const sender = message.sender || null;
                  const bubbleWrapperClass =
                    message.type === "file"
                      ? "max-w-[78%]"
                      : currentGroup
                        ? "max-w-[70%]"
                        : "max-w-none w-[92%]";
                  const senderName = sender
                    ? `${(sender.firstName || "").trim()} ${(sender.lastName || "").trim()}`.trim() ||
                    sender.name ||
                    sender.email
                    : null;

                  return (
                    <div
                      key={
                        message.id ||
                        `${message.senderId}-${message.createdAt || index}`
                      }
                      className={`flex ${isOwn ? "justify-end" : "justify-start"
                        } mb-2 ${!currentGroup
                          ? isOwn
                            ? "mr-[6px]"
                            : "ml-[6px]"
                          : ""
                        }`}
                    >
                      <div
                        className={`flex items-start gap-1 ${isOwn ? "flex-row-reverse" : "flex-row"
                          }`}
                      >
                        {message.groupId && sender && (
                          <div className="flex flex-col items-center text-xs w-[3.5rem]">
                            <Avatar
                              type="sm"
                              image={
                                sender.profilePicture || "/default-avatar.png"
                              }
                            />
                            {senderName && (
                              <div className="text-white text-[12px] mt-1 text-center truncate px-1">
                                {senderName}
                              </div>
                            )}
                          </div>
                        )}

                        <div className={bubbleWrapperClass}>
                          {message.type === "text" && (
                            <div
                              className={`${isOwn ? "self-end" : "self-start"}`}
                            >
                              <div
                                className={`${isOwn
                                    ? "bg-outgoing-background text-white"
                                    : "bg-incoming-background text-white"
                                  } text-sm leading-[1.4] rounded-[14px] px-[14px] py-[10px] break-words`}
                                style={{
                                  wordBreak: "break-word",
                                  overflowWrap: "anywhere",
                                }}
                              >
                                <span className="whitespace-pre-wrap break-words">
                                  {message?.message}
                                </span>
                                <div className="flex justify-end items-center gap-1 mt-2">
                                  <span className="text-bubble-meta text-[11px]">
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
                            </div>
                          )}
                          {message.type === "image" && (
                            <ImageMessage message={message} />
                          )}
                          {message.type === "audio" && (
                            <VoiceMessage message={message} />
                          )}
                          {message.type === "file" && (
                            <FileMessage
                              message={message}
                              isOwnMessage={isOwn}
                            />
                          )}
                        </div>
                      </div>
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
