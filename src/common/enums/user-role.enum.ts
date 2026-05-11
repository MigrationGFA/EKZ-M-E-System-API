export enum UserRole {
  ADMIN = 'admin',
  ME_STAFF = 'me_staff',
  PROGRAMME_STAFF = 'programme_staff',
  VIEWER = 'viewer',
  // Non-human actor — issued via /admin/api-tokens. Routes that accept tokens
  // must list this explicitly in @Roles(...) alongside any human roles.
  API_TOKEN = 'api_token',
}
