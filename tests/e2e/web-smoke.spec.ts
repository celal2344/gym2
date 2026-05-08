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
      page.getByRole("button", { name: /manager manager@gymops\.dev/i }),
    ).toBeVisible();
    await expect(
      page.getByText("Sample route after login: /manager"),
    ).toBeVisible();

    await page
      .getByRole("button", { name: /admin admin@gymops\.dev/i })
      .click();
    await expect(page.getByLabel("Email")).toHaveValue("admin@gymops.dev");
    await expect(
      page.getByText("Sample route after login: /admin"),
    ).toBeVisible();
  });

  test("manager panel renders sidebar dashboard and handles unauthenticated api sections", async ({
    page,
  }) => {
    await page.goto("/manager");

    await expect(
      page.getByRole("heading", { name: "Manager operations" }),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: "Dashboard" })).toBeVisible();
    await expect(page.getByRole("cell", { name: "Mert Kaya" })).toBeVisible();
    await expect(page.getByText("Recent activity")).toBeVisible();

    await page.getByRole("button", { name: "Sessions" }).click();
    await expect(page.getByText("Session calendar")).toBeVisible();
    await expect(page.getByText("Session API unavailable")).toBeVisible();
    await expect(
      page.getByText("You need to log in before using this workspace."),
    ).toBeVisible();
  });

  test("manager sidebar switches every operational section", async ({
    page,
  }) => {
    await page.goto("/manager");

    await page.getByRole("button", { name: "Memberships" }).click();
    await expect(
      page.getByRole("heading", { name: "Membership lifecycle" }),
    ).toBeVisible();
    await expect(page.getByText("Membership API unavailable")).toBeVisible();

    await page.getByRole("button", { name: "Check-ins" }).click();
    await expect(
      page.getByRole("heading", { name: "Check-ins and attendance" }),
    ).toBeVisible();
    await expect(page.getByText("Check-in API unavailable")).toBeVisible();

    await page.getByRole("button", { name: "Programs" }).click();
    await expect(page.getByRole("heading", { name: "Programs" })).toBeVisible();
    await expect(page.getByText("Program API unavailable")).toBeVisible();

    await page.getByRole("button", { name: "Create program" }).click();
    await expect(
      page.getByRole("heading", { name: "Create program" }),
    ).toBeVisible();
    await expect(
      page.getByText("1 weeks - 1 days - 1 exercises"),
    ).toBeVisible();
    await expect(page.getByText("Exercise cues")).toBeVisible();
    await page.getByLabel("Exercise name").fill("Push-up");
    await expect(page.getByText("Push-up")).toBeVisible();
    await page.getByRole("button", { name: "Back to programs" }).click();
    await expect(page.getByRole("heading", { name: "Programs" })).toBeVisible();

    await page.getByRole("button", { name: "Dashboard" }).click();
    await expect(
      page.getByRole("heading", { name: "Manager operations" }),
    ).toBeVisible();
    await expect(page.getByText("Recent activity")).toBeVisible();
  });
});
