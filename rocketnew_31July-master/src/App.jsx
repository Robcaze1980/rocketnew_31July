import React from "react";
import Routes from "./Routes";
import { AIAnalystProvider } from "./contexts/AIAnalystContext";
import { AuthProvider } from "./contexts/AuthContext";

function App() {
  return (
    <AuthProvider>
      <AIAnalystProvider>
        <Routes />
      </AIAnalystProvider>
    </AuthProvider>
  );
}

export default App;
