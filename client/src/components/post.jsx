import FavoriteBorderOutlinedIcon from "@mui/icons-material/FavoriteBorderOutlined";
import FavoriteOutlinedIcon from "@mui/icons-material/FavoriteOutlined";
import moment from "moment";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { makeRequest } from "../../axios";
import { useContext } from "react";
import { AuthContext } from "../../contexts/authContext";

const Post = ({ post }) => {
  const { currentUser } = useContext(AuthContext);

  const { isLoading, error, data } = useQuery(["bookmarks", post.id], () =>
    makeRequest.get("/bookmarks?postId=" + post.id).then((res) => {
      return res.data;
    })
  );

  const queryClient = useQueryClient();

  const mutation = useMutation(
    (bookmarked) => {
      if (bookmarked) return makeRequest.delete("/bookmarks?postId=" + post.id);
      return makeRequest.post("/bookmarks", { postId: post.id });
    },
    {
      onSuccess: () => {
        // Invalidate and refetch
        queryClient.invalidateQueries(["bookmarks"]);
      },
    }
  );

  const handleBookmark = () => {
    mutation.mutate(data.includes(currentUser.id));
  };

  return (
    <div
      key={post.postId}
      className="rounded-lg overflow-hidden shadow-lg bg-gray-800 hover:shadow-xl transition-all duration-300"
    >
      <a href={post.url} target="_blank" rel="noopener noreferrer">
        <img
          src={"../" + post.thumbnail}
          alt={post.title}
          className="w-full h-48 object-cover object-center"
        />
      </a>
      <div className="p-4">
        <h2 className="text-xl font-bold mb-2 text-white">{post.title}</h2>
        <div className="flex justify-between items-center mt-2">
          <p className="text-gray-400 text-md font-bold mb-4">
            {moment(post.date).fromNow()}
          </p>
          <a
            href={post.url}
            target="_blank"
            rel="noopener noreferrer"
            className="border border-blue-500 text-blue-500 py-2 px-4 rounded-md hover:bg-blue-500 hover:text-white transition-all duration-200"
          >
            Read More
          </a>
          <div className="flex items-center gap-10 cursor-pointer text-sm">
            {isLoading ? (
              "loading"
            ) : data.includes(currentUser.id) ? (
              <FavoriteOutlinedIcon
                style={{ color: "red" }}
                onClick={handleBookmark}
              />
            ) : (
              <FavoriteBorderOutlinedIcon onClick={handleBookmark} />
            )}
            {data?.length} Bookmarks
          </div>
        </div>
      </div>
    </div>
  );
};

export default Post;
