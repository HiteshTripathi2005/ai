import { Router } from "express";
import { uploadImage, deleteImage } from "../controllers/upload.controller.js";
import { protect } from "../middleware/auth.js";
import upload from "../middleware/multer.js";

const router = Router();

// Upload image route
router.post("/image", protect, upload.single('image'), uploadImage);

// Delete image route
router.delete("/image", protect, deleteImage);

export default router;
