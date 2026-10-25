// ONLY shape of user that ever leaves the API
export function publicUser(user: {
  id: string;
  email: string;
  displayName: string;
  locale: string;
  humorEnabled: boolean;
}) {
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    locale: user.locale,
    humorEnabled: user.humorEnabled,
  };
}
