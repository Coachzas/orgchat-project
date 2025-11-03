import React, { useEffect, useRef, useState } from "react";
import ChatList from "./Chatlist/ChatList";
import Empty from "./Empty";
import axios from "axios";
import { SOCKET_HOST, CHECK_AUTH_ROUTE, GET_MESSAGES_ROUTE_1V1 } from "@/utils/ApiRoutes";
import { useRouter } from "next/router";
import { useStateProvider } from "@/context/StateContext";
import { reducerCases } from "@/context/constants";
import Chat from "./Chat/Chat";
import SearchMessages from "./Chat/SearchMessages";
import { io } from "socket.io-client";
import CallContainer from "./Call/CallContainer";
import IncomingVideoCall from "./common/IncomingVideoCall";
import IncomingVoiceCall from "./common/IncomingCall";

function Main() {
  const router = useRouter();
  const [
    {
      userInfo,
      currentChatUser,
      currentGroup,
      messagesSearch,
      videoCall,
      voiceCall,
      incomingVoiceCall,
      incomingVideoCall,
    },
    dispatch,
  ] = useStateProvider();

  const socket = useRef(null);

  // � ตรวจสอบ session ปัจจุบัน เมื่อเปิดแอป (ถ้าหน้าตัวแปร userInfo ยังว่าง)
  const [checkingAuth, setCheckingAuth] = useState(true);
  useEffect(() => {
    const checkSession = async () => {
      try {
        if (!userInfo) {
          const res = await axios.get(CHECK_AUTH_ROUTE, { withCredentials: true });
          if (res?.data?.user) {
            dispatch({ type: reducerCases.SET_USER_INFO, userInfo: res.data.user });
          }
        }
      } catch (err) {
        // ถ้าไม่มี session จะถูก redirect โดย useEffect ด้านล่าง (เมื่อ checkingAuth = false)
        console.log("No active session or unable to fetch current user", err?.response?.status || err?.message);
      } finally {
        setCheckingAuth(false);
      }
    };

    checkSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // �🔹 ตรวจสอบผู้ใช้ ถ้าไม่มีให้กลับไป login (แต่รอการตรวจสอบ session เริ่มต้นก่อน)
  useEffect(() => {
    if (!userInfo && !checkingAuth) router.push("/login");
  }, [userInfo, router, checkingAuth]);

  // 🔹 เชื่อมต่อ socket.io และฟัง event ทั้งหมด (role, message)
  useEffect(() => {
    if (userInfo && !socket.current) {
      // Connect directly to backend socket host so socket.io connects to the server (not Next dev server)
      socket.current = io(SOCKET_HOST, { withCredentials: true });
      socket.current.emit("add-user", userInfo.id);
      dispatch({ type: reducerCases.SET_SOCKET, socket });

      //  ฟัง event อัปเดต role (เรียลไทม์)
      socket.current.on("role-updated", (data) => {
        console.log("📡 [Main] role-updated:", data);
        if (userInfo?.id === data.id) {
          dispatch({
            type: reducerCases.SET_USER_INFO,
            userInfo: { ...userInfo, role: data.role },
          });
          alert(`📢 สิทธิ์ของคุณถูกเปลี่ยนเป็น "${data.role}"`);
        }
      });

      //  ฟัง event รับข้อความแบบเรียลไทม์ (1-1 messages)
      socket.current.on("msg-receive", ({ message }) => {
        console.log("📨 ได้รับข้อความใหม่จาก socket:", message);
        // Accept all msg-receive events (including messages sent by this user) because server is authoritative and emits saved messages for both sender and recipient.
        dispatch({
          type: reducerCases.ADD_MESSAGE,
          newMessage: message,
        });
      });

      //  cleanup ป้องกัน event ซ้ำ
      return () => {
        if (socket.current) {
          socket.current.off("role-updated");
          socket.current.off("msg-receive");
          socket.current.disconnect();
        }
        socket.current = null;
      };
    }
  }, [userInfo, dispatch]);

  // 🔹 โหลดประวัติแชท (1-1)
  useEffect(() => {
    const getMessages = async () => {
      if (!userInfo?.id || !currentChatUser?.id) return;
      try {
        const { data } = await axios.get(
          GET_MESSAGES_ROUTE_1V1(userInfo.id, currentChatUser.id)
        );
        if (Array.isArray(data)) {
          dispatch({ type: reducerCases.SET_MESSAGES, messages: data });
        }
      } catch (error) {
        console.error("Error fetching messages:", error);
      }
    };

    if (currentChatUser?.id) getMessages();
  }, [currentChatUser, userInfo, dispatch]);

  // 🔹 ฟัง event การโทรเข้า
  useEffect(() => {
    if (!socket.current) return;

    // 🎧 สายเข้า (เสียง)
    socket.current.on("incoming-voice-call", (data) => {
      console.log("📥 มีสายเข้า (เสียง):", data);
      dispatch({
        type: reducerCases.SET_INCOMING_VOICE_CALL,
        incomingVoiceCall: {
          id: data.from.id,
          firstName: data.from.firstName,
          lastName: data.from.lastName,
          profilePicture: data.from.profilePicture,
          callType: data.callType,
          roomId: data.roomId,
          type: "in-coming",
        },
      });
    });

    // 🎥 สายเข้า (วิดีโอ)
    socket.current.on("incoming-video-call", (data) => {
      console.log("📥 มีสายเข้า (วิดีโอ):", data);
      dispatch({
        type: reducerCases.SET_INCOMING_VIDEO_CALL,
        incomingVideoCall: {
          id: data.from.id,
          firstName: data.from.firstName,
          lastName: data.from.lastName,
          profilePicture: data.from.profilePicture,
          callType: data.callType,
          roomId: data.roomId,
          type: "in-coming",
        },
      });
    });

    //  cleanup
    return () => {
      if (socket.current) {
        socket.current.off("incoming-voice-call");
        socket.current.off("incoming-video-call");
      }
    };
  }, [socket, dispatch]);

  return (
    <>
      {/* Popup สายเข้า */}
      {incomingVideoCall && <IncomingVideoCall />}
      {incomingVoiceCall && <IncomingVoiceCall />}

      {/* ถ้ามีสายอยู่ แสดงหน้าสาย */}
      {(videoCall || voiceCall) ? (
        <div className="h-screen w-screen max-h-full overflow-hidden">
          <CallContainer />
        </div>
      ) : (
        // หน้าหลัก (Chat + ChatList)
        <div className="grid grid-cols-main h-screen w-screen max-h-screen max-w-full overflow-hidden">
          <ChatList />
          <div className="flex justify-center items-center w-full">
            {currentChatUser || currentGroup ? (
              <div
                className={`w-full ${messagesSearch ? "grid grid-cols-2" : "flex"}`}
              >
                <Chat key={currentChatUser?.id || currentGroup?.id} />
                {messagesSearch && <SearchMessages />}
              </div>
            ) : (
              <Empty />
            )}
          </div>
        </div>
      )}
    </>
  );
}

export default Main;
