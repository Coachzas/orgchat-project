import Input from "@/components/common/Input";
import Avatar from "@/components/common/Avatar"; 
import { useStateProvider } from "@/context/StateContext";
import Image from "next/image";
import React, { useEffect, useState } from "react";
import axios from "axios";
import { ONBOARD_USER_ROUTE } from "@/utils/ApiRoutes";
import { useRouter } from "next/router";


function Onboarding() {
  const router = useRouter()
  const [{ userInfo, newUser }, dispatch] = useStateProvider();
  const [name, setName] = useState(userInfo?.name || "");
  const [about, setAbout] = useState("");
  const [image, setImage] = useState("/default_avatar.png");
  useEffect(() => {
    if(!newUser && !userInfo?.email) router.push("/login");
    else if(!newUser && userInfo?.email) router.push("/");
  },[newUser,userInfo,router]);

  const onboardUserHandler = async () => {
    if(validateDetails()) {
      const email = userInfo.email;
      try {
        const {data} = await axios.post(ONBOARD_USER_ROUTE, {
          email,
          name,
          about,
          image,
        });
        if(data.status) {
          dispatch({type: reducerCases.SET_NEW_USER, newUser: false })
                    dispatch({
                      type: reducerCases.SET_USER_INFO,
                      userInfo: {
                        id:data.user.id,
                        name,
                        email,
                        profileImage : image,
                        status: about,
                      },
                    });
                router.push("/")
        }
      } catch (error) {
        console.log(error)
      }
    }
  };
  const validateDetails = () => {
    if(name.length<3) {
      return false;
    }
    return true;
  }
  return (
    <div className="bg-panel-header-background h-screen w-screen text-white flex flex-col items-center justify-center">
      <div className="flex items-center justify-center gap-2">
        <Image src="/orgchat.png" alt="OrgChat" height={300} width={300} />
        <span className="text-7xl">OrgChat</span>
      </div>
      <h2 className="text-2xl">Create your profile</h2>
  
      {/* ใช้ flex เพื่อให้ Input และ Avatar อยู่ในแถวเดียวกัน */}
      <div className="flex gap-6 mt-6 items-center">
        {/* ส่วนฟอร์มกรอกข้อมูล */}
        <div className="flex flex-col items-start justify-center gap-6">
          <Input name="Display Name" state={name} setState={setName} label />
          <Input name="About" state={about} setState={setAbout} label />
          <div className="flex items-center justify-center">
            <button  
              className="flex items-center gap-7 bg-search-input-container-background p-5 rounded-lg"
              onClick={onboardUserHandler}
            >
              Create Profile
            </button>
          </div>
        </div> 
  
        {/* Avatar จะอยู่ขวาของช่อง Input */}
        <Avatar type="xl" image={image} setImage={setImage} />
      </div>
    </div>
  );
  
}

export default Onboarding;