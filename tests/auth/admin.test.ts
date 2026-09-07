import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { adminEmails, isAdminEmail, isAuthConfigured } from "@/lib/auth/admin";

const ENV_KEYS = ["ADMIN_EMAIL", "AUTH_SECRET", "AUTH_GOOGLE_ID", "AUTH_GOOGLE_SECRET"] as const;
const originalEnv: Record<string, string | undefined> = {};

beforeEach(() => {
  for (const key of ENV_KEYS) originalEnv[key] = process.env[key];
});

afterEach(() => {
  for (const key of ENV_KEYS) {
    if (originalEnv[key] === undefined) delete process.env[key];
    else process.env[key] = originalEnv[key];
  }
});

describe("adminEmails", () => {
  it("parses a comma-separated allowlist, trimmed and lowercased", () => {
    process.env.ADMIN_EMAIL = " Owner@Example.com, second@example.com ,";
    expect(adminEmails()).toEqual(["owner@example.com", "second@example.com"]);
  });

  it("returns an empty list when unset", () => {
    delete process.env.ADMIN_EMAIL;
    expect(adminEmails()).toEqual([]);
  });
});

describe("isAdminEmail", () => {
  it("matches case-insensitively", () => {
    process.env.ADMIN_EMAIL = "owner@example.com";
    expect(isAdminEmail("Owner@Example.com")).toBe(true);
    expect(isAdminEmail("someone-else@example.com")).toBe(false);
  });

  it("rejects a missing email", () => {
    process.env.ADMIN_EMAIL = "owner@example.com";
    expect(isAdminEmail(null)).toBe(false);
    expect(isAdminEmail(undefined)).toBe(false);
  });
});

describe("isAuthConfigured", () => {
  it("requires the secret, OAuth credentials, and at least one admin email", () => {
    process.env.AUTH_SECRET = "secret";
    process.env.AUTH_GOOGLE_ID = "id";
    process.env.AUTH_GOOGLE_SECRET = "secret";
    process.env.ADMIN_EMAIL = "owner@example.com";
    expect(isAuthConfigured()).toBe(true);

    delete process.env.ADMIN_EMAIL;
    expect(isAuthConfigured()).toBe(false);
  });
});
