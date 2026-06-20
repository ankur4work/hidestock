import { json } from "@remix-run/node";
import {
  useLoaderData,
  useRouteLoaderData,
  useFetcher,
} from "@remix-run/react";
import {
  Page,
  Layout,
  BlockStack,
  Card,
  Text,
  Banner,
  Divider,
  Box,
  InlineStack,
  Badge,
  Button,
  List,
} from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";
import {
  getSettings,
  updateSettings,
  syncSettingsToStorefront,
} from "../models/settings.server";
import {
  validateSettings,
  sanitizeSettings,
  parseFormData,
} from "../utils/validation";
import { getThemeAndEmbedStatus, safeErr } from "../utils/appBridge";
import { HeroBanner } from "../components/HeroBanner";
import { SettingsPanel } from "../components/SettingsPanel";
import { SetupStepsBlock } from "../components/SetupStepsBlock";

// Must match the Shopify app handle so the theme-embed check can find our block.
const APP_HANDLE = process.env.APP_HANDLE || "hidestock";

export const loader = async ({ request }) => {
  // Keep authenticate.admin OUTSIDE try/catch so the thrown auth/redirect Responses
  // (used by the embedded auth + token-exchange flow) propagate to Remix instead of
  // being swallowed — swallowing them breaks token/scope refresh.
  const { admin, session } = await authenticate.admin(request);
  const { shop } = session;

  // Data fetching is best-effort: a Shopify API error here must not 500 the page.
  let settings = null;
  let currentTheme = null;
  let isEmbedEnabled = false;
  let embedCheckFailed = false;
  let error = null;

  try {
    settings = await getSettings(shop);
  } catch (e) {
    console.error("getSettings failed:", e?.message || e);
    error = "Failed to load settings";
  }

  const embed = await getThemeAndEmbedStatus(admin, APP_HANDLE);
  currentTheme = embed.theme;
  isEmbedEnabled = embed.isEnabled;
  embedCheckFailed = embed.checkFailed;

  return json({ shop, settings, currentTheme, isEmbedEnabled, embedCheckFailed, error });
};

export const action = async ({ request }) => {
  const { admin, session } = await authenticate.admin(request);
  const { shop } = session;

  const formData = await request.formData();
  const actionType = formData.get("action");

  try {
    switch (actionType) {
      case "saveSettings": {
        const data = parseFormData(formData);

        const validation = validateSettings(data);
        if (!validation.isValid) {
          return json({
            success: false,
            error: "Validation failed",
            errors: validation.errors,
          });
        }

        const sanitizedData = sanitizeSettings(data);
        const updatedSettings = await updateSettings(shop, sanitizedData);

        try {
          await syncSettingsToStorefront(admin, updatedSettings);
        } catch (error) {
          console.error("Failed to sync settings metafield:", error);
        }

        return json({
          success: true,
          settings: updatedSettings,
          message: "Settings saved successfully",
        });
      }

      case "checkEmbed": {
        const embed = await getThemeAndEmbedStatus(admin, APP_HANDLE);

        return json({
          success: true,
          embedStatus: embed.isEnabled,
          embedCheckFailed: embed.checkFailed,
          currentTheme: embed.theme,
        });
      }

      default:
        return json({ success: false, error: "Unknown action" });
    }
  } catch (error) {
    console.error("Action error:", error);
    return json({ success: false, error: error.message || "An error occurred" });
  }
};

/**
 * Plan Selection Page — shown when the merchant has no active subscription.
 * Managed Pricing: the button sends them to Shopify's hosted pricing page.
 */
function PlanSelectionPage({ pricingUrl }) {
  const features = [
    "Automatically hide prices for out-of-stock products",
    "Hide the Add to Cart button",
    "Custom replacement message",
    "Works on product pages, collections & featured sections",
    "Quick view modal support",
    "Real-time inventory detection",
    "Theme-agnostic — works with any Shopify theme",
  ];

  const goToPricing = () => {
    if (pricingUrl) window.open(pricingUrl, "_top");
  };

  return (
    <Page>
      <TitleBar title="StockMask" />
      <BlockStack gap="500">
        <HeroBanner enabled={false} embedEnabled={false} />

        <Layout>
          <Layout.Section>
            <Card>
              <BlockStack gap="400">
                <BlockStack gap="100">
                  <Text variant="headingLg" as="h2">
                    Choose your plan
                  </Text>
                  <Text variant="bodyMd" tone="subdued">
                    Subscribe to start hiding prices on out-of-stock products.
                  </Text>
                </BlockStack>

                <Divider />

                <List>
                  {features.map((f) => (
                    <List.Item key={f}>{f}</List.Item>
                  ))}
                </List>

                <Button variant="primary" size="large" fullWidth onClick={goToPricing}>
                  View plans & subscribe
                </Button>

                <Text variant="bodySm" tone="subdued" alignment="center">
                  You’ll pick a plan on Shopify’s secure billing page. Cancel anytime.
                </Text>
              </BlockStack>
            </Card>
          </Layout.Section>

          <Layout.Section variant="oneThird">
            <Card>
              <BlockStack gap="300">
                <Text variant="headingMd" as="h2">
                  Why StockMask?
                </Text>
                <Divider />
                <Text variant="bodyMd" tone="subdued">
                  Stop showing prices on products you can’t sell. When inventory hits
                  zero, StockMask automatically replaces the price with your custom
                  message — and can hide Add to Cart too.
                </Text>
                <Text variant="bodyMd" tone="subdued">
                  Works instantly with any Shopify theme. No code required.
                </Text>
              </BlockStack>
            </Card>
          </Layout.Section>
        </Layout>
      </BlockStack>
    </Page>
  );
}

