import { randomBytes } from "crypto";
import { createAuth } from "@keystone-6/auth";
import { statelessSessions } from "@keystone-6/core/session";

let sessionSecret = process.env.SESSION_SECRET;
if (!sessionSecret && process.env.NODE_ENV !== "production") {
  sessionSecret = randomBytes(32).toString("hex");
}

const { withAuth } = createAuth({
  listKey: "User",
  identityField: "email",
  sessionData: "id role permissions isBlocked company { id accountancy { id } } accountancy { id }",
  secretField: "password",
  initFirstItem: {
    fields: ["name", "role", "email", "password"],
  },
});

const sessionMaxAge = 60 * 60 * 24 * 30;

const session = statelessSessions({
  maxAge: sessionMaxAge,
  secret: sessionSecret!,
});

export { withAuth, session };
