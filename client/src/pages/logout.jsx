import { reducerCases } from "@/context/constants";
import { useStateProvider } from "@/context/StateContext";
import { useRouter } from "next/router";
import { useEffect } from "react";
import axios from "axios";
import { LOGOUT_ROUTE } from "@/utils/ApiRoutes";

function LogoutPage() {
  const [{ socket, userInfo }, dispatch] = useStateProvider();
  const router = useRouter();

  useEffect(() => {
    async function doLogout() {
      try {
        if (socket?.current && userInfo?.id) {
          socket.current.emit("signout", userInfo.id);
        }

  //  ลบ session ใน backend (call central logout route)
  await axios.post(LOGOUT_ROUTE, {}, { withCredentials: true });

        //  เคลียร์ context frontend
        dispatch({ type: reducerCases.SET_USER_INFO, userInfo: null });

        //  เคลียร์ localStorage (เผื่อเคยใช้เก็บ token)
        localStorage.removeItem("authToken");
        localStorage.removeItem("userInfo");
      } catch (error) {
        console.error("❌ Logout error:", error);
      } finally {
        if (router.pathname !== "/login") {
          router.push("/login");
        }
      }
    }

    doLogout();
  }, [dispatch, router, socket, userInfo]);

  return (
    <div className="bg-conversation-panel-background h-screen w-screen flex items-center justify-center text-white">
      กำลังออกจากระบบ...
    </div>
  );
}

export default LogoutPage;
