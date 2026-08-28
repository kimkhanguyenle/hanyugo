import { Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Library from "./pages/Library";
import Lesson from "./pages/Lesson";
import Practice from "./pages/Practice";
import Characters from "./pages/Characters";
import CharacterPractice from "./pages/CharacterPractice";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Review from "./pages/Review";
import Settings from "./pages/Settings";

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/library" element={<Library />} />
          <Route path="/lesson/:id" element={<Lesson />} />
          <Route path="/lesson/:id/practice" element={<Practice />} />
          <Route path="/characters" element={<Characters />} />
          <Route path="/characters/:id" element={<CharacterPractice />} />
          <Route path="/review" element={<Review />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Route>
      </Routes>
    </AuthProvider>
  );
}
