import React from "react";
import { useStateProvider } from "@/context/StateContext";
import Image from "next/image";
import { reducerCases } from "@/context/constants";

function IncomingVideoCall() {
  const [{ incomingVideoCall, socket }, dispatch] = useStateProvider();

  if (!incomingVideoCall) return null;

  // ✅ รับสาย
  const acceptCall = () => {
    if (!socket?.current || !incomingVideoCall) return;
    console.log("✅ [Receiver] รับสายวิดีโอจาก:", incomingVideoCall.id);

    // แจ้ง server ว่าผู้รับกดรับสาย
    socket.current.emit("accept-incoming-call", {
      id: incomingVideoCall.id,      // id ของ caller
      roomId: incomingVideoCall.roomId,
    });

    // ตั้งค่าสถานะวิดีโอคอลใน state
    dispatch({
      type: reducerCases.SET_VIDEO_CALL,
      videoCall: {
        ...incomingVideoCall,
        type: "in-coming",
        callAccepted: true,
      },
    });

    // ปิด popup
    dispatch({
      type: reducerCases.SET_INCOMING_VIDEO_CALL,
      incomingVideoCall: undefined,
    });
  };

  // ❌ ปฏิเสธสาย
  const rejectCall = () => {
    if (!socket?.current || !incomingVideoCall) return;
    console.log("❌ [Receiver] ปฏิเสธสายวิดีโอจาก:", incomingVideoCall.id);

    socket.current.emit("reject-call", {
      from: incomingVideoCall.id,
      roomId: incomingVideoCall.roomId,
    });

    dispatch({ type: reducerCases.END_CALL });
    dispatch({
      type: reducerCases.SET_INCOMING_VIDEO_CALL,
      incomingVideoCall: undefined,
    });
  };

  return (
    <div className="h-24 w-80 fixed bottom-8 right-6 z-50 rounded-md flex gap-5 items-center justify-start p-4 bg-conversation-panel-background text-white shadow-2xl border border-blue-500/50 backdrop-blur-lg">
      <Image
        src={incomingVideoCall.profilePicture || "/default-profile.png"}
        alt="avatar"
        width={70}
        height={70}
        className="rounded-full border border-gray-700"
      />

      <div className="flex flex-col">
        <div className="font-semibold text-base">
          {incomingVideoCall.firstName} {incomingVideoCall.lastName}
        </div>
        <div className="text-xs text-gray-400 italic">🎥 Incoming Video Call</div>
        <div className="flex gap-2 mt-3">
          <button
            className="bg-red-500 hover:bg-red-600 p-1 px-3 text-sm rounded-full transition"
            onClick={rejectCall}
          >
            Reject
          </button>
          <button
            className="bg-green-500 hover:bg-green-600 p-1 px-3 text-sm rounded-full transition"
            onClick={acceptCall}
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}

export default IncomingVideoCall;
