import React from 'react';
import { Wrench, Check } from "lucide-react";

function ToolCallRenderer({ part, index }) {
  // Check if tool call is completed
  // For stored messages (from database), check for _id field
  // For live streaming, check for explicit completion indicators
  const isCompleted = part.result !== null && part.result !== undefined ||
                     part.type === 'tool-output-available' ||
                     part.output !== undefined ||
                     part._id !== undefined; // Stored messages have _id

  return (
    <div className="mb-3 last:mb-0">
      <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
        {isCompleted ? (
          <>
            <Check className="h-4 w-4" />
            <span>called {part.toolName}</span>
          </>
        ) : (
          <>
            <Wrench className="h-4 w-4" />
            <span>calling {part.toolName}</span>
          </>
        )}
      </div>
    </div>
  );
}

export default ToolCallRenderer;
