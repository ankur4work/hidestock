import { useState, useCallback, useEffect } from "react";
import {
  Card,
  TextField,
  Checkbox,
  Button,
  Banner,
  BlockStack,
  InlineStack,
  Text,
  Box,
  Badge,
} from "@shopify/polaris";
import { useFetcher } from "@remix-run/react";

const DEFAULTS = {
  enabled: false,
  hideAddToCart: true,
  hideOnlyOutOfStock: true,
  customMessage: "Price on Request",
  hideOnProductPage: true,
  hideOnCollection: true,
  hideOnFeatured: true,
  hideOnQuickView: true,
};

const LOCATIONS = [
  { key: "hideOnProductPage", label: "Product pages", hint: "Individual product detail pages" },
  { key: "hideOnCollection", label: "Collection pages", hint: "Product cards in collection grids" },
  { key: "hideOnFeatured", label: "Featured sections", hint: "Homepage & featured product blocks" },
  { key: "hideOnQuickView", label: "Quick view", hint: "Quick view / quick shop popups" },
];

/**
 * SettingsPanel — redesigned HideStock settings form with a built-in
 * live storefront preview that updates as the merchant edits.
 */
export function SettingsPanel({ settings }) {
  const fetcher = useFetcher();

  const [formState, setFormState] = useState({ ...DEFAULTS, ...settings });
  const [isDirty, setIsDirty] = useState(false);
  const [banner, setBanner] = useState(null);

  useEffect(() => {
    if (settings) {
      setFormState({ ...DEFAULTS, ...settings });
      setIsDirty(false);
    }
  }, [settings]);

  useEffect(() => {
    if (fetcher.data?.success) {
      setBanner({ tone: "success", message: "Settings saved successfully." });
      setIsDirty(false);
      const t = setTimeout(() => setBanner(null), 3000);
      return () => clearTimeout(t);
    } else if (fetcher.data?.error) {
      setBanner({ tone: "critical", message: fetcher.data.error });
    }
  }, [fetcher.data]);

  const set = useCallback(
    (field) => (value) => {
      setFormState((prev) => ({ ...prev, [field]: value }));
      setIsDirty(true);
    },
    [],
  );

  const handleSubmit = useCallback(() => {
    const fd = new FormData();
    fd.append("action", "saveSettings");
    Object.entries(formState).forEach(([k, v]) => {
      fd.append(k, typeof v === "boolean" ? String(v) : v);
    });
    fetcher.submit(fd, { method: "POST" });
  }, [fetcher, formState]);

  const handleReset = useCallback(() => {
    setFormState({ ...DEFAULTS, enabled: formState.enabled });
    setIsDirty(true);
  }, [formState.enabled]);

  const isSubmitting = fetcher.state === "submitting";

  return (
    <>
      <style>{PANEL_CSS}</style>

      {banner && (
        <Box paddingBlockEnd="300">
          <Banner
            title={banner.message}
            tone={banner.tone}
            onDismiss={() => setBanner(null)}
          />
        </Box>
      )}

      {/* Master switch */}
      <Card>
        <div className="hs-master">
          <div>
            <Text variant="headingMd" as="h2">
              Price hiding
            </Text>
            <Text variant="bodyMd" tone="subdued">
              The master switch for HideStock on your storefront.
            </Text>
          </div>
          <label className={`hs-switch ${formState.enabled ? "is-on" : ""}`}>
            <input
              type="checkbox"
              checked={formState.enabled}
              onChange={(e) => set("enabled")(e.target.checked)}
            />
            <span className="hs-switch__track">
              <span className="hs-switch__thumb" />
            </span>
            <span className="hs-switch__label">
              {formState.enabled ? "On" : "Off"}
            </span>
          </label>
        </div>
      </Card>

      <Box paddingBlockStart="400">
        <div className="hs-grid">
          {/* Left: settings */}
          <BlockStack gap="400">
            <Card>
              <BlockStack gap="400">
                <Text variant="headingMd" as="h2">
                  Behavior
                </Text>
                <Checkbox
                  label="Hide only when out of stock"
                  checked={formState.hideOnlyOutOfStock}
                  onChange={set("hideOnlyOutOfStock")}
                  helpText="When off, prices are hidden for every product regardless of inventory."
                />
                <Checkbox
                  label="Also hide the Add to Cart button"
                  checked={formState.hideAddToCart}
                  onChange={set("hideAddToCart")}
                  helpText="Hide the purchase button for affected products."
                />
                <TextField
                  label="Replacement message"
                  value={formState.customMessage}
                  onChange={set("customMessage")}
                  placeholder="Price on Request"
                  helpText="Shown in place of the price (max 200 characters)."
                  maxLength={200}
                  showCharacterCount
                  autoComplete="off"
                />
              </BlockStack>
            </Card>

            <Card>
              <BlockStack gap="400">
                <BlockStack gap="100">
                  <Text variant="headingMd" as="h2">
                    Where to hide prices
                  </Text>
                  <Text variant="bodyMd" tone="subdued">
                    Choose which storefront surfaces are affected.
                  </Text>
                </BlockStack>
                <div className="hs-loc-grid">
                  {LOCATIONS.map((loc) => (
                    <div
                      key={loc.key}
                      className={`hs-loc ${formState[loc.key] ? "is-active" : ""}`}
                    >
                      <Checkbox
                        label={loc.label}
                        checked={formState[loc.key]}
                        onChange={set(loc.key)}
                        helpText={loc.hint}
                      />
                    </div>
                  ))}
                </div>
              </BlockStack>
            </Card>
          </BlockStack>

          {/* Right: live preview */}
          <div className="hs-preview-col">
            <Card>
              <BlockStack gap="300">
                <InlineStack align="space-between" blockAlign="center">
                  <Text variant="headingMd" as="h2">
                    Live preview
                  </Text>
                  <Badge tone="info">Sold out</Badge>
                </InlineStack>
                <Text variant="bodyMd" tone="subdued">
                  How an out-of-stock product appears to shoppers.
                </Text>

                <div className="hs-card-mock">
                  <div className="hs-card-mock__image">
                    <span className="hs-card-mock__soldout">Sold out</span>
                  </div>
                  <div className="hs-card-mock__title">Sample Product</div>
                  <div className="hs-card-mock__price">
                    {formState.enabled ? (
                      <span className="hs-card-mock__msg">
                        {formState.customMessage || "Price on Request"}
                      </span>
                    ) : (
                      <span className="hs-card-mock__money">$49.00</span>
                    )}
                  </div>
                  {!(formState.enabled && formState.hideAddToCart) && (
                    <button type="button" className="hs-card-mock__btn" disabled>
                      Add to cart
                    </button>
                  )}
                </div>

                <Text variant="bodySm" tone="subdued" alignment="center">
                  {formState.enabled
                    ? "Price replaced with your message"
                    : "Enable the app to hide prices"}
                </Text>
              </BlockStack>
            </Card>
          </div>
        </div>
      </Box>

      {/* Save bar */}
      <Box paddingBlockStart="400">
        <Card>
          <InlineStack align="space-between" blockAlign="center">
            <Button onClick={handleReset} disabled={isSubmitting} variant="tertiary">
              Reset options
            </Button>
            <InlineStack gap="300" blockAlign="center">
              {isDirty && (
                <Text variant="bodyMd" tone="subdued">
                  Unsaved changes
                </Text>
              )}
              <Button
                variant="primary"
                onClick={handleSubmit}
                loading={isSubmitting}
                disabled={!isDirty}
              >
                Save settings
              </Button>
            </InlineStack>
          </InlineStack>
        </Card>
      </Box>
    </>
  );
}

