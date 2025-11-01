// client/src/components/Chat/GroupFiles.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";

export default function GroupFiles({ groupId, onClose }) {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [note, setNote] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  // ✅ โหลดไฟล์ทั้งหมดในกลุ่ม
  const fetchFiles = async () => {
    try {
      const res = await axios.get(
        `http://localhost:3005/api/groups/${groupId}/files`,
        { withCredentials: true }
      );
      setFiles(res.data);
    } catch (err) {
      console.error("❌ โหลดไฟล์กลุ่มล้มเหลว:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (groupId) fetchFiles();
  }, [groupId]);

  // 📤 ฟังก์ชันอัปโหลดไฟล์ใหม่
  const handleUpload = async (e) => {
    e.preventDefault();
    if (!selectedFile) return alert("กรุณาเลือกไฟล์ก่อน");
    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("note", note);

    try {
      setUploading(true);
      const res = await axios.post(
        `http://localhost:3005/api/groups/${groupId}/files`,
        formData,
        {
          withCredentials: true,
          headers: { "Content-Type": "multipart/form-data" },
        }
      );
      alert(res.data.message);
      setNote("");
      setSelectedFile(null);
      fetchFiles(); // โหลดใหม่หลังอัปโหลด
    } catch (err) {
      console.error("❌ อัปโหลดล้มเหลว:", err);
      alert("เกิดข้อผิดพลาดในการอัปโหลด");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50">
      <div className="w-[700px] max-h-[90vh] overflow-y-auto bg-panel-header-background text-primary-strong rounded-2xl shadow-xl p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-primary-strong flex items-center gap-2">
            📂 ไฟล์ของกลุ่ม
          </h2>
          <button
            onClick={onClose}
            className="bg-red-600 hover:bg-red-700 text-white rounded-lg px-3 py-1 transition"
          >
            ✖ ปิด
          </button>
        </div>

        {/* Upload Form */}
        <form
          onSubmit={handleUpload}
          className="flex flex-col gap-3 mb-4 bg-conversation-panel-background p-4 rounded-xl"
        >
          <input
            type="file"
            onChange={(e) => setSelectedFile(e.target.files[0])}
            className="text-sm text-primary-strong"
          />
          <input
            type="text"
            placeholder="เพิ่มข้อความประกอบ (เช่น เอกสารประชุม)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full bg-input-background text-primary-strong px-3 py-2 rounded-lg outline-none"
          />
          <button
            type="submit"
            disabled={uploading}
            className={`${
              uploading
                ? "bg-gray-600 cursor-not-allowed"
                : "bg-blue-500 hover:bg-blue-600"
            } text-white rounded-lg px-4 py-2 transition`}
          >
            {uploading ? "⏳ กำลังอัปโหลด..." : "📤 อัปโหลดไฟล์"}
          </button>
        </form>

        {/* Divider */}
        <hr className="border-conversation-border my-4" />

        {/* Files List */}
        {loading ? (
          <p className="text-secondary">⏳ กำลังโหลดไฟล์...</p>
        ) : files.length === 0 ? (
          <p className="text-secondary text-center py-4">
            ยังไม่มีไฟล์ในกลุ่มนี้
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {files.map((file) => (
              <div
                key={file.id}
                className="bg-incoming-background border border-conversation-border rounded-xl p-4 hover:bg-dropdown-background-hover transition"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold text-primary-strong">
                      {file.fileName}
                    </p>
                    <p className="text-sm text-secondary mt-1">
                      📎 {file.fileType || "ไม่ทราบประเภท"} <br />
                      🧑‍💼 โดย {file.uploader?.firstName}{" "}
                      {file.uploader?.lastName}
                    </p>
                    {file.note && (
                      <p className="text-sm text-primary-strong mt-1">
                        📝 {file.note}
                      </p>
                    )}
                  </div>
                  <a
                    href={`http://localhost:3005${file.fileUrl}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:underline font-medium"
                  >
                    🔗 เปิดไฟล์
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
