import express from 'express';
import { protect } from '../middleware/auth.js';
import {
    getTasks,
    getTask,
    createTask,
    updateTask,
    deleteTask
} from '../controllers/task.controller.js';

const router = express.Router();

// All task routes require authentication
router.use(protect);

// @desc    Get all tasks for user
// @route   GET /api/tasks
// @access  Private
router.get('/', getTasks);

// @desc    Create a new task
// @route   POST /api/tasks
// @access  Private
router.post('/', createTask);

// @desc    Get a single task
// @route   GET /api/tasks/:taskId
// @access  Private
router.get('/:taskId', getTask);

// @desc    Update a task
// @route   PUT /api/tasks/:taskId
// @access  Private
router.put('/:taskId', updateTask);

// @desc    Delete a task
// @route   DELETE /api/tasks/:taskId
// @access  Private
router.delete('/:taskId', deleteTask);

export default router;
