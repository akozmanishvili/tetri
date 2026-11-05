import { useState, type FormEvent } from "react";
import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import { useAuth } from "../auth/context";
import { getErrorMessage } from "../lib/api";
import { AuthLayout, buttonClass, inputClass } from "../components/authLayout";

export function SignupPage() {
  const { t } = useTranslation();
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
    <AuthLayout title={t("auth.signupTitle")} toast={t("auth.signupToast")}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          className={inputClass}
          placeholder={t("auth.name")}
          autoComplete="name"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          required
        />
        <input
          className={inputClass}
          type="email"
          placeholder={t("auth.email")}
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          className={inputClass}
          type="password"
          placeholder={t("auth.passwordHint")}
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          minLength={8}
          required
        />
        {error && <p className="text-sm text-red-700">{error}</p>}
        <button className={buttonClass} disabled={submitting}>
          {submitting ? t("auth.signingUp") : t("auth.signupButton")}
        </button>
      </form>
      <p className="mt-4 text-center text-sm text-stone-600">
        {t("auth.haveAccount")}{" "}
        <Link to="/login" className="font-medium text-red-800 hover:underline">
          {t("auth.loginButton")}
        </Link>
      </p>
    </AuthLayout>
  );
}
