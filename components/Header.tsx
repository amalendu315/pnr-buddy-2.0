"use client"; // Required because we use the usePathname hook

import { navMenu } from "../constants"; 
import Link from "next/link";
import { usePathname } from "next/navigation";

const Header = () => {
  const pathname = usePathname();

  // Find the matching link in your navMenu constants
  const matchingLink = navMenu.find((link:any) => link.href === pathname);

  const displayedRouteName = matchingLink ? (
    <div className="flex items-center">
      <Link
        href="/"
        className="text-gray-300 hover:text-white transition-colors text-lg"
      >
        Home
      </Link>
      {/* Separator */}
      <span className="mx-2 text-gray-400 text-lg">&gt;</span>
      <span className="capitalize text-gray-200 text-lg">
        {matchingLink.name}
      </span>
    </div>
  ) : (
    <span className="text-gray-200 text-lg">Home</span>
  );

  return (
    <header className="bg-linear-to-r from-gray-800 to-gray-900 p-4 w-full shadow-md">
      <div className="flex justify-between items-center">
        {displayedRouteName}

        {/* User Status Area */}
        <div className="flex items-center gap-2">
          <span className="text-gray-300 text-xl font-medium">Co-Worker</span>
          <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse"></div>
        </div>
      </div>
    </header>
  );
};

export default Header;
