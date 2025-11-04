import React, { useEffect, useRef, useState } from "react";
import ChatList from "./Chatlist/ChatList";
import Empty from "./Empty";
import axios from "axios";
import {
  SOCKET_HOST,
  CHECK_AUTH_ROUTE,
  GET_MESSAGES_ROUTE_1V1,
} from "@/utils/ApiRoutes";
import { useRouter } from "next/router";
import { useStateProvider } from "@/context/StateContext";
import { reducerCases } from "@/context/constants";
import Chat from "./Chat/Chat";
import SearchMessages from "./Chat/SearchMessages";
import { io } from "socket.io-client";
import CallContainer from "./Call/CallContainer";
import GroupCallContainer from "./Call/GroupCallContainer";
import IncomingVideoCall from "./common/IncomingVideoCall";
import IncomingVoiceCall from "./common/IncomingCall";
import IncomingGroupCall from "./common/IncomingGroupCall";

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
      groupCall,
      incomingVoiceCall,
      incomingVideoCall,
      incomingGroupCall,
    },
    dispatch,
  ] = useStateProvider();

  const socket = useRef(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  //  ตรวจสอบ session
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
        console.warn("⚠️ No active session:", err?.response?.status || err?.message);
      } finally {
        setCheckingAuth(false);
      }
    };
    checkSession();
  }, []);

  //  ถ้าไม่มี session → กลับ login
  useEffect(() => {
    if (!userInfo && !checkingAuth) router.push("/login");
  }, [userInfo, router, checkingAuth]);

  //  เชื่อม socket.io
  useEffect(() => {
    if (userInfo && !socket.current) {
      socket.current = io(SOCKET_HOST, { withCredentials: true });
      socket.current.emit("add-user", userInfo.id);
      dispatch({ type: reducerCases.SET_SOCKET, socket });

      // 🎯 role updated realtime
      socket.current.on("role-updated", (data) => {
        if (userInfo?.id === data.id) {
          dispatch({
            type: reducerCases.SET_USER_INFO,
            userInfo: { ...userInfo, role: data.role },
          });
          alert(`📢 สิทธิ์ของคุณถูกเปลี่ยนเป็น "${data.role}"`);
        }
      });

      // 💬 ข้อความใหม่ realtime
      socket.current.on("msg-receive", ({ message }) => {
        dispatch({ type: reducerCases.ADD_MESSAGE, newMessage: message });
      });

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

  // โหลดข้อความ 1v1
  useEffect(() => {
    const getMessages = async () => {
      if (!userInfo?.id || !currentChatUser?.id) return;
      try {
        const { data } = await axios.get(
          GET_MESSAGES_ROUTE_1V1(userInfo.id, currentChatUser.id)
        );
        if (Array.isArray(data))
          dispatch({ type: reducerCases.SET_MESSAGES, messages: data });
      } catch (err) {
        console.error("Error fetching messages:", err);
      }
    };
    if (currentChatUser?.id) getMessages();
  }, [currentChatUser, userInfo, dispatch]);

  //  ฟัง event โทรเข้า
  useEffect(() => {
    if (!socket.current) return;

    // 🎧 โทรเสียง
    socket.current.on("incoming-voice-call", (data) => {
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

    // 🎥 โทรวิดีโอ
    socket.current.on("incoming-video-call", (data) => {
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

    // 👥 โทรกลุ่ม
    socket.current.on("incoming-group-call", (data) => {
      console.log("📥 [Main] สายเข้าแบบกลุ่ม:", data);
      dispatch({
        type: reducerCases.SET_INCOMING_GROUP_CALL,
        incomingGroupCall: {
          groupId: data.groupId,
          groupName: data.groupName,
          from: data.from,
          callType: data.callType,
          roomId: data.roomId,
          type: "in-coming",
        },
      });
    });

    return () => {
      if (socket.current) {
        socket.current.off("incoming-voice-call");
        socket.current.off("incoming-video-call");
        socket.current.off("incoming-group-call");
      }
    };
  }, [socket, dispatch]);

  //  แสดง UI
  return (
    <>
      {/* Popup โทรเข้า */}
      {incomingVideoCall && <IncomingVideoCall />}
      {incomingVoiceCall && <IncomingVoiceCall />}
      {incomingGroupCall && <IncomingGroupCall />}

      {/* แสดงหน้าการโทร */}
      {videoCall || voiceCall ? (
        <div className="h-screen w-screen overflow-hidden">
          <CallContainer />
        </div>
      ) : groupCall ? (
        <div className="h-screen w-screen overflow-hidden">
          <GroupCallContainer data={groupCall} />
        </div>
      ) : (
        //  หน้าหลัก
        <div className="grid grid-cols-main h-screen w-screen overflow-hidden">
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
