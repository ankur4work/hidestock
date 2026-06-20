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
import { useFetcher } from "@remix-run/react";

// Inline external-link icon so we don't depend on @shopify/polaris-icons.
function ExternalIcon() {
  return (
    <svg viewBox="0 0 20 20" focusable="false" aria-hidden="true">
      <path
        fill="currentColor"
        d="M12 3a1 1 0 0 0 0 2h1.586l-5.293 5.293a1 1 0 0 0 1.414 1.414L15 6.414V8a1 1 0 1 0 2 0V4a1 1 0 0 0-1-1h-4Z"
      />
      <path
        fill="currentColor"
        d="M5 5a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-3a1 1 0 1 0-2 0v3H5V7h3a1 1 0 0 0 0-2H5Z"
      />
    </svg>
  );
}

/**
 * SetupStepsBlock — redesigned guided setup with a numbered step tracker.
 */
export function SetupStepsBlock({
  shopDomain,
  isEmbedEnabled = false,
  embedCheckFailed = false,
  currentTheme = null,
}) {
  const fetcher = useFetcher();
  const [embedStatus, setEmbedStatus] = useState(isEmbedEnabled);
  const [checkFailed, setCheckFailed] = useState(embedCheckFailed);
  // After the merchant says they've enabled it, stop nagging even if we can't auto-detect.
  const [acknowledged, setAcknowledged] = useState(false);

  useEffect(() => {
    setEmbedStatus(isEmbedEnabled);
  }, [isEmbedEnabled]);

  useEffect(() => {
    setCheckFailed(embedCheckFailed);
  }, [embedCheckFailed]);

  useEffect(() => {
    if (fetcher.data?.embedStatus !== undefined) {
      setEmbedStatus(fetcher.data.embedStatus);
      setCheckFailed(Boolean(fetcher.data.embedCheckFailed));
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
    { done: true, title: "App installed", body: "StockMask is connected to your store." },
    {
      done: embedStatus || acknowledged,
      title: "Enable the theme embed",
      body: "Activate StockMask in your theme so it can run on the storefront.",
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

          {embedStatus ? (
            <Banner tone="success" title="Storefront active">
              <p>StockMask is live on your theme and will hide prices per your settings.</p>
            </Banner>
          ) : acknowledged ? (
            <Banner tone="info" title="Marked as enabled">
              <p>
                You confirmed the embed is on. Test it on your storefront with an
                out-of-stock product — the price should be hidden. If not, re-check the
                embed in the theme editor.
              </p>
            </Banner>
          ) : checkFailed ? (
            <>
              <Divider />
              <Banner tone="info" title="Enable the theme embed">
                <p>
                  Shopify limits apps from reading your theme, so we can’t always
                  auto-confirm this. Enable StockMask in the theme editor below — it works
                  on your storefront as soon as it’s on.
                </p>
              </Banner>
              <List type="number">
                <List.Item>Click “Open theme editor” below.</List.Item>
                <List.Item>
                  Find <strong>StockMask</strong> in the App embeds section.
                </List.Item>
                <List.Item>Toggle it on and click Save.</List.Item>
              </List>
            </>
          ) : (
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
                  Find <strong>StockMask</strong> in the App embeds section.
                </List.Item>
                <List.Item>Toggle it on and click Save.</List.Item>
                <List.Item>Return here and click “Verify”.</List.Item>
              </List>
            </>
          )}

          {currentTheme && (
            <Text variant="bodySm" tone="subdued">
              Current theme: <strong>{currentTheme.name}</strong>
            </Text>
          )}

          {!embedStatus && !acknowledged && (
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
              <Button onClick={() => setAcknowledged(true)} variant="tertiary">
                I’ve enabled it
              </Button>
            </InlineStack>
          )}

          {(embedStatus || acknowledged) && (
            <InlineStack gap="300">
              <Button
                icon={ExternalIcon}
                onClick={() => window.open(themeEditorUrl(), "_blank")}
                variant="tertiary"
              >
                Open theme editor
              </Button>
            </InlineStack>
          )}
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
