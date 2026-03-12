"use client";
import { useEffect, useState } from "react";

const Footer = () => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null; // Or a loading indicator
  }
  return (
    <footer className="bg-linear-to-r from-gray-800 to-gray-900 p-4 w-full">
      <div className="container mx-auto text-center">
        <p className="text-lg text-white">
          &copy; AIR IQ Inc {new Date().getFullYear()}
        </p>
      </div>
    </footer>
  );
};

export default Footer;
