import { createContext } from "react";
import React from "react";

export const NewsContext = React.createContext({
  setSearchQuery: () => {},
  createContext: () => {},
});

export const NewsContextProvider = NewsContext.Provider;
