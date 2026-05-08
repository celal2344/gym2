import { expect, test } from "@playwright/test";

test.describe("web smoke coverage", () => {
  test("landing page renders core operational surface", async ({ page }) => {
    await page.goto("/");

    await expect(
      page.getByRole("heading", { name: /gym reservation operations/i }),
    ).toBeVisible();
    await expect(page.getByRole("link", { name: /login/i })).toBeVisible();
    await expect(page.getByRole("cell", { name: "Aylin Demir" })).toBeVisible();

    await page.getByRole("tab", { name: "Services" }).click();
    await expect(page.getByText("Pool lane reservation")).toBeVisible();

    await page.getByRole("tab", { name: "Capacity" }).click();
    await expect(page.getByText("Slot inventory")).toBeVisible();
  });

  test("login page exposes sample users and missing-env guard", async ({
    page,
  }) => {
    await page.goto("/login");

    await expect(
      page.getByRole("heading", {
        name: "Sign in to your operations workspace.",
      }),
    ).toBeVisible();
    await expect(page.getByText("Supabase is not configured")).toBeVisible();
    await expect(
      page.getByRole("button", { name: /user member@gymops\.dev/i }),
    ).toBeVisible();
    await expect(
      page.getByText("Sample route after login: /app"),
    ).toBeVisible();

    await page
      .getByRole("button", { name: /admin admin@gymops\.dev/i })
      .click();
    await expect(page.getByLabel("Email")).toHaveValue("admin@gymops.dev");
    await expect(
      page.getByText("Sample route after login: /admin"),
    ).toBeVisible();
  });

  test("protected manager route redirects to login when auth runtime is unconfigured", async ({
    page,
  }) => {
    await page.goto("/manager");

    await expect(
      page.getByRole("heading", {
        name: "Sign in to your operations workspace.",
      }),
    ).toBeVisible();
    await expect(
      page.getByText("Protected workspace unavailable"),
    ).toBeVisible();
    await expect(
      page.getByText("protected panels stay locked until auth is configured"),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Sign in" }),
    ).toBeDisabled();
    await expect(page).toHaveURL(/\/login\?next=%2Fmanager&reason=auth-unavailable$/);
    await expect(
      page.getByRole("heading", { name: "Manager operations" }),
    ).toHaveCount(0);
  });
});
