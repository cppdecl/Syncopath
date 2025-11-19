import { useState } from "react";
import { apiPost } from "../api/Client";
import { Link, useNavigate } from "react-router-dom";

export default function RegisterMenu() {
  const nav = useNavigate();
  const [username, setU] = useState("");
  const [password, setP] = useState("");
  const [error, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleRegister() {
    setLoading(true);
    setErr("");
    try {
      const res = await apiPost("/register", { username, password });

      if (res.success) {
        nav("/login");
      } else if (res.error) {
        setErr(res.error);
      } else {
        setErr("Unexpected error");
      }
    } catch (e) {
      setErr("Server error");
    }
    setLoading(false);
  }

  return (
    <div className="flex items-center justify-center h-screen bg-gradient-to-br from-gray-900 to-purple-900 text-white p-6">
      <div className="w-full max-w-md bg-gray-800/70 backdrop-blur-md rounded-xl shadow-xl p-8 space-y-6 border border-purple-700/50">
        <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-pink-300 text-center">
          REGISTER
        </h1>

        {error && (
          <div className="p-3 bg-red-900/70 border-l-4 border-red-500 rounded-r-lg text-red-200 text-sm">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setU(e.target.value)}
            className="w-full px-4 py-2 rounded-lg bg-gray-700/50 border border-purple-700 text-white placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-400"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setP(e.target.value)}
            className="w-full px-4 py-2 rounded-lg bg-gray-700/50 border border-purple-700 text-white placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-400"
          />
        </div>

        <button
          onClick={handleRegister}
          disabled={loading}
          className="w-full px-4 py-2 bg-gradient-to-r from-purple-700 to-pink-500 hover:from-pink-500 hover:to-purple-600 rounded-lg font-medium shadow-lg transition-all border border-purple-700 hover:border-purple-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Registering..." : "CREATE ACCOUNT"}
        </button>

        <div className="text-center text-sm text-purple-300">
          <span>Already have an account? </span>
          <Link
            to="/login"
            className="text-purple-400 hover:text-purple-200 font-medium"
          >
            Login
          </Link>
        </div>
      </div>
    </div>
  );
}
