import React, { useEffect, useRef, useState } from "react";
import { useStateProvider } from "@/context/StateContext";
import { FaTrash, FaStop, FaPlay, FaPause } from "react-icons/fa";
import { MdSend } from "react-icons/md";
import WaveSurfer from "wavesurfer.js";
import axios from "axios";
import { reducerCases } from "@/context/constants";
import { ADD_AUDIO_MESSAGES_ROUTE } from "@/utils/ApiRoutes";

function CaptureAudio({ onChange }) {
  const [{ userInfo, currentChatUser, socket }, dispatch] = useStateProvider();

  const [isRecording, setRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [recordedAudio, setRecordedAudio] = useState(null);
  const [renderedAudio, setRenderedAudio] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const waveFormRef = useRef(null);
  const waveformInstanceRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const audioRef = useRef(null);

  useEffect(() => {
    if (!isRecording) return;
    const interval = setInterval(() => {
      setRecordingDuration((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isRecording]);

  useEffect(() => {
    if (recordedAudio && waveFormRef.current) {
      if (!waveformInstanceRef.current) {
        waveformInstanceRef.current = WaveSurfer.create({
          container: waveFormRef.current,
          waveColor: "#ccc",
          progressColor: "#4a9eff",
          cursorColor: "#7ae3c3",
          barWidth: 2,
          height: 30,
          responsive: true,
        });
        waveformInstanceRef.current.on("finish", () => setIsPlaying(false));
      }
      waveformInstanceRef.current.load(recordedAudio.src);
    }
    return () => {
      waveformInstanceRef.current?.destroy();
      waveformInstanceRef.current = null;
    };
  }, [recordedAudio]);

  useEffect(() => {
    handleStartRecording();
  }, []);

  const handleStartRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: "audio/webm;codecs=opus",
      });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => chunksRef.current.push(e.data);
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, {
          type: "audio/webm;codecs=opus",
        });
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        audioRef.current = audio;
        setRecordedAudio(audio);
        setRenderedAudio(blob);
      };

      mediaRecorder.start();
      setRecording(true);
      setRecordingDuration(0);
    } catch (err) {
      console.error("🎤 Microphone access error:", err);
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setRecording(false);
    }
  };

  const handleDelete = () => {
    setRecording(false);
    setRecordingDuration(0);
    setRecordedAudio(null);
    setRenderedAudio(null);
    setIsPlaying(false);
    waveformInstanceRef.current?.stop();
    waveformInstanceRef.current?.empty();
    onChange(false);
  };

  const handlePlay = () => {
    if (audioRef.current) {
      audioRef.current.load(); // สำคัญสำหรับบาง browser
      audioRef.current.play();
      waveformInstanceRef.current?.play();
      setIsPlaying(true);
    }
  };

  const handlePause = () => {
    audioRef.current?.pause();
    waveformInstanceRef.current?.pause();
    setIsPlaying(false);
  };

  const handleSend = async () => {
    if (!renderedAudio || !userInfo || !currentChatUser) return;

    const formData = new FormData();
    formData.append("audio", renderedAudio, "recording.webm");
    formData.append("from", userInfo.id);
    formData.append("to", currentChatUser.id);

    try {
      const response = await axios.post(ADD_AUDIO_MESSAGES_ROUTE, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (response.status === 201) {
        const messageRaw = response.data.message;
        const audioUrl = messageRaw.startsWith("http")
          ? messageRaw
          : `http://localhost:3005${messageRaw}`;

        dispatch({
          type: reducerCases.ADD_MESSAGE,
          newMessage: {
            id: Date.now(),
            senderId: userInfo.id,
            receiverId: currentChatUser.id,
            message: audioUrl,
            type: "audio",
            createdAt: new Date().toISOString(),
            messageStatus: "sent",
          },
        });

        socket?.emit("send-msg", {
          to: currentChatUser.id,
          from: userInfo.id,
          message: audioUrl,
          type: "audio",
        });

        handleDelete();
      }
    } catch (err) {
      console.error("❌ Failed to send audio:", err);
    }
  };

  const formatTime = (time) => {
    if (isNaN(time)) return "00:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`;
  };

  return (
    <div className="flex items-center bg-[#2a2f32] rounded-md px-3 py-2 w-full gap-2">
      <FaTrash className="text-white text-lg cursor-pointer" onClick={handleDelete} title="Discard" />
      <div className="flex-1 overflow-hidden">
        {recordedAudio && <div ref={waveFormRef} className="h-8 w-full" />}
      </div>
      <div className="text-white text-sm w-12 text-right">
        {formatTime(recordingDuration)}
      </div>
      {isRecording ? (
        <FaStop onClick={handleStopRecording} className="text-red-500 text-xl cursor-pointer" title="Stop Recording" />
      ) : recordedAudio && isPlaying ? (
        <FaPause onClick={handlePause} className="text-white text-xl cursor-pointer" title="Pause" />
      ) : recordedAudio ? (
        <FaPlay onClick={handlePlay} className="text-white text-xl cursor-pointer" title="Play" />
      ) : null}
      {!isRecording && renderedAudio && (
        <MdSend onClick={handleSend} className="text-white text-xl cursor-pointer" title="Send" />
      )}
    </div>
  );
}

export default CaptureAudio;
