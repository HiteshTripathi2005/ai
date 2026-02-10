import React from 'react';

function MessageSkeleton({ isUser = false }) {
  return (
    <div className={`flex mb-4 ${isUser ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-[80%] ${isUser ? "ml-12" : "mr-12"}`}>
        <div className={`px-4 py-3 rounded-lg ${
          isUser ? "bg-blue-500" : "bg-zinc-100 dark:bg-zinc-800"
        } animate-pulse`}>
          <div className="space-y-2">
            <div className={`h-4 rounded ${
              isUser ? "bg-blue-400" : "bg-zinc-300 dark:bg-zinc-700"
            } w-48`}></div>
            <div className={`h-4 rounded ${
              isUser ? "bg-blue-400" : "bg-zinc-300 dark:bg-zinc-700"
            } w-32`}></div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function MessageLoadingSkeleton() {
  return (
    <>
      <MessageSkeleton isUser={true} />
      <MessageSkeleton isUser={false} />
      <MessageSkeleton isUser={true} />
      <MessageSkeleton isUser={false} />
    </>
  );
}
