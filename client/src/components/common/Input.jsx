import React, { useId, useState } from "react";

function Input({
  name,
  state,
  setState,
  label = false,
  type = "text",
  autoComplete, // ให้ override ได้ถ้าจำเป็น
  ...rest
}) {
  const inputId = useId();
  const isPassword = type === "password";
  const [show, setShow] = useState(false);

  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={inputId} className="text-teal-light text-lg px-1">
          {name}
        </label>
      )}

      <div className="relative">
        <input
          id={inputId}
          type={isPassword ? (show ? "text" : "password") : type}
          name={name}
          value={state}
          onChange={(e) => setState(e.target.value)}
          className="bg-input-background text-start focus:outline-none text-white h-10 rounded-lg px-5 py-4 w-full pr-12"
          // ป้องกัน tooltip/การเดาคำ/ตัวพิมพ์ใหญ่
          spellCheck={false}
          autoCorrect="off"
          autoCapitalize="off"
          // ชี้นำ browser/manager ให้ถูกต้อง
          autoComplete={
            autoComplete ??
            (isPassword ? "current-password" : type === "email" ? "email" : "on")
          }
          // กัน lib บางตัวใช้ title ไปแสดงค่า
          title={undefined}
          {...rest}
        />

        {isPassword && (
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-300 hover:text-white"
            aria-label={show ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
          >
            {show ? "ซ่อน" : "ดู"}
          </button>
        )}
      </div>
    </div>
  );
}

export default Input;
