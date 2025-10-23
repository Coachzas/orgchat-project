import React from "react";
import { useStateProvider } from "@/context/StateContext";
import { reducerCases } from "@/context/constants";
import Image from "next/image";

function IncomingCall() {
  const [{ incomingVoiceCall, socket }, dispatch] = useStateProvider();

  if (!incomingVoiceCall) return null;

  // ✅ เมื่อผู้ใช้กด "รับสาย"
  const acceptCall = () => {
    if (!socket?.current || !incomingVoiceCall) return;

    console.log("✅ [Receiver] รับสายจาก:", incomingVoiceCall.id);

    // 🔹 แจ้ง server ว่าผู้รับกดรับสาย
    socket.current.emit("accept-incoming-call", {
      id: incomingVoiceCall.id,     // id ของผู้โทร (caller)
      roomId: incomingVoiceCall.roomId, // ต้องใช้ร่วมกันใน ZEGO
    });

    // 🔹 ตั้งค่าผู้ใช้ใน state ว่ากำลังรับสาย
    dispatch({
      type: reducerCases.SET_VOICE_CALL,
      voiceCall: {
        ...incomingVoiceCall,
        type: "in-coming",
        callAccepted: true,
      },
    });

    // 🔹 ล้าง popup หลังรับสาย
    dispatch({
      type: reducerCases.SET_INCOMING_VOICE_CALL,
      incomingVoiceCall: undefined,
    });
  };

  // ❌ เมื่อผู้ใช้กด "ปฏิเสธสาย"
  const rejectCall = () => {
    if (!socket?.current || !incomingVoiceCall) return;

    console.log("❌ [Receiver] ปฏิเสธสายจาก:", incomingVoiceCall.id);

    // แจ้ง server ว่าปฏิเสธสาย
    socket.current.emit("reject-call", {
      from: incomingVoiceCall.id,  // id ของ caller
      roomId: incomingVoiceCall.roomId,
    });

    // ล้าง state ทั้งหมด
    dispatch({ type: reducerCases.END_CALL });
    dispatch({
      type: reducerCases.SET_INCOMING_VOICE_CALL,
      incomingVoiceCall: undefined,
    });
  };

  return (
    <div className="h-24 w-80 fixed bottom-8 right-6 z-50 rounded-md flex gap-5 items-center justify-start p-4 bg-conversation-panel-background text-white shadow-2xl border border-green-500/50 backdrop-blur-lg">
      {/* รูปโปรไฟล์ */}
      <div>
        <Image
          src={incomingVoiceCall.profilePicture || "/default-profile.png"}
          alt="avatar"
          width={70}
          height={70}
          className="rounded-full border border-gray-700"
        />
      </div>

      {/* ข้อมูลสายเข้า */}
      <div className="flex flex-col">
        <div className="font-semibold text-base">
          {incomingVoiceCall.firstName} {incomingVoiceCall.lastName}
        </div>
        <div className="text-xs text-gray-400 italic">📞 Incoming Voice Call</div>

        {/* ปุ่มตอบรับ / ปฏิเสธ */}
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

export default IncomingCall;
