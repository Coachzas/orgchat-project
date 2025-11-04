import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  GET_GROUP_NOTES_ROUTE,
  ADD_GROUP_NOTE_ROUTE,
  DELETE_GROUP_NOTE_ROUTE,
} from "@/utils/ApiRoutes";
import { useStateProvider } from "@/context/StateContext";
import ReactDOM from "react-dom";

export default function AdminNote({ groupId, onClose }) {
  const [{ userInfo, socket }] = useStateProvider();
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newNote, setNewNote] = useState("");
  const [sending, setSending] = useState(false);

  //  โหลดโน้ตทั้งหมดของกลุ่ม
  const fetchNotes = async () => {
    setLoading(true);
    try {
      const res = await axios.get(GET_GROUP_NOTES_ROUTE(groupId), {
        withCredentials: true,
      });
      setNotes(res.data || []);
    } catch (err) {
      console.error("❌ โหลดโน้ตล้มเหลว:", err);
    } finally {
      setLoading(false);
    }
  };

  //  เรียกเมื่อเปิดกลุ่ม
  useEffect(() => {
    if (groupId) fetchNotes();
  }, [groupId]);

  //  เรียลไทม์: เมื่อมีโน้ตใหม่หรือโดนลบ
  useEffect(() => {
    if (!socket?.current) return;

    // เมื่อมีการเพิ่ม note ใหม่
    socket.current.on("group-note-receive", ({ note }) => {
      setNotes((prev) => [note, ...prev]);
    });

    // เมื่อมีการลบ note
    socket.current.on("group-note-deleted", ({ noteId }) => {
      console.log("🗑️ [Realtime] ลบโน้ต:", noteId);
      setNotes((prev) => prev.filter((n) => n.id !== noteId));
    });

    return () => {
      socket.current.off("group-note-receive");
      socket.current.off("group-note-deleted");
    };
  }, [socket]);

  //  โพสต์โน้ตใหม่
  const handleSend = async () => {
    if (!newNote.trim()) return;
    setSending(true);
    try {
      const res = await axios.post(
        ADD_GROUP_NOTE_ROUTE(groupId),
        { from: userInfo.id, message: newNote },
        { withCredentials: true }
      );
      setNewNote("");
      // ไม่ต้อง setNotes เพราะ socket จะอัปเดตอัตโนมัติ
    } catch (err) {
      console.error("❌ ส่งโน้ตล้มเหลว:", err.response?.data || err);
      alert(err.response?.data?.error || "Failed to post note");
    } finally {
      setSending(false);
    }
  };

  //  ลบโน้ต
  const handleDelete = async (noteId) => {
    if (!window.confirm("คุณแน่ใจหรือไม่ว่าต้องการลบโน้ตนี้?")) return;
    try {
      await axios.delete(DELETE_GROUP_NOTE_ROUTE(groupId, noteId), {
        withCredentials: true,
      });
      // socket จะจัดการอัปเดตให้ทุกคน
    } catch (err) {
      console.error("❌ ลบโน้ตล้มเหลว:", err);
      alert("ไม่สามารถลบโน้ตได้");
    }
  };

  //  Portal Modal
  return ReactDOM.createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="w-[680px] max-h-[80vh] overflow-y-auto bg-panel-header-background text-white rounded-2xl shadow-2xl p-6 animate-slideUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">📝 Admin Notes</h2>
          <button
            onClick={onClose}
            className="px-3 py-1 rounded bg-gray-600 hover:bg-gray-500 transition"
          >
            ปิด
          </button>
        </div>

        {/* Textarea */}
        {userInfo?.role === "admin" && (
          <div className="mb-4">
            <textarea
              placeholder="เขียนโน้ตสำหรับกลุ่มนี้ (admin เท่านั้น)"
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              className="w-full p-3 rounded bg-input-background text-white resize-none h-24"
            />
            <div className="flex justify-end mt-3">
              <button
                onClick={handleSend}
                disabled={sending || !newNote.trim()}
                className="px-4 py-2 rounded bg-icon-green hover:bg-green-600 transition"
              >
                {sending ? "กำลังส่ง..." : "โพสต์โน้ต"}
              </button>
            </div>
          </div>
        )}

        <hr className="border-conversation-border mb-4" />

        {/* Notes List */}
        <div>
          {loading ? (
            <p>⏳ กำลังโหลดโน้ต...</p>
          ) : notes.length === 0 ? (
            <p className="text-secondary">ยังไม่มีโน้ต</p>
          ) : (
            notes.map((n) => (
              <div
                key={n.id}
                className="bg-incoming-background p-3 rounded-lg mb-3 border border-conversation-border hover:bg-dropdown-background-hover transition"
              >
                <div className="flex justify-between items-center mb-1">
                  <div className="text-sm font-medium text-white">
                    🧑‍💼 {`${n.sender?.firstName || ""} ${n.sender?.lastName || ""}`.trim()}
                  </div>
                  <div className="text-bubble-meta text-[11px]">
                    {new Date(n.createdAt).toLocaleString()}
                  </div>
                </div>

                <div className="whitespace-pre-wrap break-words text-[14px] text-gray-200">
                  {n.message}
                </div>

                {userInfo?.role === "admin" && (
                  <div className="flex justify-end mt-2">
                    <button
                      onClick={() => handleDelete(n.id)}
                      className="text-red-400 hover:text-red-500 text-sm"
                    >
                      🗑️ ลบ
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
