import React, { useEffect, useState } from "react";
import { BiArrowBack, BiSearchAlt2 } from "react-icons/bi";
import { useStateProvider } from "@/context/StateContext";
import { reducerCases } from "@/context/constants";
import GroupModal from "./GroupModal";

function GroupsList() {
  const [searchTerm, setSearchTerm] = useState("");
  const [groups, setGroups] = useState([]);
  const [filteredGroups, setFilteredGroups] = useState([]);
  const [showModal, setShowModal] = useState(false); // ✅ state สำหรับเปิดปิด modal
  const [, dispatch] = useStateProvider();

  useEffect(() => {
    // 🔁 Mock data – ในอนาคตอาจดึงจาก API
    const mockGroups = [
      { id: 1, name: "Developers", about: "All Dev Team" },
      { id: 2, name: "Designers", about: "Creative group" },
      { id: 3, name: "HR", about: "Human Resources" },
    ];
    setGroups(mockGroups);
    setFilteredGroups(mockGroups);
  }, []);

  useEffect(() => {
    if (searchTerm.length) {
      const filtered = groups.filter((group) =>
        group.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredGroups(filtered);
    } else {
      setFilteredGroups(groups);
    }
  }, [searchTerm, groups]);

  const handleBack = () => {
    dispatch({ type: reducerCases.SET_GROUPS_PAGE, payload: false });
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="h-24 flex items-end px-3 py-4">
        <div className="flex items-center gap-12 text-white">
          <BiArrowBack className="cursor-pointer text-xl" onClick={handleBack} />
          <span>Group Chat</span>
        </div>
      </div>

      {/* Search and List */}
      <div className="bg-search-input-container-background h-full flex-auto overflow-auto custom-scrollbar">
        {/* Search bar */}
        <div className="flex py-3 items-center gap-3 h-14">
          <div className="bg-panel-header-background flex items-center gap-5 px-5 py-1 rounded-lg flex-grow mx-4">
            <BiSearchAlt2 className="text-panel-header-icon text-xl" />
            <input
              type="text"
              placeholder="Search Groups"
              className="bg-transparent text-sm focus:outline-none text-white w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Group list */}
        <div className="px-5 text-white">
          {filteredGroups.length === 0 && (
            <p className="text-secondary text-sm mt-4">No groups found.</p>
          )}
          {filteredGroups.map((group) => (
            <div
              key={group.id}
              className="py-2 px-4 hover:bg-background-default-hover rounded cursor-pointer"
              onClick={() =>
                console.log(`Join group: ${group.name} (ID: ${group.id})`)
              }
            >
              <p className="font-medium">{group.name}</p>
              <p className="text-secondary text-sm">{group.about}</p>
            </div>
          ))}

          {/* Create Group Button */}
          <div className="mt-6">
            <button
              onClick={() => setShowModal(true)}
              className="bg-teal-light text-white px-4 py-2 rounded-xl text-sm hover:opacity-90 flex items-center gap-2"
            >
              ➕ Create Group
            </button>
          </div>
        </div>
      </div>

      {/* Group Creation Modal */}
      {showModal && <GroupModal onClose={() => setShowModal(false)} />}
    </div>
  );
}

export default GroupsList;
