import { useState, type FormEvent } from "react";
import { Link } from "react-router";
import { useAuth } from "../auth/context";
import { getErrorMessage } from "../lib/api";
import { AuthLayout, buttonClass, inputClass } from "../components/authLayout";

export function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(email, password);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout
      title="Log in"
      toast="Welcome back! Your seat at the supra is still warm. Come, Come, we just sat around the table!"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          className={inputClass}
          type="email"
          placeholder="Email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          className={inputClass}
          type="password"
          placeholder="Password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        {error && <p className="text-sm text-red-700">{error}</p>}
        <button className={buttonClass} disabled={submitting}>
          {submitting ? "Logging in..." : "Log in"}
        </button>
      </form>
      <p className="mt-4 text-center text-sm text-stone-600">
        New here?{" "}
        <Link to="/signup" className="font-medium text-red-800 hover:underline">
          Create an account
        </Link>
      </p>
    </AuthLayout>
  );
}
