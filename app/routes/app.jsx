import { json } from "@remix-run/node";
import { Link, Outlet, useLoaderData, useRouteError } from "@remix-run/react";
import { boundary } from "@shopify/shopify-app-remix/server";
import { AppProvider } from "@shopify/shopify-app-remix/react";
import { AppProvider as PolarisProvider } from "@shopify/polaris";
import { NavMenu } from "@shopify/app-bridge-react";
import polarisStyles from "@shopify/polaris/build/esm/styles.css?url";
import { authenticate, PLAN_NAME, TRIAL_DAYS } from "../shopify.server";
import { safeErr } from "../utils/appBridge";

export const links = () => [{ rel: "stylesheet", href: polarisStyles }];

// Set APP_BILLING_ENABLED=false to skip the in-app Billing API gate. Required when the
// app uses Shopify "Managed Pricing" (Shopify collects payment before the app loads, and
// the app-managed Billing API is disabled → billing.check would 403). Default: enabled.
const BILLING_ENABLED = process.env.APP_BILLING_ENABLED !== "false";

export const loader = async ({ request }) => {
  // authenticate.admin throws Responses for the embedded auth/token-exchange bounce —
  // it must stay OUTSIDE try/catch so those Responses propagate to Remix.
  const { billing } = await authenticate.admin(request);

  // When billing is disabled (Managed Pricing handles payment), allow access.
  // When billing is enabled (API billing), the merchant must have an active subscription.
  let hasActivePayment = !BILLING_ENABLED;
  if (BILLING_ENABLED) {
    try {
      const res = await billing.check({ plans: [PLAN_NAME] });
      hasActivePayment = res.hasActivePayment;
    } catch (error) {
      // Fail CLOSED: if we can't confirm payment, show the plan page (never free access).
      // A 403 here means the app is on Managed Pricing in Partners — switch it to API billing.
      console.error("Billing check failed (gating as unpaid):", safeErr(error));
      hasActivePayment = false;
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

  // Only the in-app Billing API path requests a charge. When billing is disabled
  // (Shopify Managed Pricing collects payment), never call billing.request — it would 403.
  if (BILLING_ENABLED && formData.get("action") === "subscribe") {
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
