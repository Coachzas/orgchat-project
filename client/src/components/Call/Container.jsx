import { useStateProvider } from "@/context/StateContext";
import { reducerCases } from "@/context/constants";
import { GET_CALL_TOKEN } from "@/utils/ApiRoutes";
import axios from "axios";
import Image from "next/image";
import React, { useEffect, useState } from "react";
import { MdOutlineCallEnd } from "react-icons/md";
import { ZegoExpressEngine } from "zego-express-engine-webrtc";

function Container({ data }) {
  const [{ socket, userInfo }, dispatch] = useStateProvider();
  const [callAccepted, setCallAccepted] = useState(false);
  const [token, setToken] = useState(undefined);
  const [zgVar, setZgVar] = useState(undefined);
  const [localStream, setLocalStream] = useState(undefined);
  const [publishStream, setPublishStream] = useState(undefined);

  useEffect(() => {
  if (data.type === "out-going" && socket?.current) {
    const handler = () => setCallAccepted(true);
    socket.current.off("accept-call", handler);
    socket.current.on("accept-call", handler);

    return () => {
      socket.current.off("accept-call", handler);
    };
  } else {
    const timer = setTimeout(() => {
      setCallAccepted(true);
    }, 1000);
    return () => clearTimeout(timer);
  }
}, [data, socket]);


  useEffect(() => {
    const getToken = async () => {
      try {
        if (!userInfo?.id) return;
        const { data: { token: returnedToken } } = await axios.get(GET_CALL_TOKEN(userInfo.id));
        setToken(returnedToken);
      } catch (err) {
        console.log(err);
      }
    };
    if (callAccepted) getToken();
  }, [callAccepted, userInfo]);

  useEffect(() => {
    let zg;
    const startCall = async () => {
      const { ZegoExpressEngine } = await import("zego-express-engine-webrtc");
      zg = new ZegoExpressEngine(
        parseInt(process.env.NEXT_PUBLIC_ZEGO_APP_ID),
        process.env.NEXT_PUBLIC_ZEGO_SERVER_ID
      );
      setZgVar(zg);

      zg.on("roomStreamUpdate", async (roomID, updateType, streamList, extendedData) => {
        if (updateType === "ADD") {
          const rmVideo = document.getElementById("remote-video");
          const vd = document.createElement(
            data.callType === "video" ? "video" : "audio"
          );
          vd.id = streamList[0].streamID;
          vd.autoplay = true;
          vd.playsInline = true;
          vd.muted = false;
          if (rmVideo) {
            rmVideo.appendChild(vd);
          }
          zg.startPlayingStream(streamList[0].streamID, {
            audio: true,
            video: true,
          }).then((stream) => (vd.srcObject = stream));
        } else if (updateType === "DELETE" && zg && localStream && publishStream) {
          zg.destroyStream(localStream);
          zg.stopPublishingStream(publishStream);
          zg.logoutRoom(data.roomID.toString());
          document.getElementById("remote-video").innerHTML = "";
          document.getElementById("local-audio").innerHTML = "";
          dispatch({ type: reducerCases.END_CALL });
        }
      });

      if (!data.roomID) {
  console.error("❌ roomID is missing in data:", data);
  return;
}

await zg.loginRoom(
  data.roomID.toString(),
  token,
  {
    userID: userInfo.id.toString(),
    userName: userInfo.name
  },
  { userUpdate: true }
);


      const createdStream = await zg.createStream({
        camera: {
          audio: true,
          video: data.callType === "video"
        }
      });

      const localVideoContainer = document.getElementById("local-audio");
      const videoElement = document.createElement(
        data.callType === "video" ? "video" : "audio"
      );
      videoElement.id = "video-local-zego";
      videoElement.className = "h-28 w-32";
      videoElement.autoplay = true;
      videoElement.muted = false;
      videoElement.playsInline = true;

      localVideoContainer.appendChild(videoElement);
      videoElement.srcObject = createdStream;

      const streamID = "123" + Date.now();
      setPublishStream(streamID);
      setLocalStream(createdStream);
      zg.startPublishingStream(streamID, createdStream);
    };

    if (token) {
      startCall();
    }

    return () => {
      if (zg) {
        zg.destroyEngine();
      }
    };
  }, [token]);

  const endCall = () => {
  const id = data.id;
  if (socket?.current) {
    if (data.callType === "voice") {
      socket.current.emit("reject-voice-call", { from: id });
    } else {
      socket.current.emit("reject-video-call", { from: id });
    }
    if (zgVar && localStream && publishStream) {
      zgVar.destroyStream(localStream);
      zgVar.stopPublishingStream(publishStream);
      zgVar.logoutRoom(data.roomID?.toString() || "");
    }
  }

  const remoteVideoContainer = document.getElementById("remote-video");
  if (remoteVideoContainer) {
    remoteVideoContainer.innerHTML = "";
  }

  const localAudioContainer = document.getElementById("local-audio");
  if (localAudioContainer) {
    localAudioContainer.innerHTML = "";
  }

  dispatch({ type: reducerCases.END_CALL });
};


  return (
    <div className="border-conversation-border border-l w-full bg-conversation-panel-background flex flex-col h-[100vh] overflow-hidden items-center justify-center text-white">
      <div className="flex flex-col gap-3 items-center">
        <span className="text-5xl">{data.name}</span>
        <span className="text-lg">
          {callAccepted && data.callType !== "video"
            ? "On going call"
            : "Calling"}
        </span>
      </div>
      {(!callAccepted || data.callType === "audio") && (
        <div className="my-24">
          <Image
            src={data.profilePicture || "/default-profile.png"}
            alt="avatar"
            height={300}
            width={300}
            className="rounded-full"
          />
        </div>
      )}
      <div className="my-5 relative" id="remote-video">
        <div className="absolute bottom-5 right-5" id="local-audio"></div>
      </div>
      <div className="h-16 w-16 bg-red-600 flex items-center justify-center rounded-full">
        <MdOutlineCallEnd
          className="text-3xl cursor-pointer"
          onClick={endCall}
        />
      </div>
    </div>
  );
}

export default Container;
