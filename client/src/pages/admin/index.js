import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { io } from "socket.io-client";

export default function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState(null);
  const socket = useRef(null);

  // โหลดข้อมูลผู้ใช้ทั้งหมด
  useEffect(() => {
    axios
      .get("http://localhost:3005/api/admin/users", { withCredentials: true })
      .then((res) => {
        setUsers(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError("❌ ไม่สามารถโหลดข้อมูลได้ (อาจยังไม่ได้เข้าสู่ระบบ หรือไม่มีสิทธิ์)");
        setLoading(false);
      });
  }, []);

  // ✅ เชื่อมต่อ Socket.IO (เรียลไทม์)
  useEffect(() => {
    socket.current = io("http://localhost:3005", {
      withCredentials: true,
    });

    // ฟัง event เมื่อ role ของผู้ใช้ถูกอัปเดต
    socket.current.on("role-updated", (data) => {
      console.log("📢 role-updated:", data);
      setUsers((prev) =>
        prev.map((u) => (u.id === data.id ? { ...u, role: data.role } : u))
      );
    });

    // ถ้ามี event ประกาศ (ถ้าอยากโชว์ popup ได้ด้วย)
    socket.current.on("announcement", (msg) => {
      alert(`📢 ประกาศจากแอดมิน: ${msg.message}`);
    });

    return () => socket.current.disconnect();
  }, []);

  // ฟังก์ชันอัปเดต role
  const handleChangeRole = async (id, newRole) => {
    if (!window.confirm(`ยืนยันการเปลี่ยน Role เป็น "${newRole}" หรือไม่?`)) return;

    try {
      setUpdatingId(id);
      const res = await axios.put(
        `http://localhost:3005/api/admin/users/${id}/role`,
        { role: newRole },
        { withCredentials: true }
      );

      alert(res.data.message);
      setUsers((prev) =>
        prev.map((u) => (u.id === id ? { ...u, role: newRole } : u))
      );
    } catch (err) {
      console.error(err);
      alert("เกิดข้อผิดพลาดในการอัปเดต role");
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading) return <p style={{ padding: 20 }}>⏳ กำลังโหลดข้อมูล...</p>;

  if (error)
    return (
      <div style={{ padding: 20, color: "red" }}>
        {error}
        <br />
        <small>
          โปรดเข้าสู่ระบบที่{" "}
          <a href="http://localhost:3000/login">/login</a> ด้วยบัญชีแอดมินก่อน
        </small>
      </div>
    );

  return (
    <div style={{ padding: "20px", fontFamily: "sans-serif" }}>
      <h2>📊 Admin Dashboard (Realtime)</h2>
      <p>จัดการผู้ใช้และสิทธิ์ของแต่ละคนแบบเรียลไทม์</p>

      <table
        border="1"
        cellPadding="8"
        style={{
          width: "100%",
          marginTop: 10,
          borderCollapse: "collapse",
          background: "#f9f9f9",
        }}
      >
        <thead style={{ background: "#ddd" }}>
          <tr>
            <th>ID</th>
            <th>ชื่อ</th>
            <th>อีเมล</th>
            <th>Role</th>
            <th>เกี่ยวกับ</th>
            <th>จัดการ</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id}>
              <td>{user.id}</td>
              <td>
                {user.firstName} {user.lastName}
              </td>
              <td>{user.email}</td>
              <td>{user.role}</td>
              <td>{user.about}</td>
              <td>
                <select
                  value={user.role}
                  disabled={updatingId === user.id}
                  onChange={(e) => handleChangeRole(user.id, e.target.value)}
                  style={{
                    padding: "6px",
                    borderRadius: "6px",
                    border: "1px solid #aaa",
                    background: "#fff",
                    cursor: "pointer",
                  }}
                >
                  <option value="employee">employee</option>
                  <option value="manager">manager</option>
                  <option value="admin">admin</option>
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
