import React from "react";
import { useStateProvider } from "@/context/StateContext";
import { reducerCases } from "@/context/constants";
import Image from "next/image";

function IncomingGroupCall() {
  const [{ incomingGroupCall, socket, userInfo }, dispatch] = useStateProvider();

  if (!incomingGroupCall) return null;

  const acceptGroupCall = () => {
    if (socket?.current?.emit) {
      socket.current.emit("join-group-call", {
        groupId: incomingGroupCall.groupId,
        user: userInfo,
      });
    }

    dispatch({
      type: reducerCases.SET_GROUP_CALL,
      groupCall: {
        ...incomingGroupCall,
        type: "in-coming",
        callAccepted: true,
      },
    });

    dispatch({ type: reducerCases.SET_INCOMING_GROUP_CALL, incomingGroupCall: null });
  };

  const rejectGroupCall = () => {
    dispatch({ type: reducerCases.END_GROUP_CALL });
    dispatch({ type: reducerCases.SET_INCOMING_GROUP_CALL, incomingGroupCall: null });
  };

  return (
    <div className="h-24 w-96 fixed bottom-8 right-6 z-50 rounded-md flex gap-4 items-center justify-start p-4 bg-conversation-panel-background text-white shadow-2xl border border-purple-500/50 backdrop-blur-lg">
      <Image
        src={incomingGroupCall.from.profilePicture || "/default-avatar.png"}
        alt="avatar"
        width={70}
        height={70}
        className="rounded-full border border-gray-700"
      />
      <div className="flex flex-col">
        <div className="font-semibold text-base">
          📞 Group Call: {incomingGroupCall.groupName || "กลุ่มไม่ทราบชื่อ"}
        </div>
        <div className="text-xs text-gray-400 italic">
          from {incomingGroupCall.from.firstName} {incomingGroupCall.from.lastName}
        </div>
        <div className="flex gap-2 mt-3">
          <button
            className="bg-red-500 hover:bg-red-600 p-1 px-3 text-sm rounded-full transition"
            onClick={rejectGroupCall}
          >
            Reject
          </button>
          <button
            className="bg-green-500 hover:bg-green-600 p-1 px-3 text-sm rounded-full transition"
            onClick={acceptGroupCall}
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}

export default IncomingGroupCall;
