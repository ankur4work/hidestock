// Public privacy policy page (no Shopify auth) — used for the App Store listing URL.
const HTML = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>StockMask — Privacy Policy</title>
<style>
  body { font-family: -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif;
         color: #1f2430; line-height: 1.6; max-width: 760px; margin: 40px auto; padding: 0 20px; }
  h1 { font-size: 28px; margin-bottom: 4px; }
  h2 { font-size: 18px; margin-top: 28px; }
  .date { color: #6b7280; font-size: 14px; margin-bottom: 24px; }
  a { color: #7b2ff7; }
</style>
</head>
<body>
  <h1>StockMask Privacy Policy</h1>
  <div class="date">Effective date: June 20, 2026</div>

  <p>StockMask (&ldquo;the app,&rdquo; &ldquo;we,&rdquo; &ldquo;us&rdquo;) is a Shopify app that hides
  product prices when items are out of stock. This policy explains what information the app accesses,
  how it is used, and how it is protected.</p>

  <h2>Information we access and store</h2>
  <p>When you install StockMask on your Shopify store, the app stores your store&rsquo;s domain and the
  access credentials Shopify provides to operate the app, along with your app settings (such as whether
  price hiding is enabled, your custom message, and the pages where hiding applies). To function, the app
  reads product availability and theme information through Shopify&rsquo;s APIs. The app does not collect,
  store, or process the personal information of your customers.</p>

  <h2>How we use this information</h2>
  <p>We use the information solely to provide the app&rsquo;s functionality: hiding prices on out-of-stock
  products and showing your custom message on your storefront. We do not sell, rent, or share your
  information for advertising.</p>

  <h2>Data sharing</h2>
  <p>Your information is processed by Shopify (to run the app) and by our hosting provider, which stores
  the app&rsquo;s data on secure servers. We do not share your information with any other third parties.</p>

  <h2>Data retention and deletion</h2>
  <p>Your settings are retained while the app is installed. When you uninstall StockMask, the app
  automatically deletes your settings and session data. We also honor Shopify&rsquo;s data-removal
  requests for shops and customers.</p>

  <h2>Security</h2>
  <p>Data is stored in a secured database and transmitted over encrypted connections. Access credentials
  are stored securely and used only to operate the app on your store.</p>

  <h2>Changes to this policy</h2>
  <p>We may update this policy from time to time. The effective date above reflects the latest version.</p>

  <h2>Contact</h2>
  <p>For any questions about this policy or your data, contact us at
  <a href="mailto:ankur4worksabai@gmail.com">ankur4worksabai@gmail.com</a>.</p>
</body>
</html>`;

export const loader = async () => {
  return new Response(HTML, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
};
