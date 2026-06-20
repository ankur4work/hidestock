import { json } from "@remix-run/node";
import { Link, Outlet, useLoaderData, useRouteError } from "@remix-run/react";
import { boundary } from "@shopify/shopify-app-remix/server";
import { AppProvider } from "@shopify/shopify-app-remix/react";
import { AppProvider as PolarisProvider } from "@shopify/polaris";
import { NavMenu } from "@shopify/app-bridge-react";
import polarisStyles from "@shopify/polaris/build/esm/styles.css?url";
import { authenticate } from "../shopify.server";
import { safeErr } from "../utils/appBridge";

export const links = () => [{ rel: "stylesheet", href: polarisStyles }];

// App handle (for the Shopify-hosted Managed Pricing page URL). Must match the app handle.
const APP_HANDLE = process.env.APP_HANDLE || "hidestock";

export const loader = async ({ request }) => {
  // authenticate.admin must stay OUTSIDE try/catch so its auth Responses propagate to Remix.
  const { admin, session } = await authenticate.admin(request);

  // Managed Pricing: the merchant subscribes on Shopify's hosted pricing page. We just check
  // whether they have an active subscription. Fail CLOSED so unpaid merchants see the plan page.
  let hasActivePayment = false;
  try {
    const res = await admin.graphql(`#graphql
      query {
        currentAppInstallation {
          activeSubscriptions { id name status }
        }
      }`);
    const data = await res.json();
    const subs = data?.data?.currentAppInstallation?.activeSubscriptions || [];
    hasActivePayment = subs.some((s) => s.status === "ACTIVE");
  } catch (error) {
    console.error("Subscription check failed (gating as unpaid):", safeErr(error));
    hasActivePayment = false;
  }

  const store = session.shop.replace(".myshopify.com", "");
  const pricingUrl = `https://admin.shopify.com/store/${store}/charges/${APP_HANDLE}/pricing_plans`;

  return json({
    apiKey: process.env.SHOPIFY_API_KEY || "",
    hasActivePayment,
    pricingUrl,
  });
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
