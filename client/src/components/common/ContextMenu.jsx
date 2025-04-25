import React, { useEffect, useRef } from "react";

function ContextMenu({ options, coordinates, contextMenu, setContextMenu }) {
  const contextMenuRef = useRef(null);
useEffect(() => {
  const handleOutsideClick = (event) => {
    if(event.target.id !== "context-opener"){
      if(contextMenuRef.current && !contextMenuRef.current.contains(event.target))
        setContextMenu(false)
      }
  };
  document.addEventListener("click",handleOutsideClick);
  return () =>{
    document.removeEventListener("click", handleOutsideClick);
  }
},[])
  const handleClick = (e, callback) => {
    e.stopPropagation();
    if (callback) {
      callback();
    }
    setContextMenu(false); // ปิด Context Menu หลังคลิก
  };

  return (
    <div
      className="bg-dropdown-background fixed py-2 z-[100] shadow-xl"
      style={{
        top: `${coordinates.y}px`,
        left: `${coordinates.x}px`,
        position: "absolute",
      }}
      ref={contextMenuRef}
    >
      <ul>
        {options.map(({ name, callback }) => (
          <li
            key={name}
            onClick={(e) => handleClick(e, callback)}
            className="px-4 py-2 cursor-pointer hover:bg-background-defaul"
          >
            <span className="text-white">{name}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default ContextMenu;

