import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/router";
import { useStateProvider } from "@/context/StateContext";
import { reducerCases } from "@/context/constants";
import axios from "axios";
import { io } from "socket.io-client";
import { ADMIN_CREATE_USER_ROUTE } from "@/utils/ApiRoutes";

export default function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState(null);
  const socket = useRef(null);
  const router = useRouter();
  const [, dispatch] = useStateProvider();

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
        <div style={{ marginTop: 12 }}>
          <button
            onClick={() => {
              // เคลียร์การเลือกแชท/กลุ่ม แล้วกลับไปหน้าแชทหลัก
              dispatch({ type: reducerCases.SET_EXIT_CHAT });
              router.push("/");
            }}
            style={{ color: "#fff", background: "#1f8a70", padding: "8px 12px", borderRadius: 6, border: "none", cursor: "pointer" }}
          >
            ◀ กลับไปหน้าแชท
          </button>
        </div>
      </div>
    );

  return (
    <div style={{ padding: "20px", fontFamily: "sans-serif" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h2>📊 Admin Dashboard (Realtime)</h2>
          <p>จัดการผู้ใช้และสิทธิ์ของแต่ละคนแบบเรียลไทม์</p>
        </div>
        <div>
          <button
            onClick={() => {
              dispatch({ type: reducerCases.SET_EXIT_CHAT });
              router.push("/");
            }}
            style={{ background: "#1f8a70", color: "#fff", padding: "8px 12px", border: "none", borderRadius: 6, cursor: "pointer" }}
          >
            ◀ กลับไปหน้าแชท
          </button>
        </div>
      </div>

      {/* --- ฟอร์มสร้างผู้ใช้โดย Admin --- */}
      <div style={{ marginBottom: 16, padding: 12, background: "#fff", borderRadius: 8 }}>
        <h3>➕ สร้างผู้ใช้ใหม่ (Admin)</h3>
        <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
          <input placeholder="อีเมล" id="admin_new_email" style={{ padding: 8 }} />
          <input placeholder="รหัสผ่าน" id="admin_new_password" type="password" style={{ padding: 8 }} />
          <input placeholder="ชื่อ" id="admin_new_first" style={{ padding: 8 }} />
          <input placeholder="นามสกุล" id="admin_new_last" style={{ padding: 8 }} />
          <select id="admin_new_role" style={{ padding: 8 }}>
            <option value="employee">employee</option>
            <option value="manager">manager</option>
            <option value="admin">admin</option>
          </select>
          <button
            onClick={async () => {
              const email = document.getElementById("admin_new_email").value.trim().toLowerCase();
              const password = document.getElementById("admin_new_password").value;
              const firstName = document.getElementById("admin_new_first").value.trim();
              const lastName = document.getElementById("admin_new_last").value.trim();
              const role = document.getElementById("admin_new_role").value;
              if (!email || !password || !firstName || !lastName) return alert("กรอกข้อมูลไม่ครบ");

              try {
                const res = await axios.post(ADMIN_CREATE_USER_ROUTE, { email, password, firstName, lastName, role }, { withCredentials: true });
                alert(res.data.message || "สร้างผู้ใช้สำเร็จ");
                setUsers((prev) => [res.data.user, ...prev]);
              } catch (err) {
                console.error(err);
                alert(err.response?.data?.error || "สร้างผู้ใช้ไม่สำเร็จ");
              }
            }}
            style={{ background: "#1f8a70", color: "#fff", border: "none", padding: "8px 10px", borderRadius: 6 }}
          >
            สร้าง
          </button>
        </div>
      </div>
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
