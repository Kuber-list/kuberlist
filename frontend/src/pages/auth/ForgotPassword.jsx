import { useState } from "react";
import { Link } from "react-router-dom";
import { authAPI } from "../../api/index.js";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");

    try {
      const response = await authAPI.forgotPassword(email.trim());
      setMessage(
        response.data?.message ||
          "If an eligible account exists for that email, a password-reset link will be sent.",
      );
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "We couldn't process your request. Please try again later.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <Link to="/" className="text-2xl font-bold text-navy">
          KuberList
        </Link>

        <div className="mt-8 rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
          <h1 className="text-2xl font-semibold text-navy">
            Forgot your password?
          </h1>

          <p className="mt-3 text-sm text-gray-600">
            Enter the email address associated with your KuberList account. If
            an eligible account exists, we'll send you a reset link.
          </p>

          {message && (
            <div
              role="status"
              className="mt-5 rounded-lg bg-green-50 p-3 text-sm text-green-800"
            >
              {message}
            </div>
          )}

          {error && (
            <div
              role="alert"
              className="mt-5 rounded-lg bg-red-50 p-3 text-sm text-red-700"
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-5">
            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Email address
              </label>

              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                maxLength={254}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="input w-full"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-navy w-full disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Sending..." : "Send reset link"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-600">
            Remember your password?{" "}
            <Link to="/login" className="font-medium text-navy hover:underline">
              Back to login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
