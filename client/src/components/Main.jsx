import React, { useEffect, useRef, useState } from "react";
import ChatList from "./Chatlist/ChatList";
import Empty from "./Empty";
import axios from "axios";
import { HOST, GET_MESSAGES_ROUTE_1V1 } from "@/utils/ApiRoutes";
import { useRouter } from "next/router";
import { useStateProvider } from "@/context/StateContext";
import { reducerCases } from "@/context/constants";
import Chat from "./Chat/Chat";
import SearchMessages from "./Chat/SearchMessages";
import { io } from "socket.io-client";
import VoiceCall from "./Call/VoiceCall";
import VideoCall from "./Call/VideoCall";
import IncomingVideoCall from "./common/IncomingVideoCall";
import IncomingVoiceCall from "./common/IncomingCall";

function Main() {
  const router = useRouter();
  const [
    {
      userInfo,
      currentChatUser,
      messagesSearch,
      videoCall,
      voiceCall,
      incomingVoiceCall,
      incomingVideoCall,
    },
    dispatch,
  ] = useStateProvider();

  const [socketEvent, setSocketEvent] = useState(false);
  const socket = useRef(null);

  useEffect(() => {
    if (!userInfo) router.push("/login");
  }, [userInfo, router]);

  // ----- เชื่อมต่อ socket.io -----
  useEffect(() => {
    if (userInfo && !socket.current) {
      socket.current = io(HOST);
      socket.current.emit("add-user", userInfo.id);
      dispatch({ type: reducerCases.SET_SOCKET, socket: socket.current });
    }
    return () => {
      if (socket.current?.connected) socket.current.disconnect();
      socket.current = null;
    };
  }, [userInfo, dispatch]);

  // ----- subscribe event จาก socket -----
  useEffect(() => {
    if (socket.current && !socketEvent) {
      const socketRef = socket.current;

      const handleMsgReceive = ({ message }) => {
        dispatch({ type: reducerCases.ADD_MESSAGE, newMessage: message });
      };

      socketRef.on("msg-receive", handleMsgReceive);

      setSocketEvent(true);
      return () => {
        socketRef.off("msg-receive", handleMsgReceive);
      };
    }
  }, [socketEvent, userInfo, dispatch]);

  // ----- โหลดประวัติแชท -----
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

  return (
    <>
      {incomingVideoCall && <IncomingVideoCall />}
      {incomingVoiceCall && <IncomingVoiceCall />}
      {videoCall ? (
        <div className="h-screen w-screen max-h-full overflow-hidden">
          <VideoCall />
        </div>
      ) : voiceCall ? (
        <div className="h-screen w-screen max-h-full overflow-hidden">
          <VoiceCall />
        </div>
      ) : (
        <div className="grid grid-cols-main h-screen w-screen max-h-screen max-w-full overflow-hidden">
          <ChatList />
          <div className="flex justify-center items-center w-full">
            {currentChatUser ? (
              <div
                className={`w-full ${messagesSearch ? "grid grid-cols-2" : "flex"}`}
              >
                <Chat key={currentChatUser?.id} />
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
