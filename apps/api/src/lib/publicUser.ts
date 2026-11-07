export function publicUser(user: {
  id: string;
  email: string;
  displayName: string;
  locale: string;
  humorEnabled: boolean;
  role: string;
}) {
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    locale: user.locale,
    humorEnabled: user.humorEnabled,
    role: user.role, // lets the frontend show/hide the admin link
  };
}
