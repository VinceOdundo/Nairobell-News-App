import express from "express";
import {
  getBookmarks,
  addBookmark,
  deleteBookmark,
} from "../controllers/bookmark.js";

const router = express.Router();

router.get("/", getBookmarks);
router.post("/", addBookmark);
router.delete("/", deleteBookmark);

export default router;
