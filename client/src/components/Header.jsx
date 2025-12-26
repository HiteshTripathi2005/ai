import React from "react";
import { Menu, User } from "lucide-react";
import { NavLink } from "react-router-dom";
import { useAuthStore } from "../stores/authStore";
import { Circles } from "react-loader-spinner";
import { ModeToggle } from "./mode-toggle";

export default function Header({ width, setWidth, setOpen }) {
  const { user, isAuthenticated, isLoading } = useAuthStore();

  return (
    <header className="h-14 border-b border-zinc-200/60 dark:border-zinc-800/60 px-3 md:px-5 flex items-center justify-between bg-white/60 dark:bg-zinc-950/60 backdrop-blur">
      <div className="flex items-center gap-5">
        <button
          className="lg:hidden cursor-pointer"
          onClick={() => setOpen((prev) => !prev)}
          aria-label="Open history"
        >
          <Menu className="h-[18px] w-[18px]" />
        </button>
        <button
          className="hidden lg:block cursor-pointer"
          onClick={() => setOpen((prev) => !prev)}
          aria-label="Toggle sidebar"
        >
          <Menu className="h-[18px] w-[18px]" />
        </button>
        <div className="text-sm text-zinc-500">AI Chat</div>
      </div>
      <div className="flex items-center gap-2">
        <ModeToggle />
        {isAuthenticated && user ? (
          <div className="h-8 w-8 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center text-xs font-medium text-zinc-600 dark:text-zinc-300">
            {user.avatar ? (
              <img
                src={user.avatar}
                alt={user.name || "User"}
                className="h-8 w-8 rounded-full object-cover"
              />
            ) : (
              <div className="h-8 w-8 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center text-xs font-medium text-zinc-600 dark:text-zinc-300">
                {user.name
                  ? user.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()
                  : "U"}
              </div>
            )}
          </div>
        ) : isLoading ? (
          <Circles
            height={20}
            width={20}
            color="#4fa94d"
            ariaLabel="circles-loading"
            wrapperStyle={{}}
            wrapperClass=""
            visible={true}
          />
        ) : (
          <NavLink
            to="/login"
            className="inline-flex h-9 items-center gap-2 rounded-xl border border-zinc-200 dark:border-zinc-800 px-3 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-900"
          >
            <User className="h-4 w-4" /> Login
          </NavLink>
        )}
      </div>
    </header>
  );
}
