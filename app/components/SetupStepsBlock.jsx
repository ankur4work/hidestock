import { useState, useCallback, useEffect } from "react";
import {
  Card,
  BlockStack,
  InlineStack,
  Text,
  Button,
  Banner,
  Box,
  Divider,
  List,
} from "@shopify/polaris";
import { ExternalIcon } from "@shopify/polaris-icons";
import { useFetcher } from "@remix-run/react";

/**
 * SetupStepsBlock — redesigned guided setup with a numbered step tracker.
 */
export function SetupStepsBlock({
  shopDomain,
  isEmbedEnabled = false,
  currentTheme = null,
}) {
  const fetcher = useFetcher();
  const [embedStatus, setEmbedStatus] = useState(isEmbedEnabled);

  useEffect(() => {
    setEmbedStatus(isEmbedEnabled);
  }, [isEmbedEnabled]);

  useEffect(() => {
    if (fetcher.data?.embedStatus !== undefined) {
      setEmbedStatus(fetcher.data.embedStatus);
    }
  }, [fetcher.data]);

  const handleCheckEmbed = useCallback(() => {
    const fd = new FormData();
    fd.append("action", "checkEmbed");
    fetcher.submit(fd, { method: "POST" });
  }, [fetcher]);

  const themeEditorUrl = useCallback(() => {
    const cleanShop = shopDomain?.replace(".myshopify.com", "") || "";
    return `https://${cleanShop}.myshopify.com/admin/themes/current/editor?context=apps`;
  }, [shopDomain]);

  const isChecking =
    fetcher.state === "submitting" &&
    fetcher.formData?.get("action") === "checkEmbed";

  const steps = [
    { done: true, title: "App installed", body: "HideStock is connected to your store." },
    {
      done: embedStatus,
      title: "Enable the theme embed",
      body: "Activate HideStock in your theme so it can run on the storefront.",
    },
  ];
  const completed = steps.filter((s) => s.done).length;
  const progress = Math.round((completed / steps.length) * 100);

  return (
    <>
      <style>{SETUP_CSS}</style>
      <Card>
        <BlockStack gap="400">
          <InlineStack align="space-between" blockAlign="center">
            <Text variant="headingMd" as="h2">
              Getting started
            </Text>
            <Text variant="bodyMd" tone="subdued">
              {completed} of {steps.length} done
            </Text>
          </InlineStack>

          <div className="hs-progress">
            <div className="hs-progress__bar" style={{ width: `${progress}%` }} />
          </div>

          <BlockStack gap="300">
            {steps.map((step, i) => (
              <div key={i} className={`hs-step ${step.done ? "is-done" : ""}`}>
                <div className="hs-step__num">{step.done ? "✓" : i + 1}</div>
                <div className="hs-step__text">
                  <Text variant="bodyMd" fontWeight="semibold">
                    {step.title}
                  </Text>
                  <Text variant="bodyMd" tone="subdued">
                    {step.body}
                  </Text>
                </div>
              </div>
            ))}
          </BlockStack>

          {!embedStatus && (
            <>
              <Divider />
              <Banner tone="warning" title="Action required">
                <p>
                  The theme embed must be enabled for prices to be hidden on your
                  storefront.
                </p>
              </Banner>
              <List type="number">
                <List.Item>Click “Open theme editor” below.</List.Item>
                <List.Item>
                  Find <strong>HideStock</strong> in the App embeds section.
                </List.Item>
                <List.Item>Toggle it on and click Save.</List.Item>
                <List.Item>Return here and click “Verify”.</List.Item>
              </List>
            </>
          )}

          {embedStatus && (
            <Banner tone="success" title="Storefront active">
              <p>HideStock is live on your theme and will hide prices per your settings.</p>
            </Banner>
          )}

          {currentTheme && (
            <Text variant="bodySm" tone="subdued">
              Current theme: <strong>{currentTheme.name}</strong>
            </Text>
          )}

          <InlineStack gap="300">
            <Button
              icon={ExternalIcon}
              onClick={() => window.open(themeEditorUrl(), "_blank")}
            >
              Open theme editor
            </Button>
            <Button onClick={handleCheckEmbed} loading={isChecking} variant="secondary">
              Verify
            </Button>
          </InlineStack>
        </BlockStack>
      </Card>
    </>
  );
}

const SETUP_CSS = `
.hs-progress { height: 8px; border-radius: 999px; background: #ececf1; overflow: hidden; }
.hs-progress__bar {
  height: 100%; border-radius: 999px;
  background: linear-gradient(90deg, #7b2ff7, #b06bff);
  transition: width .35s ease;
}
.hs-step { display: flex; gap: 12px; align-items: flex-start; padding: 10px 12px; border-radius: 12px; background: #fafafc; }
.hs-step.is-done { background: #f4fbf6; }
.hs-step__num {
  flex: none; width: 26px; height: 26px; border-radius: 50%;
  display: grid; place-items: center; font-size: 13px; font-weight: 700;
  background: #e7e7ee; color: #5c5f6e;
}
.hs-step.is-done .hs-step__num { background: #2bb673; color: #fff; }
.hs-step__text { display: flex; flex-direction: column; gap: 2px; }
`;

export default SetupStepsBlock;
