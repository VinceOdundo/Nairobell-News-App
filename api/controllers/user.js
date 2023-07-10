import jwt from "jsonwebtoken";
import User from "../models/user.js";

export const getUser = async (req, res) => {
  const userId = req.params.userId;

  // Use the findById method of the User model here
  const user = await User.findById(userId);

  if (user) {
    // Destructure the password property and return the rest of the info
    const { password, ...info } = user;
    return res.json(info);
  } else {
    return res.status(404).json("User not found");
  }
};

export const updateUser = (req, res) => {
  const token = req.cookies.accessToken;
  if (!token) return res.status(401).json("Not authenticated!");

  jwt.verify(token, "secretkey", async (err, userInfo) => {
    if (err) return res.status(403).json("Token is not valid!");

    // Use the findById method of the User model here
    const user = await User.findById(userInfo.id);

    if (user) {
      // Update the user properties with the request body
      user.username = req.body.username;
      user.firstName = req.body.firstName;
      user.lastName = req.body.lastName;
      user.pronouns = req.body.pronouns;
      user.email = req.body.email;
      user.profilePic = req.body.profilePic;

      // Use the update method of the User model here
      await user.update();

      return res.json("Updated!");
    } else {
      return res.status(403).json("You can update only your post!");
    }
  });
};
