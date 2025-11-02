import React, { useEffect, useRef, useState } from "react";
import WaveSurfer from "wavesurfer.js";
import { FaPlay, FaPause } from "react-icons/fa";
import MessageStatus from "../common/MessageStatus";
import { useStateProvider } from "@/context/StateContext";
import { calculateTime } from "@/utils/CalculateTime";

function VoiceMessage({ message }) {
  const [{ currentChatUser, userInfo }] = useStateProvider();
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const waveformRef = useRef(null);
  const waveformInstance = useRef(null);

  useEffect(() => {
    if (!message?.message) return;

    // 🔊 สร้าง waveform
    waveformInstance.current = WaveSurfer.create({
      container: waveformRef.current,
      waveColor: "#ccc",
      progressColor: "#4a9eff",
      cursorColor: "#7ae3c3",
      barWidth: 2,
      height: 30,
      responsive: true,
      normalize: true,
      backend: "MediaElement",
    });

    waveformInstance.current.load(message.message);

    waveformInstance.current.on("ready", () => {
      const dur = waveformInstance.current.getDuration();
      if (isFinite(dur)) {
        setDuration(dur);
      }
    });

    waveformInstance.current.on("audioprocess", () => {
      const time = waveformInstance.current.getCurrentTime();
      if (isFinite(time)) {
        setCurrentTime(time);
      }
    });

    waveformInstance.current.on("finish", () => {
      setIsPlaying(false);
      setCurrentTime(0);
    });

    return () => {
      waveformInstance.current.destroy();
    };
  }, [message]);

  const togglePlay = () => {
    if (!waveformInstance.current) return;

    if (isPlaying) {
      waveformInstance.current.pause();
      setIsPlaying(false);
    } else {
      waveformInstance.current.play();
      setIsPlaying(true);
    }
  };

  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return "00:00";
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="flex" style={{ width: '100%' }}>
      <div className={`${message.senderId === userInfo?.id ? "ml-auto" : "mr-auto"} ${message.senderId === userInfo?.id ? "bg-outgoing-background text-white" : "bg-incoming-background text-white"} flex items-center gap-3 text-sm rounded-[14px] px-[14px] py-[10px] leading-[1.4] max-w-[70%]` }>
      {/* Inline avatar removed for voice messages (show only audio bubble). Parent ChatContainer still renders avatars for group messages. */}
      <div className="cursor-pointer text-xl" onClick={togglePlay}>
        {isPlaying ? <FaPause /> : <FaPlay />}
      </div>
      <div className="flex-1">
        <div ref={waveformRef} className="w-full h-8" />
        <div className="flex justify-between text-xs pt-1 text-bubble-meta mt-1">
          <span>{formatTime(currentTime)} / {formatTime(duration)}</span>
          <div className="flex items-center gap-2">
            <span>{calculateTime(message.createdAt)}</span>
            {message.senderId === userInfo?.id && (
              <MessageStatus messageStatus={message.messageStatus} />
            )}
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}

export default VoiceMessage;
