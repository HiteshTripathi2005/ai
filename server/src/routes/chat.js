import {Router} from "express"
import {
    chat,
    getChats,
    createChat,
    getChat,
    deleteChat,
    updateChatTitle,
    multiModelChat,
    selectModelResponse
} from "../controllers/chat.controller.js";
import { protect } from "../middleware/auth.js";

const router = Router();

// Chat message routes
router.route("/").post(protect, chat);
router.route("/multi-model").post(protect, multiModelChat);
router.route("/select-response").post(protect, selectModelResponse);

// Chat management routes
router.route("/chats").get(protect, getChats);
router.route("/chats").post(protect, createChat);
router.route("/chats/:chatId").get(protect, getChat);
router.route("/chats/:chatId").delete(protect, deleteChat);
router.route("/chats/:chatId/title").put(protect, updateChatTitle);

export default router;