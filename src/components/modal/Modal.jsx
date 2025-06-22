import { useQuery } from "@tanstack/react-query";
import { makeRequest } from "../../../axios";

const Modal = ({ setOpenModal }) => {
  const {
    isLoading,
    error,
    data: bookmarkData,
  } = useQuery("bookmarks", () =>
    makeRequest.get("/bookmarks").then((res) => res.data)
  );

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  return (
    <div className="modal">
      <div className="card">
        <h1>Bookmarked Posts</h1>
        <button className="close-button" onClick={() => setOpenModal(false)}>
          Close
        </button>
        <div className="posts">
          {bookmarkData.map((post) => (
            <div key={post.id} className="post-card">
              <h2>{post.title}</h2>
              <p>{post.date}</p>
              <a href={post.postUrl}>Read More</a>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Modal;
