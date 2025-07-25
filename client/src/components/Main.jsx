import React, { useEffect, useRef, useState } from "react";
import ChatList from "./Chatlist/ChatList";
import Empty from "./Empty";
import { onAuthStateChanged } from "firebase/auth";
import { firebaseAuth } from "@/utils/FirebaseConfig";
import axios from "axios";
import {
  CHECK_USER_ROUTE,
  GET_MESSAGES_ROUTE,
  HOST,
} from "@/utils/ApiRoutes";
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

  const [redirectLogin, setRedirectLogin] = useState(false);
  const [socketEvent, setSocketEvent] = useState(false);
  const socket = useRef(null);
  const fetchedUserRef = useRef(false);

  useEffect(() => {
    if (redirectLogin) router.push("/login");
  }, [redirectLogin, router]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(firebaseAuth, async (currentUser) => {
      if (!currentUser) {
        setRedirectLogin(true);
        return;
      }

      if (!fetchedUserRef.current && currentUser?.email) {
        fetchedUserRef.current = true;
        try {
          const { data } = await axios.post(CHECK_USER_ROUTE, {
            email: currentUser.email,
          });

          if (!data.status) {
            router.push("/login");
          }

          if (data?.data) {
            const {
              id,
              name,
              email,
              profilePicture: profileImage,
              status,
            } = data.data;
            dispatch({
              type: reducerCases.SET_USER_INFO,
              userInfo: { id, name, email, profileImage, status },
            });
          }
        } catch (error) {
          console.error("Error fetching user info:", error);
        }
      }
    });

    return () => unsubscribe();
  }, [dispatch, router]);

  useEffect(() => {
    if (userInfo && !socket.current) {
      socket.current = io(HOST);
      socket.current.emit("add-user", userInfo.id);
      dispatch({ type: reducerCases.SET_SOCKET, socket: socket.current });
    }

    return () => {
      if (socket.current) {
        if (socket.current.connected) {
          socket.current.disconnect();
        }
        socket.current = null;
      }
    };
  }, [userInfo, dispatch]);

  useEffect(() => {
    if (socket.current && !socketEvent) {
      const socketRef = socket.current;

      const handleMsgReceive = ({ message }) => {
  dispatch({
    type: reducerCases.ADD_MESSAGE,
    newMessage: message,
  });
};


      const handleIncomingVoiceCall = ({ from, roomId, callType }) => {
        dispatch({
          type: reducerCases.SET_INCOMING_VOICE_CALL,
          incomingVoiceCall: { ...from, roomId, callType },
        });
      };

      const handleIncomingVideoCall = ({ from, roomId, callType }) => {
        dispatch({
          type: reducerCases.SET_INCOMING_VIDEO_CALL,
          incomingVideoCall: { ...from, roomId, callType },
        });
      };

      const handleVoiceCallRejected = () => {
        dispatch({ type: reducerCases.END_CALL });
      };

      const handleVideoCallRejected = () => {
        dispatch({ type: reducerCases.END_CALL });
      };

      const handleOnlineUsers = ({ onlineUsers }) => {
        dispatch({
          type: reducerCases.SET_ONLINE_USERS,
          onlineUsers,
        });
      };

      socketRef.on("msg-receive", handleMsgReceive);
      socketRef.on("incoming-voice-call", handleIncomingVoiceCall);
      socketRef.on("incoming-video-call", handleIncomingVideoCall);
      socketRef.on("voice-call-rejected", handleVoiceCallRejected);
      socketRef.on("video-call-rejected", handleVideoCallRejected);
      socketRef.on("online-users", handleOnlineUsers);

      setSocketEvent(true);

      return () => {
        socketRef.off("msg-receive", handleMsgReceive);
        socketRef.off("incoming-voice-call", handleIncomingVoiceCall);
        socketRef.off("incoming-video-call", handleIncomingVideoCall);
        socketRef.off("voice-call-rejected", handleVoiceCallRejected);
        socketRef.off("video-call-rejected", handleVideoCallRejected);
        socketRef.off("online-users", handleOnlineUsers);
      };
    }
  }, [socketEvent, userInfo, dispatch]);

  useEffect(() => {
    const getMessages = async () => {
      if (!userInfo?.id || !currentChatUser?.id) return;
      try {
        const response = await axios.get(
          `${GET_MESSAGES_ROUTE}/${userInfo.id}/${currentChatUser.id}`
        );
        if (Array.isArray(response.data)) {
          dispatch({
            type: reducerCases.SET_MESSAGES,
            messages: response.data,
          });
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
              <div className={`w-full ${messagesSearch ? "grid grid-cols-2" : "flex"}`}>
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
