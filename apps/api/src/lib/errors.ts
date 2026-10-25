//  error P2002
export function isUniqueViolation(e: unknown): boolean {
  return (
    typeof e === "object" && e !== null && "code" in e && e.code === "P2002"
  );
}
