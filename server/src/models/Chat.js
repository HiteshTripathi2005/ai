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
  // For single model responses (legacy support)
  parts: [{
    type: {
      type: String,
      enum: ['text', 'tool-call'],
      required: true
    },
    text: {
      type: String,
      required: function() { return this.type === 'text'; }
    },
    toolCallId: {
      type: String,
      required: function() { return this.type === 'tool-call'; }
    },
    toolName: {
      type: String,
      required: function() { return this.type === 'tool-call'; }
    },
    args: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    result: {
      type: mongoose.Schema.Types.Mixed
    }
  }],
  // For multi-model responses
  multiModelResponses: [{
    model: {
      type: String,
      required: true
    },
    parts: [{
      type: {
        type: String,
        enum: ['text', 'tool-call'],
        required: true
      },
      text: String,
      toolCallId: String,
      toolName: String,
      args: mongoose.Schema.Types.Mixed,
      result: mongoose.Schema.Types.Mixed
    }],
    show: {
      type: Boolean,
      default: false
    },
    selected: {
      type: Boolean,
      default: false
    }
  }],
  isMultiModel: {
    type: Boolean,
    default: false
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