const PANEL_CSS = `
.hs-master { display: flex; align-items: center; justify-content: space-between; gap: 16px; }
.hs-switch { display: inline-flex; align-items: center; gap: 10px; cursor: pointer; user-select: none; }
.hs-switch input { position: absolute; opacity: 0; width: 0; height: 0; }
.hs-switch__track {
  width: 52px; height: 30px; border-radius: 999px; background: #c9cdd6;
  position: relative; transition: background .2s ease;
}
.hs-switch__thumb {
  position: absolute; top: 3px; left: 3px; width: 24px; height: 24px;
  background: #fff; border-radius: 50%; transition: transform .2s ease;
  box-shadow: 0 1px 3px rgba(0,0,0,.3);
}
.hs-switch.is-on .hs-switch__track { background: #7b2ff7; }
.hs-switch.is-on .hs-switch__thumb { transform: translateX(22px); }
.hs-switch__label { font-weight: 650; font-size: 14px; min-width: 24px; }

.hs-grid { display: grid; grid-template-columns: 1.4fr 1fr; gap: 16px; align-items: start; }
@media (max-width: 900px) { .hs-grid { grid-template-columns: 1fr; } }
.hs-preview-col { position: sticky; top: 16px; }

.hs-loc-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
@media (max-width: 560px) { .hs-loc-grid { grid-template-columns: 1fr; } }
.hs-loc {
  border: 1px solid #e3e3e8; border-radius: 12px; padding: 12px 14px;
  transition: border-color .15s ease, background .15s ease;
}
.hs-loc.is-active { border-color: #b89bff; background: #f7f3ff; }

.hs-card-mock {
  border: 1px solid #e3e3e8; border-radius: 14px; padding: 14px;
  background: #fff; text-align: center;
}
.hs-card-mock__image {
  position: relative; height: 130px; border-radius: 10px;
  background: linear-gradient(135deg, #eef0f5, #dfe3ec);
  margin-bottom: 12px;
}
.hs-card-mock__soldout {
  position: absolute; top: 8px; left: 8px;
  background: #1f2430; color: #fff; font-size: 11px; font-weight: 600;
  padding: 3px 8px; border-radius: 6px;
}
.hs-card-mock__title { font-weight: 600; font-size: 14px; margin-bottom: 6px; }
.hs-card-mock__price { min-height: 24px; margin-bottom: 12px; }
.hs-card-mock__money { font-size: 16px; font-weight: 700; }
.hs-card-mock__msg {
  display: inline-block; font-size: 14px; font-weight: 600; color: #7b2ff7;
  background: #f2ecff; padding: 4px 12px; border-radius: 8px;
}
.hs-card-mock__btn {
  width: 100%; padding: 9px 0; border-radius: 9px; border: 1px solid #d4d4db;
  background: #f1f1f4; color: #8a8a93; font-weight: 600; font-size: 13px; cursor: not-allowed;
}
`;

export default SettingsPanel;
