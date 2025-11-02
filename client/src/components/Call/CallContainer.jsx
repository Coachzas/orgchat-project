import React, { useEffect } from "react";
import dynamic from "next/dynamic";
import { useStateProvider } from "@/context/StateContext";
import { reducerCases } from "@/context/constants";

const Container = dynamic(() => import("./Container"), { ssr: false });

function CallContainer() {
  const [{ voiceCall, videoCall, socket, userInfo }, dispatch] = useStateProvider();

  const activeCall = voiceCall || videoCall; //  ใช้ตัวไหนก็ได้ที่มีการโทรอยู่

  useEffect(() => {
    console.log("🎬 CallContainer mount");
    console.log("🎬 socket.current:", socket?.current);
    console.log("🎬 activeCall:", activeCall);
  }, [socket, activeCall]);

  useEffect(() => {
    if (!socket?.current || !activeCall) return;

    const eventType =
      activeCall.callType === "voice" ? "outgoing-voice-call" : "outgoing-video-call";

    //  โทรออก
    if (activeCall.type === "out-going") {
      console.log("📤 [Caller] โทรออกไปยัง:", activeCall.id);
      socket.current.emit(eventType, {
        to: activeCall.id,
        from: {
          id: userInfo.id,
          firstName: userInfo.firstName,
          lastName: userInfo.lastName,
          profilePicture: userInfo.profilePicture,
        },
        callType: activeCall.callType,
        roomId: activeCall.roomId,
      });
    }

    //  เมื่อได้รับ event “accept-call” จาก server
    socket.current.on("accept-call", ({ roomId }) => {
      console.log("📲 [Caller] ได้รับ event accept-call:", roomId);

      if (activeCall.callType === "voice") {
        dispatch({
          type: reducerCases.SET_VOICE_CALL,
          voiceCall: { ...activeCall, callAccepted: true, roomId },
        });
      } else {
        dispatch({
          type: reducerCases.SET_VIDEO_CALL,
          videoCall: { ...activeCall, callAccepted: true, roomId },
        });
      }
    });

    //  เมื่อผู้รับปฏิเสธสาย
    socket.current.on("reject-call", () => {
      console.log("📴 [Caller] สายถูกปฏิเสธโดยผู้รับ");
      dispatch({ type: reducerCases.END_CALL });
    });

    return () => {
      socket.current.off("accept-call");
      socket.current.off("reject-call");
    };
  }, [activeCall, socket, userInfo, dispatch]);

  return activeCall ? <Container data={activeCall} /> : null;
}

export default CallContainer;
