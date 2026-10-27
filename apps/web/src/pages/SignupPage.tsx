import { useState, type FormEvent } from "react";
import { Link } from "react-router";
import { useAuth } from "../auth/context";
import { getErrorMessage } from "../lib/api";
import { AuthLayout, buttonClass, inputClass } from "../components/authLayout";

export function SignupPage() {
  const { signup } = useAuth();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await signup({ email, password, displayName });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout
      title="Create your account"
      toast="A new guest at the table! Here are 10,000 lari to start. You must drain it completely"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          className={inputClass}
          placeholder="Your name"
          autoComplete="name"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          required
        />
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
          placeholder="Password (8+ characters)"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          minLength={8}
          required
        />
        {error && <p className="text-sm text-red-700">{error}</p>}
        <button className={buttonClass} disabled={submitting}>
          {submitting ? "Creating account..." : "Sign up"}
        </button>
      </form>
      <p className="mt-4 text-center text-sm text-stone-600">
        Already have an account?{" "}
        <Link to="/login" className="font-medium text-red-800 hover:underline">
          Log in
        </Link>
      </p>
    </AuthLayout>
  );
}
