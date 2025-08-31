import React from 'react';
import { Wrench, Zap, Check, Clock } from "lucide-react";

function ToolCallRenderer({ part, index }) {
  switch (part.type) {
    case 'tool-call':
      return (
        <div key={index} className="mb-3 last:mb-0">
          <div className="flex items-center gap-2 mb-2">
            <div className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-orange-100 to-orange-200 dark:from-orange-900 dark:to-orange-800 text-orange-600 dark:text-orange-400">
              <Wrench className="h-3 w-3" />
            </div>
            <span className="text-xs font-medium text-orange-700 dark:text-orange-300">
              Tool Call
            </span>
          </div>
          <div className="bg-gradient-to-r from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900 border border-orange-200 dark:border-orange-800 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <Zap className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-orange-900 dark:text-orange-100 mb-1">
                  {part.toolName}
                </div>
                <div className="text-xs text-orange-700 dark:text-orange-300">
                  <strong>Input:</strong> {JSON.stringify(part.input, null, 2)}
                </div>
              </div>
            </div>
          </div>
        </div>
      );

    case 'tool-result':
      return (
        <div key={index} className="mb-3 last:mb-0">
          <div className="flex items-center gap-2 mb-2">
            <div className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-green-100 to-green-200 dark:from-green-900 dark:to-green-800 text-green-600 dark:text-green-400">
              <Check className="h-3 w-3" />
            </div>
            <span className="text-xs font-medium text-green-700 dark:text-green-300">
              Tool Result
            </span>
          </div>
          <div className="bg-gradient-to-r from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border border-green-200 dark:border-green-800 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <Clock className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-xs text-green-700 dark:text-green-300">
                  <strong>Result:</strong>
                </div>
                <div className="text-sm text-green-900 dark:text-green-100 mt-1 font-mono bg-green-100 dark:bg-green-900 p-2 rounded border">
                  {typeof part.result === 'string' ? part.result : JSON.stringify(part.result, null, 2)}
                </div>
              </div>
            </div>
          </div>
        </div>
      );

    default:
      return null;
  }
}

export default ToolCallRenderer;
