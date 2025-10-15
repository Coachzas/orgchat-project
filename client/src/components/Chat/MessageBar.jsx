import { useStateProvider } from "@/context/StateContext";
import { ADD_FILE_MESSAGE_ROUTE } from "@/utils/ApiRoutes";
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
  const [{ userInfo, currentChatUser, currentGroup, socket }, dispatch] =
    useStateProvider();
  const [message, setMessage] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const emojiPickerRef = useRef(null);
  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);
  const [showAudioRecorder, setShowAudioRecorder] = useState(false);

  // 🎯 เมื่อเลือกไฟล์
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("from", userInfo.id);
    formData.append("to", currentChatUser?.id || "");
    formData.append("groupId", currentGroup?.id || "");

    try {
      console.log("📤 กำลังอัปโหลดไฟล์...");
      const res = await axios.post(ADD_FILE_MESSAGE_ROUTE, formData, {
        headers: { "Content-Type": "multipart/form-data" },
        withCredentials: true,
      });

      console.log("✅ Upload success:", res.data);

      dispatch({
        type: reducerCases.ADD_MESSAGE,
        newMessage: res.data,
      });
    } catch (error) {
      console.error("❌ File upload failed:", error);
    }
  };

  const handleEmojiModal = () => setShowEmojiPicker((prev) => !prev);
  const handleEmojiClick = (emojiObject) =>
    setMessage((prev) => prev + emojiObject.emoji);

  const sendMessage = async () => {
    if (!message.trim()) return;

    // … (โค้ดส่งข้อความปกติที่คุณมีอยู่แล้ว)
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

          <input
            ref={fileInputRef}
            type="file"
            style={{ display: "none" }}
            onChange={handleFileUpload}
            accept=".pdf,.zip,.doc,.docx,.xlsx,.txt"
          />
          <input
            ref={imageInputRef}
            type="file"
            style={{ display: "none" }}
            accept="image/*"
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
        <CaptureAudio onChange={setShowAudioRecorder} />
      )}
    </div>
  );
}

export default MessageBar;
