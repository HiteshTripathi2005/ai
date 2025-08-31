import React from 'react';
import { User, Bot } from "lucide-react";

function MessageSkeleton({ isUser = false }) {
  return (
    <div className={`w-full flex mb-6 ${isUser ? "justify-end" : "justify-start"}`}>
      <div className={`group relative max-w-[min(85%,700px)] ${
        isUser ? "ml-12" : "mr-12"
      }`}>
        {/* Avatar */}
        <div className={`flex items-center mb-2 ${isUser ? "justify-end" : "justify-start"}`}>
          <div className={`inline-flex h-8 w-8 items-center justify-center rounded-full shadow-sm ${
            isUser 
              ? "bg-gradient-to-br from-blue-500 to-blue-600 text-white" 
              : "bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 text-gray-700 dark:text-gray-300"
          } animate-pulse`}>
            {isUser ? <User className="h-4 w-4"/> : <Bot className="h-4 w-4"/>}
          </div>
        </div>

        {/* Message bubble skeleton */}
        <div className={`relative ${
          isUser
            ? "bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/25"
            : "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm"
        } rounded-2xl px-5 py-4`}>
          
          {/* Skeleton content */}
          <div className="space-y-2 animate-pulse">
            <div className={`h-4 rounded ${
              isUser ? "bg-blue-300" : "bg-gray-300 dark:bg-gray-600"
            } w-3/4`}></div>
            <div className={`h-4 rounded ${
              isUser ? "bg-blue-300" : "bg-gray-300 dark:bg-gray-600"
            } w-1/2`}></div>
            <div className={`h-4 rounded ${
              isUser ? "bg-blue-300" : "bg-gray-300 dark:bg-gray-600"
            } w-5/6`}></div>
          </div>

          {/* Timestamp skeleton */}
          <div className={`h-3 mt-3 rounded w-16 ${
            isUser ? "bg-blue-300" : "bg-gray-300 dark:bg-gray-500"
          } animate-pulse`}></div>
        </div>
      </div>
    </div>
  );
}

export default function MessageLoadingSkeleton() {
  return (
    <div className="space-y-3">
      <MessageSkeleton isUser={true} />
      <MessageSkeleton isUser={false} />
      <MessageSkeleton isUser={true} />
      <MessageSkeleton isUser={false} />
    </div>
  );
}
