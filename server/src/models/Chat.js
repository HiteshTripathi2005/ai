import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['user', 'assistant'],
    required: true
  },
  parts: [{
    type: {
      type: String,
      enum: ['text', 'tool-call', 'tool-result'],
      required: true
    },
    text: {
      type: String,
      required: function() { return this.type === 'text'; }
    },
    toolName: {
      type: String,
      required: function() { return this.type === 'tool-call'; }
    },
    input: {
      type: mongoose.Schema.Types.Mixed,
      required: function() { return this.type === 'tool-call'; }
    },
    toolCallId: {
      type: String,
      required: function() { return this.type === 'tool-result'; }
    },
    result: {
      type: mongoose.Schema.Types.Mixed,
      required: function() { return this.type === 'tool-result'; }
    }
  }],
  raw: {
    type: mongoose.Schema.Types.Mixed,
    required: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const chatSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    default: 'New Chat',
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  messages: [messageSchema],
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for efficient queries
chatSchema.index({ user: 1, createdAt: -1 });

export default mongoose.model('Chat', chatSchema);
