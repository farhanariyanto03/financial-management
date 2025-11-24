"use client";

import { Menu, Search, User, Settings, HelpCircle, LogOut } from "lucide-react";
import { useState } from "react";

interface AdminHeaderProps {
  onMenuClick: () => void;
}

export function AdminHeader({ onMenuClick }: AdminHeaderProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-white border-b border-gray-200 md:left-64">
      <div className="flex items-center justify-between h-16 px-4 md:px-6">
        <div className="flex items-center gap-4 flex-1">
          <button
            onClick={onMenuClick}
            className="p-2 rounded-lg hover:bg-gray-100 md:hidden"
          >
            <Menu className="w-6 h-6" />
          </button>

          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#169d53] focus:border-transparent"
            />
          </div>
        </div>

        <div className="relative">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100"
          >
            <div className="w-10 h-10 rounded-full bg-[#169d53] flex items-center justify-center">
              <User className="w-6 h-6 text-white" />
            </div>
            <div className="hidden md:block text-left">
              <div className="text-sm font-medium">Admin</div>
            </div>
          </button>

          {isDropdownOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setIsDropdownOpen(false)}
              />
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                <div className="px-4 py-3 border-b border-gray-200">
                  <div className="font-semibold text-gray-900">Afar</div>
                  <div className="text-sm text-gray-500">Admin</div>
                </div>

                <button className="w-full flex items-center gap-3 px-4 py-2 hover:bg-gray-50 text-left">
                  <User className="w-5 h-5 text-gray-600" />
                  <span>Edit profile</span>
                </button>

                <button className="w-full flex items-center gap-3 px-4 py-2 hover:bg-gray-50 text-left">
                  <Settings className="w-5 h-5 text-gray-600" />
                  <span>Account settings</span>
                </button>

                <button className="w-full flex items-center gap-3 px-4 py-2 hover:bg-gray-50 text-left">
                  <HelpCircle className="w-5 h-5 text-gray-600" />
                  <span>Support</span>
                </button>

                <div className="border-t border-gray-200 mt-2 pt-2">
                  <button className="w-full flex items-center gap-3 px-4 py-2 hover:bg-gray-50 text-left text-red-600">
                    <LogOut className="w-5 h-5" />
                    <span>Sign out</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
