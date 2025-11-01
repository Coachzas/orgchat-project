// ✅ MessageBar.jsx (เวอร์ชันแก้แล้ว ใช้ socket.current ทุกจุด)
import { useStateProvider } from "@/context/StateContext";
import {
  ADD_FILE_MESSAGE_ROUTE,
  ADD_IMAGE_MESSAGES_ROUTE,
  ADD_MESSAGE_ROUTE,
  ADD_AUDIO_MESSAGES_ROUTE,
  ADD_GROUP_MESSAGE_ROUTE,
} from "@/utils/ApiRoutes";
import axios from "axios";
import React, { useState, useRef, useEffect } from "react";
import { BsEmojiSmile } from "react-icons/bs";
import { ImAttachment } from "react-icons/im";
import { MdSend } from "react-icons/md";
import { FaMicrophone, FaImage } from "react-icons/fa";
import EmojiPicker from "emoji-picker-react";
import dynamic from "next/dynamic";
import { reducerCases } from "@/context/constants";

const CaptureAudio = dynamic(() => import("../common/CaptureAudio"), { ssr: false });

function MessageBar() {
  const [{ userInfo, currentChatUser, currentGroup, socket }, dispatch] =
    useStateProvider();
  const [message, setMessage] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const emojiPickerRef = useRef(null);
  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);
  const [showAudioRecorder, setShowAudioRecorder] = useState(false);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(e.target)) {
        setShowEmojiPicker(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    console.log("📂 currentGroup:", currentGroup);
    console.log("👤 currentChatUser:", currentChatUser);
  }, [currentGroup, currentChatUser]);

  // ✅ ส่งข้อความ text หรือ emoji
  const sendMessage = async () => {
    if (!message.trim()) return;

    try {
      // 🧠 ตรวจสอบว่ามีผู้ส่ง-ผู้รับหรือไม่ก่อนส่ง
      if (!userInfo?.id) {
        console.warn("⚠️ Missing userInfo.id, cannot send message.");
        return;
      }

      // ✅ ถ้าอยู่ในกลุ่ม
      if (currentGroup?.id) {
        const res = await axios.post(
          ADD_GROUP_MESSAGE_ROUTE,
          {
            from: userInfo.id,
            groupId: currentGroup.id,
            message,
            type: "text",
          },
          { withCredentials: true }
        );

        dispatch({
          type: reducerCases.ADD_MESSAGE,
          newMessage: {
            ...res.data.message,
            senderId: userInfo.id,
            message,
            type: "text",
          },
        });

        socket?.current?.emit("group-message-send", {
          from: userInfo.id,
          message,
          type: "text",
          groupId: currentGroup.id,
        });
      }
      // ✅ ถ้าเป็นแชท 1-1
      else if (currentChatUser?.id) {
        console.log("📨 Sending private message to:", currentChatUser.id);
        const res = await axios.post(
          ADD_MESSAGE_ROUTE,
          {
            from: userInfo.id,
            to: currentChatUser.id,
            message,
          },
          { withCredentials: true }
        );

        dispatch({
          type: reducerCases.ADD_MESSAGE,
          newMessage: {
            ...res.data.message,
            senderId: userInfo.id,
            message,
            type: "text",
          },
        });

        socket?.current?.emit("send-msg", {
          from: userInfo.id,
          to: currentChatUser.id,
          message,
          type: "text",
        });
      }
      // ❌ ถ้าไม่มีทั้ง currentGroup และ currentChatUser
      else {
        console.warn("⚠️ No chat target found, message not sent.");
        return;
      }

      setMessage("");
    } catch (error) {
      console.error("❌ Text send failed:", error.response?.data || error.message);
    }
  };


  // ✅ ส่งรูปภาพ
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("image", file);
    formData.append("from", userInfo.id);
    formData.append("to", currentChatUser?.id || "");
    formData.append("groupId", currentGroup?.id || "");

    try {
      const res = await axios.post(ADD_IMAGE_MESSAGES_ROUTE, formData, {
        headers: { "Content-Type": "multipart/form-data" },
        withCredentials: true,
      });

      const newMessage = {
        ...res.data,
        senderId: userInfo.id,
        type: "image",
        message: URL.createObjectURL(file),
        createdAt: new Date().toISOString(),
      };

      dispatch({ type: reducerCases.ADD_MESSAGE, newMessage });

      if (socket?.current) {
        socket.current.emit(
          currentGroup ? "group-message-send" : "send-msg",
          currentGroup
            ? { from: userInfo.id, message: newMessage.message, type: "image", groupId: currentGroup.id }
            : { from: userInfo.id, message: newMessage.message, type: "image", to: currentChatUser?.id }
        );
      }
    } catch (error) {
      console.error("❌ Image upload failed:", error);
    }
  };

  // ✅ ส่งไฟล์เอกสาร
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("from", userInfo.id);
    formData.append("to", currentChatUser?.id || "");
    formData.append("groupId", currentGroup?.id || "");

    try {
      const res = await axios.post(ADD_FILE_MESSAGE_ROUTE, formData, {
        headers: { "Content-Type": "multipart/form-data" },
        withCredentials: true,
      });

      const newMessage = {
        ...res.data,
        senderId: userInfo.id,
        type: "file",
        fileName: file.name,
        createdAt: new Date().toISOString(),
      };

      dispatch({ type: reducerCases.ADD_MESSAGE, newMessage });

      if (socket?.current) {
        socket.current.emit(
          currentGroup ? "group-message-send" : "send-msg",
          currentGroup
            ? { from: userInfo.id, message: newMessage.message, type: "file", groupId: currentGroup.id }
            : { from: userInfo.id, message: newMessage.message, type: "file", to: currentChatUser?.id }
        );
      }
    } catch (error) {
      console.error("❌ File upload failed:", error);
    }
  };

  // ✅ ส่งเสียง
  const handleAudioUpload = async (audioBlob) => {
    const file = new File([audioBlob], "audio.mp3", { type: "audio/mpeg" });
    const formData = new FormData();
    formData.append("audio", file);
    formData.append("from", userInfo.id);
    formData.append("to", currentChatUser?.id || "");
    formData.append("groupId", currentGroup?.id || "");

    try {
      const res = await axios.post(ADD_AUDIO_MESSAGES_ROUTE, formData, {
        headers: { "Content-Type": "multipart/form-data" },
        withCredentials: true,
      });
      const newMessage = { ...res.data, senderId: userInfo.id, type: "audio" };
      dispatch({ type: reducerCases.ADD_MESSAGE, newMessage });

      if (socket?.current) {
        socket.current.emit(
          currentGroup ? "group-message-send" : "send-msg",
          currentGroup
            ? { from: userInfo.id, message: newMessage.message, type: "audio", groupId: currentGroup.id }
            : { from: userInfo.id, message: newMessage.message, type: "audio", to: currentChatUser?.id }
        );
      }
    } catch (error) {
      console.error("❌ Audio upload failed:", error);
    }
  };

  return (
    <div className="bg-panel-header-background h-20 px-4 flex items-center gap-6 relative">
      {!showAudioRecorder ? (
        <>
          <div className="flex gap-4 items-center relative">
            <BsEmojiSmile
              className="text-panel-header-icon text-xl cursor-pointer"
              onClick={() => setShowEmojiPicker((prev) => !prev)}
            />
            {showEmojiPicker && (
              <div ref={emojiPickerRef} className="absolute bottom-12 left-0 z-50">
                <EmojiPicker
                  onEmojiClick={(e) => setMessage((prev) => prev + e.emoji)}
                  theme="dark"
                  emojiStyle="google"
                />
              </div>
            )}
            <FaImage
              className="text-panel-header-icon text-xl cursor-pointer"
              onClick={() => imageInputRef.current?.click()}
            />
            <ImAttachment
              className="text-panel-header-icon text-xl cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            />
          </div>

          {/* ✅ Hidden inputs */}
          <input
            ref={fileInputRef}
            type="file"
            style={{ display: "none" }}
            accept=".pdf,.zip,.doc,.docx,.xlsx,.txt"
            onChange={handleFileUpload}
          />
          <input
            ref={imageInputRef}
            type="file"
            style={{ display: "none" }}
            accept="image/*"
            onChange={handleImageUpload}
          />

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
        <CaptureAudio
          onStop={(audioBlob) => {
            handleAudioUpload(audioBlob);
            setShowAudioRecorder(false);
          }}
          onChange={() => setShowAudioRecorder(false)}
        />
      )}
    </div>
  );
}

export default MessageBar;
