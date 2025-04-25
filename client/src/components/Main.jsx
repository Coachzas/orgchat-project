import React, { useEffect, useRef, useState } from "react";
import ChatList from "./Chatlist/ChatList";
import Empty from "./Empty";
import { onAuthStateChanged } from "firebase/auth";
import { firebaseAuth } from "@/utils/FirebaseConfig";
import axios from "axios";
import { CHECK_USER_ROUTE, GET_MESSAGES_ROUTE, HOST } from "@/utils/ApiRoutes";
import { useRouter } from "next/router";
import { useStateProvider } from "@/context/StateContext";
import { reducerCases } from "@/context/constants";
import Chat from "./Chat/Chat";
import { io } from "socket.io-client";

function Main() {
  const router = useRouter();
  const [{ userInfo, currentChatUser }, dispatch] = useStateProvider();
  const [redirectLogin, setRedirectLogin] = useState(false);
  const [socketEvent, setSocketEvent] = useState(false);
  const socket = useRef(null);
  const fetchedUserRef = useRef(false);

  useEffect(() => {
    if (redirectLogin) router.push("/login");
  }, [redirectLogin]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(firebaseAuth, async (currentUser) => {
      if (!currentUser) {
        setRedirectLogin(true);
        return;
      }

      if (!fetchedUserRef.current && currentUser?.email) {
        fetchedUserRef.current = true;
        try {
          const { data } = await axios.post(CHECK_USER_ROUTE, { email: currentUser.email });
          if (!data.status) {
            router.push("/login");
          }
          
          if (data?.data) {
            const { id, name, email, profilePicture: profileImage, status } = data.data;
            dispatch({
              type: reducerCases.SET_USER_INFO,
              userInfo: { id, name, email, profileImage, status },
            });
          }
        } catch (error) {
          console.error("❌ Error fetching user info:", error);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (userInfo && !socket.current) {
      socket.current = io(HOST);
      socket.current.emit("add-user", userInfo.id);
      dispatch({ type: reducerCases.SET_SOCKET, socket });
    }

    return () => {
      if (socket.current) {
        socket.current.disconnect();
        socket.current = null;
      }
    };
  }, [userInfo]);

  useEffect(() => {
    if (socket.current && !socketEvent) {
      socket.current.on("msg-recieve", (data) => {
        dispatch({
          type: reducerCases.ADD_MESSAGE,
          newMessage: {
            ...data.message,
          },
        });
      });
      setSocketEvent(true);
    }
  }, [socket.current, socketEvent]);

  useEffect(() => {
    const getMessages = async () => {
      if (!userInfo?.id || !currentChatUser?.id) return;

      try {
        const response = await axios.get(`${GET_MESSAGES_ROUTE}/${userInfo.id}/${currentChatUser.id}`);
        if (Array.isArray(response.data)) {
          dispatch({ type: reducerCases.SET_MESSAGES, messages: response.data });
        }
      } catch (error) {
        console.error("❌ Error fetching messages:", error);
      }
    };

    if (currentChatUser?.id) getMessages();
  }, [currentChatUser]);

  return (
    <div className="grid grid-cols-main h-screen w-screen max-h-screen max-w-full overflow-hidden">
      <ChatList />
      <div className="flex justify-center items-center">
        {currentChatUser ? <Chat key={currentChatUser?.id} /> : <Empty />}
      </div>
    </div>
  );
}

export default Main;
