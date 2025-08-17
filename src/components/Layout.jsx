import React, { useState, useEffect } from "react";
import Header from "./Header";
import { Outlet } from "react-router-dom";

const Layout = () => {
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    document.body.classList.toggle("dark", darkMode);
  }, [darkMode]);

  return (
    <>
      <Header darkMode={darkMode} setDarkMode={setDarkMode} />
      <main>
        <Outlet /> 
      </main>
    </>
  );
};

export default Layout;
