import { useStateProvider } from "@/context/StateContext";
import { reducerCases } from "@/context/constants";
import { GET_CALL_TOKEN } from "@/utils/ApiRoutes";
import axios from "axios";
import Image from "next/image";
import React, { useEffect, useRef, useState } from "react";
import { MdOutlineCallEnd } from "react-icons/md";
import { ZegoExpressEngine } from "zego-express-engine-webrtc";

function Container({ data }) {
  const [{ socket, userInfo }, dispatch] = useStateProvider();

  const [callAccepted, setCallAccepted] = useState(false);
  const [token, setToken] = useState(undefined);
  const zgRef = useRef(null);
  const localStreamRef = useRef(null);
  const publishStreamIdRef = useRef(null);

  // DOM refs เพื่อหลีกเลี่ยง querySelector หลายรอบ
  const remoteBoxRef = useRef(null);
  const localBoxRef = useRef(null);

  // ---------- 1) รอการรับสาย ----------
  useEffect(() => {
    if (!data) return;

    if (data.type === "out-going" && socket?.current) {
      //  รออีกฝั่งกดรับสายก่อนถึงจะเปลี่ยน callAccepted = true
      const onAccept = ({ roomId }) => {
        console.log("📞 อีกฝั่งกดรับสายแล้ว roomId:", roomId);
        setCallAccepted(true);
      };
      socket.current.off("accept-call", onAccept);
      socket.current.on("accept-call", onAccept);
      return () => socket.current.off("accept-call", onAccept);
    }

    //  ฝั่งผู้รับสาย (incoming) เท่านั้นที่ setCallAccepted(true) ทันที
    if (data.type === "in-coming") {
      const timer = setTimeout(() => setCallAccepted(true), 200);
      return () => clearTimeout(timer);
    }
  }, [data, socket]);


  // ---------- 2) ขอ ZEGO token หลังรับสาย ----------
  useEffect(() => {
    const fetchToken = async () => {
      if (!callAccepted || !userInfo?.id) return;
      try {
        const res = await axios.get(GET_CALL_TOKEN(userInfo.id), {
          withCredentials: true, //  สำคัญถ้าใช้ cookie
        });
        setToken(res.data?.token);
      } catch (err) {
        console.error("❌ Error fetching ZEGO token:", err);
      }
    };
    fetchToken();
  }, [callAccepted, userInfo]);

  // ---------- 3) เริ่ม call กับ ZEGO ----------
  useEffect(() => {
    let isCancelled = false;

    const startCall = async () => {
      try {
        if (!token || !data?.roomId || !userInfo?.id) {
          console.error("❌ Missing required info to start call:", {
            hasToken: !!token,
            roomId: data?.roomId,
            userId: userInfo?.id,
          });
          return;
        }

        // เคลียร์ DOM เดิม (กัน append ซ้ำ)
        if (remoteBoxRef.current) remoteBoxRef.current.innerHTML = "";
        if (localBoxRef.current) localBoxRef.current.innerHTML = "";

        // สร้าง engine
        const appID = parseInt(process.env.NEXT_PUBLIC_ZEGO_APP_ID, 10);
        const zg = new ZegoExpressEngine(appID);
        zgRef.current = zg;

        // ฟัง remote stream
        zg.on("roomStreamUpdate", async (roomID, updateType, streamList) => {
          if (updateType === "ADD" && streamList.length > 0) {
            const remoteEl = document.createElement(
              data.callType === "video" ? "video" : "audio"
            );
            remoteEl.id = streamList[0].streamID;
            remoteEl.autoplay = true;
            remoteEl.playsInline = true;
            remoteEl.muted = false;
            if (remoteBoxRef.current) remoteBoxRef.current.appendChild(remoteEl);

            try {
              const remoteStream = await zg.startPlayingStream(streamList[0].streamID);
              remoteEl.srcObject = remoteStream;
            } catch (e) {
              console.error("❌ startPlayingStream failed:", e);
            }
          }

          if (updateType === "DELETE") {
            // อีกฝั่งวางสาย
            endCall();
          }
        });

        // login room
        await zg.loginRoom(
          String(data.roomId),
          token,
          {
            userID: String(userInfo.id),
            userName: `${userInfo.firstName ?? ""} ${userInfo.lastName ?? ""}`.trim(),
          },
          { userUpdate: true }
        );

        if (isCancelled) return;

        // สร้าง local stream (voice/video)
        const localStream = await zg.createStream({
          camera: { audio: true, video: data.callType === "video" },
        });
        localStreamRef.current = localStream;

        // แสดง local preview
        const localEl = document.createElement(
          data.callType === "video" ? "video" : "audio"
        );
        localEl.id = "zego-local-media";
        localEl.autoplay = true;
        localEl.playsInline = true;
        localEl.muted = true;
        localEl.className = "h-28 w-32 rounded-md overflow-hidden";
        localEl.srcObject = localStream;
        if (localBoxRef.current) localBoxRef.current.appendChild(localEl);

        // publish
        const streamID = `stream_${userInfo.id}_${Date.now()}`;
        publishStreamIdRef.current = streamID;
        await zg.startPublishingStream(streamID, localStream);
      } catch (err) {
        console.error("❌ startCall error:", err);
      }
    };

    if (token) startCall();

    // cleanup เมื่อ component unmount หรือ token เปลี่ยน
    return () => {
      isCancelled = true;
      try {
        if (zgRef.current) {
          // stop publish
          if (publishStreamIdRef.current) {
            zgRef.current.stopPublishingStream(publishStreamIdRef.current);
            publishStreamIdRef.current = null;
          }
          // destroy local
          if (localStreamRef.current) {
            zgRef.current.destroyStream(localStreamRef.current);
            localStreamRef.current = null;
          }
          // logout
          if (data?.roomId) {
            zgRef.current.logoutRoom(String(data.roomId));
          }
          // destroy engine
          zgRef.current.destroyEngine();
          zgRef.current = null;
        }
      } catch (e) {
        console.warn("cleanup error:", e);
      }

      if (remoteBoxRef.current) remoteBoxRef.current.innerHTML = "";
      if (localBoxRef.current) localBoxRef.current.innerHTML = "";
    };
  }, [token, data?.roomId, data?.callType, userInfo?.id, userInfo?.firstName, userInfo?.lastName]);

  // ---------- 4) จบสาย ----------
  const endCall = () => {
    try {
      // แจ้งอีกฝั่งด้วย event มาตรฐานเดียวกัน
      if (socket?.current?.emit) {
        socket.current.emit("reject-call", {
          from: data.id, // id ของ "อีกฝั่ง" เพื่อให้ server ยิงกลับหาคนโทร
          roomId: data.roomId,
        });
      }
    } catch (e) {
      console.warn("emit reject-call failed:", e);
    }

    // cleanup ZEGO
    try {
      if (zgRef.current) {
        if (publishStreamIdRef.current) {
          zgRef.current.stopPublishingStream(publishStreamIdRef.current);
          publishStreamIdRef.current = null;
        }
        if (localStreamRef.current) {
          zgRef.current.destroyStream(localStreamRef.current);
          localStreamRef.current = null;
        }
        if (data?.roomId) {
          zgRef.current.logoutRoom(String(data.roomId));
        }
        zgRef.current.destroyEngine();
        zgRef.current = null;
      }
    } catch (e) {
      console.warn("ZEGO cleanup error:", e);
    }

    if (remoteBoxRef.current) remoteBoxRef.current.innerHTML = "";
    if (localBoxRef.current) localBoxRef.current.innerHTML = "";

    dispatch({ type: reducerCases.END_CALL });
  };

  const isVoice = data?.callType === "voice";

  return (
    <div className="border-conversation-border border-l w-full bg-conversation-panel-background flex flex-col h-[100vh] overflow-hidden items-center justify-center text-white">
      <div className="flex flex-col gap-3 items-center">
        <span className="text-5xl">{`${data.firstName ?? ""} ${data.lastName ?? ""}`.trim()}</span>
        <span className="text-lg">
          {callAccepted
            ? "กำลังโทรอยู่"
            : data.callType === "video"
              ? "กำลังรอสาย (วิดีโอ)"
              : "กำลังรอสาย"}
        </span>

      </div>

      {/* แสดง avatar ระหว่างรอสาย หรือกรณี voice call */}
      {(!callAccepted || isVoice) && (
        <div className="my-24">
          <Image
            src={data.profilePicture || "/default-avatar.png"}
            alt="avatar"
            height={300}
            width={300}
            className="rounded-full object-cover"
          />
        </div>
      )}

      {/* กล่อง remote + local */}
      <div className="my-5 relative">
        <div ref={remoteBoxRef} id="remote-media-box" />
        <div className="absolute bottom-5 right-5" ref={localBoxRef} id="local-media-box" />
      </div>

      {/* ปุ่มวางสาย */}
      <div className="h-16 w-16 bg-red-600 flex items-center justify-center rounded-full">
        <MdOutlineCallEnd className="text-3xl cursor-pointer" onClick={endCall} />
      </div>
    </div>
  );
}

export default Container;
