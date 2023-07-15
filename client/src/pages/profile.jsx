import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { makeRequest } from "../axios";
import { useLocation } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "../contexts/authContext";
import Update from "../components/update/Update";
import { useState } from "react";

const Profile = () => {
  // initialize state for update component
  const [openUpdate, setOpenUpdate] = useState(false);
  // initialize state for modal component
  const [openModal, setOpenModal] = useState(false); // add state for modal component
  // get current user from context
  const { currentUser } = useContext(AuthContext);
  // get user ID from URL
  const userId = parseInt(useLocation().pathname.split("/")[2]);
  // fetch user data with react query
  const { isLoading, error, data } = useQuery(["user", userId], () =>
    makeRequest.get(`/users/find/${userId}`).then((res) => {
      return res.data;
    })
  );

  // fetch bookmark data with react query
  const { isLoading: rIsLoading, data: bookmarkData } = useQuery(
    ["bookmark"],
    () =>
      makeRequest.get(`/bookmarks?post_id=${userId}`).then((res) => {
        return res.data;
      })
  );
  // get query client for invalidation
  const queryClient = useQueryClient();
  // create mutation function for bookmarking
  return (
    <div className="h-screen bg-purple-300 flex items-center justify-center">
      {isLoading ? (
        "loading"
      ) : (
        <>
          <div className="w-full h-72 relative">
            <div className="w-full h-full bg-gradient-to-r from-blue-100 to-blue-600"></div>
            <img
              src={`/upload/${data.profilePic}`}
              alt=""
              className="w-48 h-48 rounded-full object-cover absolute left-0 right-0 mx-auto top-48"
            />
          </div>
          <div className="w-full p-16 flex flex-col gap-8">
            <div className="h-44 shadow-lg rounded-lg bg-white text-gray-700 p-12 flex items-center justify-between mb-8">
              <div className="flex-1 flex flex-col items-center gap-4">
                <span className="text-xl font-semibold">{data.name}</span>
                <span className="text-sm text-gray-500">{data.pronouns}</span>

                {rIsLoading ? (
                  "loading"
                ) : userId === currentUser.id ? (
                  // show update button if own profile
                  <button
                    onClick={() => setOpenUpdate(true)}
                    className="w-1/2 py-2 border-none bg-purple-400 text-white font-bold rounded hover:bg-purple-500"
                  >
                    update
                  </button>
                ) : (
                  // show bookmark button and count if other profile
                  <div className="flex items-center gap-4">
                    <span
                      className="text-gray-500 cursor-pointer"
                      onClick={() => setOpenModal(true)}
                    >
                      {bookmarkData.length} bookmarks
                    </span>
                  </div>
                )}
              </div>

              <div className="flex-1 flex items-center justify-end gap-4">
                <EmailOutlinedIcon />
              </div>
            </div>
          </div>
          {openModal && ( // render modal component if openModal is true
            <Modal setOpenModal={setOpenModal} bookmarkData={bookmarkData} />
          )}
        </>
      )}
      {openUpdate && <Update setOpenUpdate={setOpenUpdate} user={data} />}
    </div>
  );
};

export default Profile;
