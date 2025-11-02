import React, { useEffect, useState } from "react";
import axios from "axios";
import { GET_GROUP_NOTES_ROUTE, ADD_GROUP_NOTE_ROUTE } from "@/utils/ApiRoutes";
import { useStateProvider } from "@/context/StateContext";

export default function AdminNote({ groupId, onClose }) {
  const [{ userInfo }] = useStateProvider();
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newNote, setNewNote] = useState("");
  const [sending, setSending] = useState(false);

  const fetchNotes = async () => {
    setLoading(true);
    try {
      const res = await axios.get(GET_GROUP_NOTES_ROUTE(groupId), { withCredentials: true });
      setNotes(res.data || []);
    } catch (err) {
      console.error("❌ โหลดโน้ตล้มเหลว:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (groupId) fetchNotes();
  }, [groupId]);

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
      setNotes((prev) => [res.data.note, ...prev]);
    } catch (err) {
      console.error("❌ ส่งโน้ตล้มเหลว:", err.response?.data || err);
      alert(err.response?.data?.error || "Failed to post note");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
      <div className="w-[700px] max-h-[80vh] overflow-y-auto bg-panel-header-background text-white rounded-2xl shadow-xl p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">📝 Admin Notes</h2>
          <button onClick={onClose} className="px-3 py-1 rounded bg-gray-600">ปิด</button>
        </div>

        <div className="mb-4">
          <textarea
            placeholder="เขียนโน้ตสำหรับกลุ่มนี้ (admin เท่านั้น)"
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            className="w-full p-3 rounded bg-input-background text-white resize-none h-28"
          />
          <div className="flex justify-end mt-3">
            <button onClick={handleSend} disabled={sending || !newNote.trim()} className="px-4 py-2 rounded bg-icon-green">
              {sending ? "กำลังส่ง..." : "โพสต์โน้ต"}
            </button>
          </div>
        </div>

        <hr className="border-conversation-border mb-4" />

        <div>
          {loading ? (
            <p>⏳ กำลังโหลดโน้ต...</p>
          ) : notes.length === 0 ? (
            <p className="text-secondary">ยังไม่มีโน้ต</p>
          ) : (
            notes.map((n) => (
              <div key={n.id} className="bg-incoming-background p-3 rounded-lg mb-3">
                <div className="flex items-center gap-3 mb-2">
                  <img src={n.sender?.profilePicture || "/default-avatar.png"} alt="avatar" className="w-8 h-8 rounded-full" />
                  <div className="text-sm">
                    <div className="font-medium">{`${n.sender?.firstName || ""} ${n.sender?.lastName || ""}`.trim()}</div>
                    <div className="text-bubble-meta text-[11px]">{new Date(n.createdAt).toLocaleString()}</div>
                  </div>
                </div>
                <div className="whitespace-pre-wrap break-words">{n.message}</div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
