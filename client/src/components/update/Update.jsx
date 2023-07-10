import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { makeRequest } from "../../../axios";

const Update = ({ setOpenUpdate, user }) => {
  const [inputs, setInputs] = useState({
    name: user.name,
    pronouns: user.pronouns || "", // add pronouns state with empty string as initial value
    profilePic: user.profilePic,
    email: user.email,
  });

  const queryClient = useQueryClient();

  const mutation = useMutation(
    (inputs) => {
      return makeRequest.put("/users/" + user.id, inputs);
    },
    {
      onSuccess: () => {
        // Invalidate and refetch
        queryClient.invalidateQueries(["user"]);
      },
    }
  );

  const handleChange = (e) => {
    setInputs((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleClick = async (e) => {
    e.preventDefault();
    try {
      await mutation.mutate(inputs);
      setOpenUpdate(false);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="update">
      <div className="card">
        <h1>Update</h1>
        <form>
          <input
            type="text"
            placeholder="Name"
            name="name"
            value={inputs.name}
            onChange={handleChange}
          />
          <input
            type="text"
            placeholder="Pronouns"
            name="pronouns"
            value={inputs.pronouns}
            onChange={handleChange}
          />
          <input
            type="text"
            placeholder="Profile Picture URL"
            name="profilePic"
            value={inputs.profilePic}
            onChange={handleChange}
          />
          <input
            type="email"
            placeholder="Email"
            name="email"
            value={inputs.email}
            onChange={handleChange}
          />
          <button onClick={handleClick}>Save</button>
        </form>
      </div>
    </div>
  );
};

export default Update;
