import { reducerCases } from "@/context/constants";
import { useStateProvider } from "@/context/StateContext";
import { useRouter } from "next/router";
import { useEffect } from "react";

function LogoutPage() {
  const [{ socket, userInfo }, dispatch] = useStateProvider();
  const router = useRouter();

  useEffect(() => {
    async function doLogout() {
      try {
        if (socket?.current && userInfo?.id) {
          socket.current.emit("signout", userInfo.id);
        }
        // เคลียร์ข้อมูลผู้ใช้ออกจาก context
        dispatch({ type: reducerCases.SET_USER_INFO, userInfo: null });

        // หากมี token หรือข้อมูล session ใน localStorage ก็ลบทิ้งได้ด้วย
        localStorage.removeItem("authToken"); // ถ้ามีใช้
        localStorage.removeItem("userInfo");  // ถ้าเคยเก็บไว้
      } catch (error) {
        console.error("❌ Logout error:", error);
      } finally {
        // ย้ายไปหน้า login
        if (router.pathname !== "/login") {
          router.push("/login");
        }
      }
    }

    doLogout();
  }, [dispatch, router, socket, userInfo]);

  return (
    <div className="bg-conversation-panel-background">
      Signing out...
    </div>
  );
}

export default LogoutPage;
