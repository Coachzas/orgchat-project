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
  const remoteBoxRef = useRef(null);
  const localBoxRef = useRef(null);

  const isCaller = data?.type === "out-going";

  // ---------- 1) รอการรับสาย ----------
  useEffect(() => {
    if (!data) return;

    if (isCaller && socket?.current) {
      const onAccept = async ({ roomId }) => {
        setCallAccepted(true);

        //  Sync stream อีกครั้งหลังฝั่งรับกด "Accept"
        setTimeout(async () => {
          try {
            const zg = zgRef.current;
            if (zg && roomId) {
              const streams = await zg.getAllPlayStreamList(String(roomId));
              for (const s of streams) {
                const streamID = s.streamID;
                if (!document.getElementById(streamID)) {
                  const remoteEl = document.createElement(
                    data.callType === "video" ? "video" : "audio"
                  );
                  remoteEl.id = streamID;
                  remoteEl.autoplay = true;
                  remoteEl.playsInline = true;
                  remoteEl.muted = false;
                  remoteBoxRef.current?.appendChild(remoteEl);
                  const remoteStream = await zg.startPlayingStream(streamID);
                  remoteEl.srcObject = remoteStream;
                }
              }
            }
          } catch {}
        }, 1000);
      };

      socket.current.off("accept-call", onAccept);
      socket.current.on("accept-call", onAccept);
      return () => socket.current.off("accept-call", onAccept);
    }

    // ฝั่งผู้รับสาย (in-coming)
    if (!isCaller) {
      const timer = setTimeout(() => setCallAccepted(true), 200);
      return () => clearTimeout(timer);
    }
  }, [data, socket]);

  // ---------- 2) ขอ ZEGO token ----------
  useEffect(() => {
    const fetchToken = async () => {
      if (!callAccepted || !userInfo?.id) return;
      try {
        const res = await axios.get(GET_CALL_TOKEN(userInfo.id), {
          withCredentials: true,
        });
        setToken(res.data?.token);
      } catch (err) {
        console.error("Error fetching ZEGO token:", err);
      }
    };
    fetchToken();
  }, [callAccepted, userInfo]);

  // ---------- 3) เริ่ม call ----------
  useEffect(() => {
    let isCancelled = false;

    const startCall = async () => {
      if (!token || !data?.roomId || !userInfo?.id) return;

      // เคลียร์ DOM เดิม
      if (remoteBoxRef.current) remoteBoxRef.current.innerHTML = "";
      if (localBoxRef.current) localBoxRef.current.innerHTML = "";

      const appID = parseInt(process.env.NEXT_PUBLIC_ZEGO_APP_ID, 10);
      const zg = new ZegoExpressEngine(appID);
      zgRef.current = zg;

      //  ฟัง event การเพิ่ม/ลบ stream
      zg.on("roomStreamUpdate", async (roomID, updateType, streamList) => {
        if (updateType === "ADD" && streamList.length > 0) {
          for (const s of streamList) {
            const streamID = s.streamID;
            if (document.getElementById(streamID)) continue;

            const remoteEl = document.createElement(
              data.callType === "video" ? "video" : "audio"
            );
            remoteEl.id = streamID;
            remoteEl.autoplay = true;
            remoteEl.playsInline = true;
            remoteEl.muted = false;
            remoteBoxRef.current?.appendChild(remoteEl);

            try {
              const remoteStream = await zg.startPlayingStream(streamID);
              remoteEl.srcObject = remoteStream;
            } catch {}
          }
        }

        if (updateType === "DELETE" && streamList.length > 0) {
          for (const s of streamList) {
            const streamID = s.streamID;
            zg.stopPlayingStream(streamID);
            const el = document.getElementById(streamID);
            if (el) el.remove();
          }
          endCall();
        }
      });

      //  เข้าห้อง ZEGO
      try {
        await zg.loginRoom(
          String(data.roomId),
          token,
          {
            userID: String(userInfo.id),
            userName: `${userInfo.firstName ?? ""} ${userInfo.lastName ?? ""}`.trim(),
          },
          { userUpdate: true }
        );
      } catch {
        return;
      }

      //  Force sync stream list หลัง join (Edge-friendly)
      setTimeout(async () => {
        try {
          const streams = await zg.getAllPlayStreamList(String(data.roomId));
          for (const s of streams) {
            const streamID = s.streamID;
            if (!document.getElementById(streamID)) {
              const remoteEl = document.createElement(
                data.callType === "video" ? "video" : "audio"
              );
              remoteEl.id = streamID;
              remoteEl.autoplay = true;
              remoteEl.playsInline = true;
              remoteEl.muted = false;
              remoteBoxRef.current?.appendChild(remoteEl);
              const remoteStream = await zg.startPlayingStream(streamID);
              remoteEl.srcObject = remoteStream;
            }
          }
        } catch {}
      }, 900);

      //  สร้าง local stream
      try {
        const localStream = await zg.createStream({
          camera: { audio: true, video: data.callType === "video" },
        });
        localStreamRef.current = localStream;

        const localEl = document.createElement(
          data.callType === "video" ? "video" : "audio"
        );
        localEl.id = "zego-local-media";
        localEl.autoplay = true;
        localEl.playsInline = true;
        localEl.muted = true;
        localEl.className = "h-28 w-32 rounded-md overflow-hidden";
        localEl.srcObject = localStream;
        localBoxRef.current?.appendChild(localEl);

        const streamID = `stream_${userInfo.id}_${Date.now()}`;
        publishStreamIdRef.current = streamID;
        await zg.startPublishingStream(streamID, localStream);
      } catch {}
    };

    if (token) startCall();

    // ---------- Cleanup ----------
    return () => {
      isCancelled = true;
      try {
        if (zgRef.current) {
          if (publishStreamIdRef.current) {
            zgRef.current.stopPublishingStream(publishStreamIdRef.current);
            publishStreamIdRef.current = null;
          }
          if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach((t) => t.stop());
            zgRef.current.destroyStream(localStreamRef.current);
            localStreamRef.current = null;
          }
          if (data?.roomId) zgRef.current.logoutRoom(String(data.roomId));
          zgRef.current.destroyEngine();
          zgRef.current = null;
        }
      } catch {}
      if (remoteBoxRef.current) remoteBoxRef.current.innerHTML = "";
      if (localBoxRef.current) localBoxRef.current.innerHTML = "";
    };
  }, [token, data?.roomId, data?.callType, userInfo?.id, userInfo?.firstName, userInfo?.lastName]);

  // ---------- 4) จบสาย ----------
  const endCall = () => {
    try {
      if (socket?.current?.emit) {
        socket.current.emit("reject-call", {
          from: data.id,
          roomId: data.roomId,
        });
      }
    } catch {}

    try {
      if (zgRef.current) {
        if (publishStreamIdRef.current) {
          zgRef.current.stopPublishingStream(publishStreamIdRef.current);
          publishStreamIdRef.current = null;
        }
        if (localStreamRef.current) {
          localStreamRef.current.getTracks().forEach((t) => t.stop());
          zgRef.current.destroyStream(localStreamRef.current);
          localStreamRef.current = null;
        }
        if (data?.roomId) zgRef.current.logoutRoom(String(data.roomId));
        zgRef.current.destroyEngine();
        zgRef.current = null;
      }
    } catch {}

    if (remoteBoxRef.current) remoteBoxRef.current.innerHTML = "";
    if (localBoxRef.current) localBoxRef.current.innerHTML = "";

    dispatch({ type: reducerCases.END_CALL });
  };

  const isVoice = data?.callType === "voice";

  return (
    <div className="border-conversation-border border-l w-full bg-conversation-panel-background flex flex-col h-[100vh] overflow-hidden items-center justify-center text-white">
      <div className="flex flex-col gap-3 items-center">
        <span className="text-5xl">
          {`${data.firstName ?? ""} ${data.lastName ?? ""}`.trim()}
        </span>
        <span className="text-lg">
          {callAccepted
            ? "กำลังโทรอยู่"
            : data.callType === "video"
            ? "กำลังรอสาย (วิดีโอ)"
            : "กำลังรอสาย"}
        </span>
      </div>

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

      <div className="my-5 relative">
        <div ref={remoteBoxRef} id="remote-media-box" />
        <div
          className="absolute bottom-5 right-5"
          ref={localBoxRef}
          id="local-media-box"
        />
      </div>

      <div className="h-16 w-16 bg-red-600 flex items-center justify-center rounded-full">
        <MdOutlineCallEnd className="text-3xl cursor-pointer" onClick={endCall} />
      </div>
    </div>
  );
}

export default Container;
