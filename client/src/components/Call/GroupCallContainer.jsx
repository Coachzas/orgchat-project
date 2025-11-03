import React, { useEffect, useRef, useState } from "react";
import { useStateProvider } from "@/context/StateContext";
import { reducerCases } from "@/context/constants";
import { GET_CALL_TOKEN_GROUP } from "@/utils/ApiRoutes";

import axios from "axios";
import { MdOutlineCallEnd } from "react-icons/md";
import { ZegoExpressEngine } from "zego-express-engine-webrtc";

function GroupCallContainer({ data }) {
  const [{ socket, userInfo }, dispatch] = useStateProvider();
  const [token, setToken] = useState(undefined);
  const zgRef = useRef(null);
  const localStreamRef = useRef(null);
  const publishStreamIdRef = useRef(null);
  const remoteBoxRef = useRef(null);
  const localBoxRef = useRef(null);

  // ✅ ขอ ZEGO token
  useEffect(() => {
    const fetchToken = async () => {
      if (!userInfo?.id) return;
      try {
        const res = await axios.get(GET_CALL_TOKEN_GROUP(userInfo.id), { withCredentials: true });
        setToken(res.data?.token);
      } catch (err) {
        console.error("Error fetching ZEGO token:", err);
      }
    };
    fetchToken();
  }, [userInfo]);

  // ✅ เริ่มโทรกลุ่ม
  useEffect(() => {
    if (!token || !data?.roomId || !userInfo) return;

    const appID = parseInt(process.env.NEXT_PUBLIC_ZEGO_APP_ID, 10);
    const zg = new ZegoExpressEngine(appID);
    zgRef.current = zg;

    const startGroupCall = async () => {
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

        const localStream = await zg.createStream({
          camera: { audio: true, video: data.callType === "video" },
        });

        localStreamRef.current = localStream;

        const localEl = document.createElement(data.callType === "video" ? "video" : "audio");
        localEl.id = `local_${userInfo.id}`;
        localEl.autoplay = true;
        localEl.playsInline = true;
        localEl.muted = true;
        localEl.className = "h-28 w-32 rounded-md overflow-hidden";
        localEl.srcObject = localStream;
        localBoxRef.current?.appendChild(localEl);

        const streamID = `stream_${userInfo.id}_${Date.now()}`;
        publishStreamIdRef.current = streamID;
        await zg.startPublishingStream(streamID, localStream);
      } catch (err) {
        console.error("ZEGO startGroupCall error:", err);
      }
    };

    startGroupCall();

    zg.on("roomStreamUpdate", async (roomID, updateType, streamList) => {
      if (updateType === "ADD" && streamList.length > 0) {
        for (const s of streamList) {
          const streamID = s.streamID;
          if (document.getElementById(streamID)) continue;
          const remoteEl = document.createElement(data.callType === "video" ? "video" : "audio");
          remoteEl.id = streamID;
          remoteEl.autoplay = true;
          remoteEl.playsInline = true;
          remoteEl.muted = false;
          remoteEl.className = "w-48 h-40 rounded-md m-2 object-cover";
          remoteBoxRef.current?.appendChild(remoteEl);
          const remoteStream = await zg.startPlayingStream(streamID);
          remoteEl.srcObject = remoteStream;
        }
      }

      if (updateType === "DELETE" && streamList.length > 0) {
        for (const s of streamList) {
          const streamID = s.streamID;
          zg.stopPlayingStream(streamID);
          const el = document.getElementById(streamID);
          if (el) el.remove();
        }
      }
    });

    // ✅ cleanup ทั้ง ZEGO + DOM
    return () => {
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
          zgRef.current.logoutRoom(String(data.roomId));
          zgRef.current.destroyEngine();
          zgRef.current = null;
        }
      } catch {}

      // ✅ ล้าง DOM ที่ค้าง
      if (remoteBoxRef.current) remoteBoxRef.current.innerHTML = "";
      if (localBoxRef.current) localBoxRef.current.innerHTML = "";
    };
  }, [token, data?.roomId, data?.callType, userInfo]);

  // ✅ ออกจากสาย
  const endGroupCall = () => {
    try {
      if (socket?.current?.emit) {
        socket.current.emit("leave-group-call", { groupId: data.groupId, userId: userInfo.id });
      }
    } catch (err) {
      console.error("Socket error on leave-group-call:", err);
    }
    dispatch({ type: reducerCases.END_GROUP_CALL });
  };

  return (
    <div className="flex flex-col h-[100vh] bg-conversation-panel-background text-white items-center justify-center overflow-hidden">
      <h2 className="text-2xl font-semibold mb-4">Group Call - {data.groupName}</h2>
      <div ref={remoteBoxRef} className="grid grid-cols-3 gap-2 p-4 overflow-y-auto" />
      <div ref={localBoxRef} className="absolute bottom-4 right-4" />
      <button
        onClick={endGroupCall}
        className="h-16 w-16 bg-red-600 flex items-center justify-center rounded-full mt-6"
      >
        <MdOutlineCallEnd className="text-3xl" />
      </button>
    </div>
  );
}

export default GroupCallContainer;
