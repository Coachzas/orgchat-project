import { useStateProvider } from "@/context/StateContext";
import {
  ADD_IMAGE_MESSAGES_ROUTE,
  ADD_MESSAGE_ROUTE,
  ADD_FILE_MESSAGE_ROUTE,
} from "@/utils/ApiRoutes";
import axios from "axios";
import { reducerCases } from "@/context/constants";
import React, { useState, useRef } from "react";
import { BsEmojiSmile } from "react-icons/bs";
import { ImAttachment } from "react-icons/im";
import { MdSend } from "react-icons/md";
import { FaMicrophone, FaImage } from "react-icons/fa";
import EmojiPicker from "emoji-picker-react";
import dynamic from "next/dynamic";

const CaptureAudio = dynamic(() => import("../common/CaptureAudio"), { ssr: false });

function MessageBar() {
  const [{ userInfo, currentChatUser, currentGroup, socket }, dispatch] = useStateProvider();
  const [message, setMessage] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const emojiPickerRef = useRef(null);
  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);
  const [showAudioRecorder, setShowAudioRecorder] = useState(false);

  const handleEmojiModal = () => setShowEmojiPicker((prev) => !prev);
  const handleEmojiClick = (emojiObject) => setMessage((prev) => prev + emojiObject.emoji);

  // ✅ ส่งข้อความ
  const sendMessage = async () => {
    if (!message.trim()) return;

    try {
      // ✅ ถ้าเป็นกลุ่ม
      if (currentGroup && currentGroup.id) {
        const res = await axios.post(
          `http://localhost:3005/api/groups/${currentGroup.id}/messages`,
          {
            from: userInfo.id,
            message,
          },
          { withCredentials: true }
        );

        // ✅ อัปเดตข้อความใน state ทันที
        dispatch({
          type: reducerCases.ADD_MESSAGE,
          newMessage: {
            id: Date.now(),
            senderId: userInfo.id,
            groupId: currentGroup.id,
            message,
            type: "text",
            createdAt: new Date().toISOString(),
            messageStatus: "sent",
          },
        });

        // ✅ แจ้ง socket ให้ broadcast ไปยังคนอื่นในกลุ่ม
        if (socket && socket.connected) {
          socket.emit("group-message-send", {
            groupId: currentGroup.id,
            from: userInfo.id,
            message,
            type: "text",
          });
          console.log("📡 ส่งข้อความกลุ่มผ่าน socket:", message);
        }

        setMessage("");
        return; // ❗ หยุดที่นี่ ไม่ต้องไปส่งต่อใน 1-1
      }

      // ✅ ถ้าเป็นแชท 1-1
      if (currentChatUser && currentChatUser.id) {
        const { data } = await axios.post(ADD_MESSAGE_ROUTE, {
          to: currentChatUser.id,
          from: userInfo.id,
          message,
        });

        dispatch({
          type: reducerCases.ADD_MESSAGE,
          newMessage: {
            id: Date.now(),
            senderId: userInfo.id,
            receiverId: currentChatUser.id,
            message: data.message.message || data.message,
            type: "text",
            createdAt: new Date().toISOString(),
            messageStatus: "sent",
          },
        });

        if (socket?.connected) {
          socket.emit("send-msg", {
            to: currentChatUser.id,
            from: userInfo.id,
            message: data.message.message || data.message,
            type: "text",
          });
          console.log("💬 ส่งข้อความ 1-1 ผ่าน socket:", message);
        }

        setMessage("");
      }
    } catch (err) {
      console.error("❌ Error sending message:", err);
    }
  };

  return (
    <div className="bg-panel-header-background h-20 px-4 flex items-center gap-6 relative">
      {!showAudioRecorder ? (
        <>
          <div className="flex gap-4 items-center">
            <BsEmojiSmile
              className="text-panel-header-icon text-xl cursor-pointer"
              onClick={handleEmojiModal}
            />
            <FaImage
              className="text-panel-header-icon text-xl cursor-pointer"
              onClick={() => imageInputRef.current.click()}
            />
            <ImAttachment
              className="text-panel-header-icon text-xl cursor-pointer"
              onClick={() => fileInputRef.current.click()}
            />
          </div>

          {showEmojiPicker && (
            <div
              className="absolute bottom-24 left-16 z-40 bg-gray-800 p-2 rounded-lg shadow-lg"
              ref={emojiPickerRef}
            >
              <EmojiPicker onEmojiClick={handleEmojiClick} theme="dark" />
            </div>
          )}

          <div className="w-full rounded-lg h-10 flex items-center">
            <input
              type="text"
              placeholder={
                currentGroup
                  ? `ส่งข้อความใน "${currentGroup.name}"...`
                  : currentChatUser
                  ? `พิมพ์ข้อความถึง ${currentChatUser.firstName}...`
                  : "พิมพ์ข้อความ..."
              }
              className="bg-input-background text-sm text-white h-10 rounded-lg px-5 py-4 w-full"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            />
          </div>

          <div className="flex w-10 justify-center items-center">
            {message ? (
              <MdSend
                className="text-panel-header-icon text-xl cursor-pointer"
                onClick={sendMessage}
              />
            ) : (
              <FaMicrophone
                className="text-panel-header-icon text-xl cursor-pointer"
                onClick={() => setShowAudioRecorder(true)}
              />
            )}
          </div>
        </>
      ) : (
        <CaptureAudio onChange={setShowAudioRecorder} />
      )}

      {/* Hidden Inputs */}
      <input
        ref={fileInputRef}
        type="file"
        style={{ display: "none" }}
        accept=".pdf,.zip,.doc,.docx,.xlsx,.txt"
      />
      <input
        ref={imageInputRef}
        type="file"
        style={{ display: "none" }}
        accept="image/*"
      />
    </div>
  );
}

export default MessageBar;
