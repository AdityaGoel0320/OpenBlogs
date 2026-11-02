import React, { createContext, useEffect, useState } from "react";
import "./theme.css";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";

export const Context = createContext({
  isAuthenticated: false,
});

const AppWrapper = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [user, setUser] = useState({});
  const [blogs, setBlogs] = useState([]);
  const [mode, setMode] = useState(() => localStorage.getItem("openblogs-theme") || "light");

  useEffect(() => {
    document.documentElement.dataset.theme = mode;
    localStorage.setItem("openblogs-theme", mode);
  }, [mode]);

  return (
    <Context.Provider
      value={{
        user,
        setUser,
        blogs,
        setBlogs,
        mode,
        setMode,
        isAuthenticated,
        isAuthLoading,
        setIsAuthLoading,
        setIsAuthenticated,
      }}
    >
      <App />
    </Context.Provider>
  );
};

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AppWrapper />
  </React.StrictMode>
);
