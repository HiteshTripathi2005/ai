import {Router} from "express"
import { chat } from "../controllers/chat.controller.js";
import { protect } from "../middleware/auth.js";

const router = Router();

router.route("/").post(protect, chat);

export default router;