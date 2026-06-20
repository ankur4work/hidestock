/**
 * Utility functions for App Bridge / theme interactions
 */

/**
 * Turn any thrown value into a short, safe string for logging.
 * NEVER throws (some Shopify errors carry a ReadableStream body that JSON.stringify chokes on).
 */
export function safeErr(error) {
  try {
    if (!error) return "unknown error";
    if (typeof error === "string") return error;
    const code = error.response?.code || error.status;
    if (code) return `HTTP ${code} ${error.response?.statusText || ""}`.trim();
    return error.message || String(error);
  } catch (_) {
    return "unserializable error";
  }
}

/**
 * Generate the theme editor deep link URL for enabling the app embed
 */
export function getThemeEditorUrl(shop, extensionUuid) {
  const cleanShop = shop.replace(".myshopify.com", "");
  return `https://${cleanShop}.myshopify.com/admin/themes/current/editor?context=apps&activateAppId=${extensionUuid}/app-embed`;
}

/**
 * Generate the App embeds panel URL
 */
export function getExtensionsHubUrl(shop) {
  const cleanShop = shop.replace(".myshopify.com", "");
  return `https://${cleanShop}.myshopify.com/admin/themes/current/editor?context=apps`;
}

/**
 * Read the main theme AND whether our app embed block is enabled, in ONE GraphQL call.
 *
 * Uses the GraphQL Admin API `OnlineStoreTheme.files` to read config/settings_data.json
 * (the REST Asset API is deprecated/restricted and returns 403). Requires the read_themes
 * scope. Returns { theme, isEnabled, checkFailed } — checkFailed=true means we could not
 * read the theme (e.g. Shopify blocked it), so the UI should NOT claim it's disabled.
 */
export async function getThemeAndEmbedStatus(admin, appHandle) {
  try {
    const response = await admin.graphql(
      `#graphql
        query themeEmbedStatus {
          themes(first: 1, roles: [MAIN]) {
            nodes {
              id
              name
              files(filenames: ["config/settings_data.json"]) {
                nodes {
                  body {
                    ... on OnlineStoreThemeFileBodyText { content }
                  }
                }
              }
            }
          }
        }
      `,
    );

    const data = await response.json();

    if (data?.errors) {
      console.error("Theme embed query errors:", JSON.stringify(data.errors));
      return { theme: null, isEnabled: false, checkFailed: true };
    }

    const theme = data?.data?.themes?.nodes?.[0] || null;
    if (!theme) {
      return { theme: null, isEnabled: false, checkFailed: true };
    }

    const content = theme.files?.nodes?.[0]?.body?.content;
    if (!content) {
      // Theme readable but no settings_data content — treat as "not enabled" (not a failure).
      return { theme: { id: theme.id, name: theme.name }, isEnabled: false, checkFailed: false };
    }

    let isEnabled = false;
    try {
      const settings = JSON.parse(content);
      const blocks = settings?.current?.blocks || {};
      for (const block of Object.values(blocks)) {
        if (block?.type && block.type.includes(appHandle) && block.disabled !== true) {
          isEnabled = true;
          break;
        }
      }
    } catch (e) {
      console.error("Failed to parse settings_data.json:", e?.message || e);
      return { theme: { id: theme.id, name: theme.name }, isEnabled: false, checkFailed: true };
    }

    return { theme: { id: theme.id, name: theme.name }, isEnabled, checkFailed: false };
  } catch (error) {
    console.error("Embed status check failed:", safeErr(error));
    return { theme: null, isEnabled: false, checkFailed: true };
  }
}

/**
 * Get current theme info (name/id only).
 */
export async function getCurrentTheme(admin) {
  try {
    const response = await admin.graphql(
      `#graphql
        query getMainTheme {
          themes(first: 1, roles: [MAIN]) {
            nodes { id name role }
          }
        }
      `,
    );
    const data = await response.json();
    return data?.data?.themes?.nodes?.[0] || null;
  } catch (error) {
    return null;
  }
}

/**
 * Validate that the shop domain is properly formatted
 */
export function validateShopDomain(shop) {
  if (!shop) return false;
  const shopRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]*\.myshopify\.com$/;
  return shopRegex.test(shop);
}

/**
 * Extract shop name from full domain
 */
export function getShopName(shop) {
  return shop.replace(".myshopify.com", "");
}
