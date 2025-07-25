import { reducerCases } from "@/context/constants";
import { useStateProvider } from "@/context/StateContext";
import { calculateTime } from "@/utils/CalculateTime";
import React, { useState, useEffect } from "react";
import { BiSearchAlt2 } from "react-icons/bi";
import { IoClose } from "react-icons/io5";

function SearchMessages() {
  const [{ currentChatUser, messages }, dispatch] = useStateProvider();
  const [searchTerm, setSearchTerm] = useState("");
  const [searchedMessages, setSearchedMessages] = useState([]);

  useEffect(() => {
    if (searchTerm.trim().length === 0) {
      setSearchedMessages([]);
    } else {
      const filtered = messages.filter(
        (msg) =>
          msg.message &&
          msg.type === "text" &&
          msg.message.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setSearchedMessages(filtered);
    }
  }, [searchTerm, messages]);


  useEffect(() => {
    if (searchTerm.trim().length === 0) {
      setSearchedMessages([]);
    } else {
      const filtered = messages.filter(
        (msg) =>
          msg.message &&
          msg.type === "text" &&
          msg.message.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setSearchedMessages(filtered);
    }
  }, [searchTerm, messages]);

  return (
    <div className="border-conversation-border border-l w-full bg-conversation-panel-background flex flex-col z-10 max-h-screen">
      {/* Header */}
      <div className="h-16 px-4 py-5 flex gap-10 items-center bg-panel-header-background text-primary-strong">
        <IoClose
          className="cursor-pointer text-icon-lighter text-2xl"
          onClick={() => dispatch({ type: reducerCases.SET_MESSAGE_SEARCH })}
        />
        <span>Search Messages</span>
      </div>

      {/* Search input */}
      <div className="px-5 pt-4">
        <div className="bg-panel-header-background flex items-center gap-3 px-4 py-2 rounded-md w-full">
          <BiSearchAlt2 className="text-panel-header-icon cursor-pointer text-xl" />
          <input
            type="text"
            placeholder="Search Messages"
            className="bg-transparent text-sm focus:outline-none text-white w-full"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* No input hint */}
      {!searchTerm.length && (
        <span className="mt-10 text-secondary px-5">
          Search for messages with <strong>{currentChatUser?.name}</strong>
        </span>
      )}

      {/* Search results */}
      <div className="flex-1 overflow-auto custom-scrollbar px-5 mt-4">
        {searchTerm.length > 0 && searchedMessages.length === 0 && (
          <div className="text-secondary text-center">No messages found</div>
        )}
        {searchedMessages.map((message) => (
          <div
            key={message.id}
            className="cursor-pointer hover:bg-background-default-hover w-full px-3 py-4 border-b-[0.1px] border-secondary rounded-sm"
          >
            <div className="text-sm text-secondary mb-1">
              {calculateTime(message.createdAt)}
            </div>
            <div className="text-icon-green">{message.message}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default SearchMessages;
