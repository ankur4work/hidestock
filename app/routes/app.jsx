import { json } from "@remix-run/node";
import { Link, Outlet, useLoaderData, useRouteError } from "@remix-run/react";
import { boundary } from "@shopify/shopify-app-remix/server";
import { AppProvider } from "@shopify/shopify-app-remix/react";
import { AppProvider as PolarisProvider } from "@shopify/polaris";
import { NavMenu } from "@shopify/app-bridge-react";
import polarisStyles from "@shopify/polaris/build/esm/styles.css?url";
import { authenticate, PLAN_NAME, TRIAL_DAYS } from "../shopify.server";

export const links = () => [{ rel: "stylesheet", href: polarisStyles }];

// Set APP_BILLING_ENABLED=false to skip the in-app Billing API gate. Required when the
// app uses Shopify "Managed Pricing" (Shopify collects payment before the app loads, and
// the app-managed Billing API is disabled → billing.check would 403). Default: enabled.
const BILLING_ENABLED = process.env.APP_BILLING_ENABLED !== "false";

export const loader = async ({ request }) => {
  // authenticate.admin throws Responses for the embedded auth/token-exchange bounce —
  // it must stay OUTSIDE try/catch so those Responses propagate to Remix.
  const { billing } = await authenticate.admin(request);

  // Default to allowing access; only gate when billing is enabled AND the check succeeds.
  let hasActivePayment = true;
  if (BILLING_ENABLED) {
    try {
      const res = await billing.check({ plans: [PLAN_NAME] });
      hasActivePayment = res.hasActivePayment;
    } catch (error) {
      // Fail open so a billing misconfiguration (e.g. Managed Pricing) never bricks the app.
      console.error(
        "Billing check failed (allowing access):",
        error?.body ? JSON.stringify(error.body) : error?.message || error,
      );
      hasActivePayment = true;
    }
  }

  return json({
    apiKey: process.env.SHOPIFY_API_KEY || "",
    hasActivePayment,
    planName: PLAN_NAME,
    planPrice: process.env.APP_PLAN_PRICE || "20",
    planCurrency: process.env.APP_PLAN_CURRENCY || "USD",
    trialDays: TRIAL_DAYS,
  });
};

export const action = async ({ request }) => {
  const { billing } = await authenticate.admin(request);
  const formData = await request.formData();

  if (formData.get("action") === "subscribe") {
    // Set APP_BILLING_TEST=true to create test charges (no real money) on dev/staging.
    const isTest = process.env.APP_BILLING_TEST === "true";
    await billing.request({ plan: PLAN_NAME, isTest });
  }

  return null;
};

export default function App() {
  const { apiKey } = useLoaderData();

  return (
    <AppProvider isEmbeddedApp apiKey={apiKey}>
      <NavMenu>
        <Link to="/app" rel="home">
          Dashboard
        </Link>
      </NavMenu>
      <Outlet />
    </AppProvider>
  );
}

export function ErrorBoundary() {
  return (
    <PolarisProvider i18n={{}}>
      {boundary.error(useRouteError())}
    </PolarisProvider>
  );
}

export const headers = (headersArgs) => {
  return boundary.headers(headersArgs);
};
