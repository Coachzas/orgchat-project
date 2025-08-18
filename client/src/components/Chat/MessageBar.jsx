import { useStateProvider } from "@/context/StateContext";
import {
  ADD_IMAGE_MESSAGES_ROUTE,
  ADD_MESSAGE_ROUTE,
  ADD_FILE_MESSAGE_ROUTE,
} from "@/utils/ApiRoutes";
import axios from "axios";
import { reducerCases } from "@/context/constants";
import React, { useEffect, useState, useRef } from "react";
import { BsEmojiSmile } from "react-icons/bs";
import { ImAttachment } from "react-icons/im";
import { MdSend } from "react-icons/md";
import { FaMicrophone, FaImage } from "react-icons/fa";
import EmojiPicker from "emoji-picker-react";
import dynamic from "next/dynamic";

const CaptureAudio = dynamic(() => import("../common/CaptureAudio"), { ssr: false });

function MessageBar() {
  const [{ userInfo, currentChatUser, socket }, dispatch] = useStateProvider();
  const [message, setMessage] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const emojiPickerRef = useRef(null);
  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);
  const [showAudioRecorder, setShowAudioRecorder] = useState(false);

  const handleEmojiModal = () => {
    setShowEmojiPicker((prev) => !prev);
  };

  const handleEmojiClick = (emojiObject) => {
    setMessage((prev) => prev + emojiObject.emoji);
  };

  // ✅ รูปภาพ
  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const formData = new FormData();
      formData.append("image", file);
      formData.append("from", userInfo.id);
      formData.append("to", currentChatUser.id);

      const response = await axios.post(ADD_IMAGE_MESSAGES_ROUTE, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const { data } = response;

      if (response.status === 201) {
        dispatch({
          type: reducerCases.ADD_MESSAGE,
          newMessage: {
            id: Date.now(),
            senderId: userInfo.id,
            receiverId: currentChatUser.id,
            message: `${process.env.NEXT_PUBLIC_API_URL.replace("/api", "")}${data.message}`,
            type: "image",
            createdAt: new Date().toISOString(),
            messageStatus: "sent",
          },
        });
      }
    } catch (err) {
      console.error("❌ Error uploading image:", err);
    }
  };

  // ✅ ไฟล์ทั่วไป (pdf, zip, doc, ฯลฯ)
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("from", userInfo.id);
      formData.append("to", currentChatUser.id);

      const response = await axios.post(ADD_FILE_MESSAGE_ROUTE, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const { data } = response;

      if (response.status === 201) {
        dispatch({
          type: reducerCases.ADD_MESSAGE,
          newMessage: {
            id: Date.now(),
            senderId: userInfo.id,
            receiverId: currentChatUser.id,
            message: file.name,
            fileUrl: `${process.env.NEXT_PUBLIC_API_URL.replace("/api", "")}${data.message}`,
            type: "file",
            createdAt: new Date().toISOString(),
            messageStatus: "sent",
          },
        });
      }
    } catch (err) {
      console.error("❌ Error uploading file:", err);
    }
  };

  // ✅ ข้อความธรรมดา
  const sendMessage = async () => {
    if (!message.trim()) return;

    try {
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
      }

      setMessage("");
    } catch (err) {
      console.error("❌ Error sending message:", err);
    }
  };

  return (
    <div className="bg-panel-header-background h-20 px-4 flex items-center gap-6 relative">
      {!showAudioRecorder ? (
        <>
          {/* 🎨 ปุ่มต่าง ๆ */}
          <div className="flex gap-4 items-center">
            <BsEmojiSmile className="text-panel-header-icon text-xl cursor-pointer" onClick={handleEmojiModal} />
            <FaImage className="text-panel-header-icon text-xl cursor-pointer" onClick={() => imageInputRef.current.click()} />
            <ImAttachment className="text-panel-header-icon text-xl cursor-pointer" onClick={() => fileInputRef.current.click()} />
          </div>

          {/* ✅ Emoji Picker */}
          {showEmojiPicker && (
            <div className="absolute bottom-24 left-16 z-40 bg-gray-800 p-2 rounded-lg shadow-lg" ref={emojiPickerRef}>
              <EmojiPicker onEmojiClick={handleEmojiClick} theme="dark" />
            </div>
          )}

          {/* 🔤 Input */}
          <div className="w-full rounded-lg h-10 flex items-center">
            <input
              type="text"
              placeholder="พิมพ์ข้อความ"
              className="bg-input-background text-sm text-white h-10 rounded-lg px-5 py-4 w-full"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </div>

          {/* 📨 ปุ่มส่ง */}
          <div className="flex w-10 justify-center items-center">
            {message ? (
              <MdSend className="text-panel-header-icon text-xl cursor-pointer" onClick={sendMessage} />
            ) : (
              <FaMicrophone className="text-panel-header-icon text-xl cursor-pointer" onClick={() => setShowAudioRecorder(true)} />
            )}
          </div>
        </>
      ) : (
        <CaptureAudio onChange={setShowAudioRecorder} />
      )}

      {/* 📁 input file */}
      <input ref={fileInputRef} type="file" onChange={handleFileChange} style={{ display: "none" }} accept=".pdf,.zip,.doc,.docx,.xlsx,.txt" />
      {/* 🖼 input image */}
      <input ref={imageInputRef} type="file" onChange={handleImageChange} style={{ display: "none" }} accept="image/*" />
    </div>
  );
}

export default MessageBar;
