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
import { getCurrentTheme, checkAppEmbedStatus } from "../utils/appBridge";
import { HeroBanner } from "../components/HeroBanner";
import { SettingsPanel } from "../components/SettingsPanel";
import { SetupStepsBlock } from "../components/SetupStepsBlock";

// Must match the Shopify app handle so the theme-embed check can find our block.
const APP_HANDLE = process.env.APP_HANDLE || "hidestock";

export const loader = async ({ request }) => {
  try {
    const { admin, session } = await authenticate.admin(request);
    const { shop } = session;

    const settings = await getSettings(shop);
    const currentTheme = await getCurrentTheme(admin);
    const embedResult = await checkAppEmbedStatus(session, admin, APP_HANDLE);

    return json({
      shop,
      settings,
      currentTheme,
      isEmbedEnabled: embedResult.isEnabled,
    });
  } catch (error) {
    console.error("Loader error:", error);
    return json({
      shop: "unknown",
      settings: null,
      currentTheme: null,
      isEmbedEnabled: false,
      error: "Failed to load: " + error.message,
    });
  }
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
        const currentTheme = await getCurrentTheme(admin);
        const embedCheck = await checkAppEmbedStatus(session, admin, APP_HANDLE);

        return json({
          success: true,
          embedStatus: embedCheck.isEnabled,
          currentTheme,
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
 */
function PlanSelectionPage({ planName, planPrice, planCurrency, trialDays }) {
  const fetcher = useFetcher();
  const isSubscribing = fetcher.state === "submitting";

  const features = [
    "Automatically hide prices for out-of-stock products",
    "Hide the Add to Cart button",
    "Custom replacement message",
    "Works on product pages, collections & featured sections",
    "Quick view modal support",
    "Real-time inventory detection",
    "Theme-agnostic — works with any Shopify theme",
  ];

  return (
    <Page>
      <TitleBar title="HideStock" />
      <BlockStack gap="500">
        <HeroBanner enabled={false} embedEnabled={false} />

        <Layout>
          <Layout.Section>
            <Card>
              <BlockStack gap="400">
                <InlineStack align="space-between" blockAlign="center">
                  <BlockStack gap="100">
                    <Text variant="headingLg" as="h2">
                      {planName} plan
                    </Text>
                    <Text variant="bodyMd" tone="subdued">
                      Full access to every HideStock feature
                    </Text>
                  </BlockStack>
                  <BlockStack gap="100">
                    <Text variant="headingXl" as="p" alignment="end">
                      ${planPrice}
                    </Text>
                    <Text variant="bodySm" tone="subdued" alignment="end">
                      {planCurrency} / month
                    </Text>
                  </BlockStack>
                </InlineStack>

                {trialDays > 0 && (
                  <Banner tone="success">
                    <p>{trialDays}-day free trial — no charge until the trial ends.</p>
                  </Banner>
                )}

                <Divider />

                <List>
                  {features.map((f) => (
                    <List.Item key={f}>{f}</List.Item>
                  ))}
                </List>

                <fetcher.Form method="post" action="/app">
                  <input type="hidden" name="action" value="subscribe" />
                  <Button
                    variant="primary"
                    size="large"
                    fullWidth
                    submit
                    loading={isSubscribing}
                  >
                    {trialDays > 0
                      ? `Start ${trialDays}-day free trial — then $${planPrice}/month`
                      : `Subscribe — $${planPrice}/month`}
                  </Button>
                </fetcher.Form>

                <Text variant="bodySm" tone="subdued" alignment="center">
                  Cancel anytime from your Shopify admin.
                </Text>
              </BlockStack>
            </Card>
          </Layout.Section>

          <Layout.Section variant="oneThird">
            <Card>
              <BlockStack gap="300">
                <Text variant="headingMd" as="h2">
                  Why HideStock?
                </Text>
                <Divider />
                <Text variant="bodyMd" tone="subdued">
                  Stop showing prices on products you can’t sell. When inventory hits
                  zero, HideStock automatically replaces the price with your custom
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
  const planName = parentData?.planName || "Pro";
  const planPrice = parentData?.planPrice || "20";
  const planCurrency = parentData?.planCurrency || "USD";
  const trialDays = parentData?.trialDays ?? 3;

  if (!hasActivePayment) {
    return (
      <PlanSelectionPage
        planName={planName}
        planPrice={planPrice}
        planCurrency={planCurrency}
        trialDays={trialDays}
      />
    );
  }

  const {
    shop,
    settings,
    currentTheme,
    isEmbedEnabled,
    error: loaderError,
  } = loaderData;

  return (
    <Page>
      <TitleBar title="HideStock" />

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
                      When a product’s inventory reaches zero, HideStock:
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
