// Single source of truth distinguishing the app's developer/owner from users.
// The app never authenticates users, so there is no user "profile" — this
// constant is used purely for attribution and to keep developer identity
// visually and semantically separate from any user-generated content.
export const DEVELOPER = {
  name: "Akhona Pacwana",
  role: "Designer, Developer & Owner",
  app: "CareerPilot AI",
} as const;

export const DEVELOPER_ATTRIBUTION = `Designed, developed & owned by ${DEVELOPER.name}`;
