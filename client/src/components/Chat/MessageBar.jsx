import { useStateProvider } from "@/context/StateContext";
import { ADD_IMAGE_MESSAGES_ROUTE, ADD_MESSAGE_ROUTE } from "@/utils/ApiRoutes";
import axios from "axios";
import { reducerCases } from "@/context/constants";
import React, { useEffect, useState, useRef } from "react";
import { BsEmojiSmile } from "react-icons/bs";
import { ImAttachment } from "react-icons/im";
import { MdSend } from "react-icons/md";
import EmojiPicker from "emoji-picker-react";

function MessageBar() {
  const [{ userInfo, currentChatUser, socket }, dispatch] = useStateProvider();
  const [message, setMessage] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [grabPhoto, setGrabPhoto] = useState(false);
  const emojiPickerRef = useRef(null);
  const fileInputRef = useRef(null); // ใช้ useRef กับ input file

  // เปิด/ปิด Emoji Picker
  const handleEmojiModal = () => {
    setShowEmojiPicker((prev) => !prev);
  };

  // เมื่อเลือกอิโมจิ
  const handleEmojiClick = (emojiObject) => {
    setMessage((prevMessage) => prevMessage + emojiObject.emoji);
  };

  // ✅ อัปโหลดไฟล์รูปภาพ
  const handleFileChange = async (e) => {
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
            message: `http://localhost:3005${data.message}`,
            type: "image",
            createdAt: new Date().toISOString(),
            messageStatus: "sent",
          },
        });
      }
    } catch (err) {
      console.error("❌ Error uploading file:", err.response?.data || err.message);
    }
  };
  useEffect(() => {
    if (grabPhoto && fileInputRef.current) {
      fileInputRef.current.click(); // เปิด file picker
      setGrabPhoto(false); // ปิดสถานะหลังจากเปิดแล้ว
    }
  }, [grabPhoto]);

  // ✅ ส่งข้อความปกติ
  const sendMessage = async () => {
    if (!message.trim() || !currentChatUser?.id) return;

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

      if (socket && socket.connected) {
        socket.emit("send-msg", {
          to: currentChatUser.id,
          from: userInfo.id,
          message: data.message.message || data.message,
          type: "text",
        });
      }

      setMessage(""); // ล้าง input
    } catch (err) {
      console.error("❌ Error sending message:", err);
    }
  };

  return (
    <div className="bg-panel-header-background h-20 px-4 flex items-center gap-6 relative">
      <div className="flex gap-6">
        <BsEmojiSmile
          className="text-panel-header-icon cursor-pointer text-xl emoji-button"
          title="Emoji"
          onClick={handleEmojiModal}
        />
        {showEmojiPicker && (
          <div
            className="absolute bottom-24 left-16 z-40 bg-gray-800 p-2 rounded-lg shadow-lg"
            ref={emojiPickerRef}
          >
            <EmojiPicker onEmojiClick={handleEmojiClick} theme="dark" />
          </div>
        )}
        <ImAttachment
          className="text-panel-header-icon cursor-pointer text-xl"
          title="Attach File"
          onClick={() => setGrabPhoto(true)}
        />
      </div>
      <div className="w-full rounded-lg h-10 flex items-center">
        <input
          type="text"
          placeholder="Type a message"
          className="bg-input-background text-sm focus:outline-none text-white h-10 rounded-lg px-5 py-4 w-full"
          onChange={(e) => setMessage(e.target.value)}
          value={message}
        />
      </div>
      <div className="flex w-10 items-center justify-center">
        <button onClick={sendMessage}>
          <MdSend
            className="text-panel-header-icon cursor-pointer text-xl"
            title="Send message"
          />
        </button>
      </div>

      {/* Input file (ซ่อนไว้) */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        style={{ display: "none" }}
        accept="image/*,video/*"
      />
    </div>
  );
}

export default MessageBar;
