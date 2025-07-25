import { reducerCases } from "@/context/constants";
import { useStateProvider } from "@/context/StateContext";
import { firebaseAuth } from "@/utils/FirebaseConfig";
import { signOut } from "firebase/auth";
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
        dispatch({ type: reducerCases.SET_USER_INFO, userInfo: undefined });
        await signOut(firebaseAuth);
      } catch (error) {
        console.error("❌ Logout error:", error);
      } finally {
        // ✅ ตรวจว่าไม่ได้อยู่ที่ /login แล้วค่อย push
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