/**
 * Main Dashboard
 */
export default function Index() {
  const loaderData = useLoaderData();
  const parentData = useRouteLoaderData("routes/app");

  const hasActivePayment = parentData?.hasActivePayment;
  const pricingUrl = parentData?.pricingUrl;

  if (!hasActivePayment) {
    return <PlanSelectionPage pricingUrl={pricingUrl} />;
  }

  const {
    shop,
    settings,
    currentTheme,
    isEmbedEnabled,
    embedCheckFailed,
    error: loaderError,
  } = loaderData;

  return (
    <Page>
      <TitleBar title="StockMask" />

      <BlockStack gap="500">
        {loaderError && (
          <Banner title="Error loading settings" tone="critical">
            <p>{loaderError}</p>
          </Banner>
        )}

        <HeroBanner
          enabled={settings?.enabled ?? false}
          embedEnabled={isEmbedEnabled}
          shop={shop}
        />

        <Layout>
          <Layout.Section>
            <BlockStack gap="500">
              <SetupStepsBlock
                shopDomain={shop}
                isEmbedEnabled={isEmbedEnabled}
                embedCheckFailed={embedCheckFailed}
                currentTheme={currentTheme}
              />
              <SettingsPanel settings={settings} />
            </BlockStack>
          </Layout.Section>

          <Layout.Section variant="oneThird">
            <BlockStack gap="400">
              <Card>
                <BlockStack gap="300">
                  <Text variant="headingMd" as="h2">
                    How it works
                  </Text>
                  <Divider />
                  <BlockStack gap="200">
                    <Text variant="bodyMd" tone="subdued">
                      When a product’s inventory reaches zero, StockMask:
                    </Text>
                    <Box paddingInlineStart="200">
                      <BlockStack gap="100">
                        <Text variant="bodyMd" tone="subdued">• Hides the price display</Text>
                        <Text variant="bodyMd" tone="subdued">• Shows your custom message</Text>
                        <Text variant="bodyMd" tone="subdued">• Optionally hides Add to Cart</Text>
                      </BlockStack>
                    </Box>
                  </BlockStack>
                </BlockStack>
              </Card>

              <Card>
                <BlockStack gap="300">
                  <Text variant="headingMd" as="h2">
                    Supported locations
                  </Text>
                  <Divider />
                  <InlineStack gap="200" wrap>
                    <Badge tone="info">Product pages</Badge>
                    <Badge tone="info">Collections</Badge>
                    <Badge tone="info">Featured</Badge>
                    <Badge tone="info">Quick view</Badge>
                  </InlineStack>
                </BlockStack>
              </Card>

              {settings && (
                <Card>
                  <BlockStack gap="300">
                    <Text variant="headingMd" as="h2">
                      Current setup
                    </Text>
                    <Divider />
                    <InlineStack align="space-between">
                      <Text variant="bodyMd">Hide Add to Cart</Text>
                      <Badge tone={settings.hideAddToCart ? "success" : "attention"}>
                        {settings.hideAddToCart ? "Yes" : "No"}
                      </Badge>
                    </InlineStack>
                    <InlineStack align="space-between">
                      <Text variant="bodyMd">Out of stock only</Text>
                      <Badge tone={settings.hideOnlyOutOfStock ? "success" : "attention"}>
                        {settings.hideOnlyOutOfStock ? "Yes" : "No"}
                      </Badge>
                    </InlineStack>
                  </BlockStack>
                </Card>
              )}

              <Card>
                <BlockStack gap="300">
                  <Text variant="headingMd" as="h2">
                    Need help?
                  </Text>
                  <Divider />
                  <Text variant="bodyMd" tone="subdued">
                    Reach out via the app listing page on the Shopify App Store.
                  </Text>
                </BlockStack>
              </Card>
            </BlockStack>
          </Layout.Section>
        </Layout>
      </BlockStack>
    </Page>
  );
}
