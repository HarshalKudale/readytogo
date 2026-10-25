// Reads a repo and proposes profile tags. Facts come from files; `assumed` tags are guesses the agent must confirm.
import { join } from "node:path";
import { context } from "./checks.js";
import { readText, walk } from "./util.js";

// Questions the repo can't answer; the agent asks the user (or reads docs) and records the answer with `profile`.
export const ASK = ["stores", "monetization", "data", "regions", "ai", "have", "goal"];

export function scan(root) {
  const files = walk(root);
  const c = context(root, files, new Set());
  const tags = new Set();
  const assumed = new Set();
  const found = [];
  const add = (tag, why) => {
    if (!tags.has(tag)) found.push(`${tag} ← ${why}`);
    tags.add(tag);
  };
  const guess = (tag, why) => {
    if (!tags.has(tag)) assumed.add(tag), found.push(`${tag} (assumed) ← ${why}`);
  };
  const dep = (re) => [...c.deps].find((d) => re.test(d));
  const file = (re) => files.find((f) => re.test(f));

  // Languages
  if (c.pkgs.length) add("lang:js", "package.json");
  if (file(/(^|\/)Cargo\.toml$/)) add("lang:rust", "Cargo.toml");
  if (file(/(^|\/)(pyproject\.toml|requirements\.txt|setup\.py)$/)) add("lang:python", "Python project file");
  if (file(/(^|\/)go\.mod$/)) add("lang:go", "go.mod");
  if (file(/\.csproj$/)) (add("lang:csharp", ".csproj"), add("fw:dotnet", ".csproj"));
  if (file(/(^|\/)CMakeLists\.txt$/)) add("lang:cpp", "CMakeLists.txt");
  if (file(/(^|\/)pubspec\.yaml$/)) (add("lang:dart", "pubspec.yaml"), add("fw:flutter", "pubspec.yaml"), add("ui:flutter", "pubspec.yaml"));
  if (file(/\.xcodeproj\/|(^|\/)Package\.swift$/)) (add("lang:swift", "Xcode/SwiftPM project"), add("fw:swift", "Xcode/SwiftPM project"), add("ui:native", "Xcode project"));
  if (file(/(^|\/)build\.gradle(\.kts)?$/) && file(/AndroidManifest\.xml$/)) (add("lang:kotlin", "Gradle + AndroidManifest"), add("fw:kotlin", "Gradle + AndroidManifest"), add("platform:android", "AndroidManifest.xml"), add("mobile", "AndroidManifest.xml"), add("ui:native", "Android project"));

  // JS frameworks
  const web = (fw, why, render) => (add("platform:web", why), add("ui:browser", why), add("bundle:js", why), add(fw, why), render && add(render, why));
  if (dep(/^next$/)) (web("fw:nextjs", "next dependency", "render:ssr"), add("runtime:node", "next"));
  else if (dep(/^nuxt$/)) web("fw:nuxt", "nuxt dependency", "render:ssr");
  else if (dep(/^@sveltejs\/kit$/)) web("fw:sveltekit", "@sveltejs/kit", "render:ssr");
  else if (dep(/^@react-router\/|^react-router$|^@remix-run\//) && dep(/^@react-router\/dev$|^@remix-run\/dev$/)) web("fw:react_router", "react-router framework", "render:ssr");
  else if (dep(/^astro$/)) web("fw:astro", "astro dependency", "render:static");
  else if (dep(/^@angular\/core$/)) web("fw:angular", "@angular/core", "render:spa");
  else if (dep(/^vite$/) && dep(/^(react|vue|svelte|solid-js|preact)$/) && !dep(/^electron$|^@tauri-apps|^wxt$|^plasmo$/) && !c.manifestPath) web("fw:react_vite", "vite + UI library", "render:spa");
  if (file(/(^|\/)(wp-config\.php|wp-content\/)/)) (add("platform:web", "WordPress"), add("fw:nocode", "WordPress"));
  if (file(/(^|\/)(manage\.py|artisan|Gemfile)$/) && !dep(/^next$/)) guess("fw:server_mvc", "Django/Laravel/Rails marker file");

  // Mobile and desktop
  if (dep(/^expo$|^react-native$/)) (add("fw:expo", "expo/react-native"), add("ui:react_native", "expo/react-native"), add("platform:ios", "expo/react-native"), add("platform:android", "expo/react-native"), add("mobile", "expo/react-native"), add("bundle:js", "expo"));
  if (dep(/^@capacitor\/core$/)) (add("fw:capacitor", "@capacitor/core"), add("platform:ios", "capacitor"), add("platform:android", "capacitor"), add("mobile", "capacitor"), add("ui:browser", "capacitor"));
  if (dep(/^electron$/)) (add("fw:electron", "electron dependency"), add("platform:desktop", "electron"), add("ui:browser", "electron"), add("bundle:js", "electron"));
  if (dep(/^@tauri-apps\//) || file(/(^|\/)src-tauri\/tauri\.conf\.json$/)) (add("fw:tauri", "tauri"), add("platform:desktop", "tauri"), add("lang:rust", "tauri"), add("ui:browser", "tauri"));
  if (file(/Cargo\.toml$/) && c.grep(/gpui/, (f) => /Cargo\.toml$/.test(f)).length) (add("fw:gpui", "gpui in Cargo.toml"), add("platform:desktop", "gpui"), add("ui:native", "gpui"));
  if (c.grep(/\b(eframe|egui|iced)\b/, (f) => /Cargo\.toml$/.test(f)).length) (add("fw:egui_iced", "egui/iced in Cargo.toml"), add("platform:desktop", "egui/iced"), add("ui:native", "egui/iced"));
  if (c.grep(/\bslint\b/, (f) => /Cargo\.toml$/.test(f)).length) (add("fw:slint", "slint in Cargo.toml"), add("platform:desktop", "slint"), add("ui:native", "slint"));

  // Browser extension
  if (c.manifest) {
    add("platform:extension", `${c.manifestPath} has manifest_version`);
    add("ui:browser", "extension");
    add(dep(/^wxt$/) ? "fw:wxt" : dep(/^plasmo$/) ? "fw:plasmo" : "fw:vanilla_ext", "extension manifest");
    if (c.manifest.browser_specific_settings || c.manifest.applications) guess("store:firefox_addons", "gecko settings in manifest");
  } else if (dep(/^wxt$/)) (add("platform:extension", "wxt"), add("fw:wxt", "wxt"), add("ui:browser", "wxt"));
  else if (dep(/^plasmo$/)) (add("platform:extension", "plasmo"), add("fw:plasmo", "plasmo"), add("ui:browser", "plasmo"));

  // Backend, CLI, library
  const bins = c.pkgs.some((p) => p.bin);
  if (bins || file(/(^|\/)src\/bin\/|(^|\/)cmd\/[^/]+\/main\.go$/)) guess("platform:cli", "package bin / cmd entry");
  if (dep(/^(express|fastify|hono|koa|@nestjs\/core|elysia)$/) && !tags.has("platform:web")) guess("platform:api", "server framework dependency");
  if (dep(/^(fastapi|flask|django)$/i) || c.grep(/fastapi|flask|django/i, (f) => /(requirements\.txt|pyproject\.toml)$/.test(f)).length) guess("platform:api", "Python web framework");
  if (!tags.has("platform:web") && !tags.has("platform:desktop") && !tags.has("mobile") && !tags.has("platform:extension") && c.pkgs.some((p) => p.main || p.exports || p.module) && !bins) guess("platform:library", "package main/exports and no app framework");

  // Hosting
  if (file(/(^|\/)wrangler\.(jsonc?|toml)$/)) add("host:cloudflare", "wrangler config");
  if (file(/(^|\/)vercel\.json$/) || tags.has("fw:nextjs") && dep(/^@vercel\//)) add("host:vercel", "vercel config");
  if (file(/(^|\/)netlify\.toml$/)) add("host:netlify", "netlify.toml");
  if (file(/(^|\/)(fly\.toml|render\.yaml|railway\.json|railway\.toml|Procfile)$/)) add("host:paas", "PaaS config");

  // Services and data
  if (dep(/^stripe$|^@stripe\//)) (add("svc:stripe", "stripe dependency"), add("paid", "stripe"), add("data:payments", "stripe"));
  if (dep(/^@clerk\/|^@auth0\//)) (add("svc:clerk", "Clerk/Auth0"), add("data:accounts", "Clerk/Auth0"));
  if (dep(/^@supabase\//)) (add("svc:supabase", "supabase"), guess("data:accounts", "supabase client (often auth)"));
  if (dep(/^firebase$|^firebase-admin$|^@react-native-firebase\//)) (add("svc:firebase", "firebase"), guess("data:accounts", "firebase (often auth)"));
  if (dep(/^@sentry\//) || c.grep(/sentry/i, (f) => /(Podfile|pubspec\.yaml|\.gradle(\.kts)?)$/.test(f)).length) add("svc:sentry", "sentry");
  if (dep(/posthog|mixpanel/)) (add("svc:posthog", "posthog/mixpanel"), add("data:analytics", "posthog/mixpanel"), add("has:analytics", "posthog/mixpanel"));
  if (dep(/plausible|umami|@vercel\/analytics|react-ga|gtag|@next\/third-parties/)) (add("data:analytics", "analytics package"), add("has:analytics", "analytics package"));
  if (dep(/^(next-auth|better-auth|lucia|passport|@auth\/|@supabase\/auth)/)) add("data:accounts", "auth library");
  if (dep(/^(openai|@anthropic-ai\/sdk|ai|@ai-sdk\/.+|@google\/generative-ai|@google\/genai|langchain|ollama)$/)) (add("ai:llm", "LLM SDK"), add("ai:any", "LLM SDK"), guess("ai:user_content", "LLM SDK usually receives user content"));
  if (dep(/^(resend|nodemailer|@sendgrid\/mail|postmark|@aws-sdk\/client-ses)$/)) add("data:emails", "email-sending library");

  // What they already have
  if (file(/(^|\/)(logo|icon|app-?icon)[\w-]*\.(svg|png)$/i)) add("has:logo", "logo/icon file");
  if (file(/(^|\/)(public|static)\/favicon\./)) add("has:logo", "favicon file");

  // Distribution guesses. Platforms imply a default store, but the user decides where to ship.
  if (tags.has("platform:web")) guess("store:website", "web app");
  if (tags.has("platform:ios")) guess("store:app_store", "iOS app");
  if (tags.has("platform:android")) guess("store:play_store", "Android app");
  if (tags.has("platform:extension")) guess("store:chrome_web_store", "extension");
  if (tags.has("platform:api") || tags.has("platform:library") || tags.has("platform:cli")) guess("store:github", "code project");
  if (dep(/./) && c.pkgs.some((p) => p.name && !p.private && (p.main || p.bin || p.exports))) guess("store:npm", "publishable package.json");
  if (tags.has("platform:desktop")) {
    for (const os of ["macos", "windows"]) guess(`os:${os}`, "desktop app");
    if (file(/\.icns$/)) add("os:macos", ".icns");
    if (file(/\.ico$/) && !file(/favicon\.ico$/)) add("os:windows", ".ico");
  }
  for (const t of assumed) tags.add(t);

  // Product facts for listing copy
  const pkg = c.pkgs[0] ?? {};
  const readme = readText(join(root, file(/^README(\.\w+)?$/i) ?? ""));
  const product = {
    name: c.manifest?.name?.startsWith("__MSG") ? undefined : c.manifest?.name ?? pkg.productName ?? pkg.name,
    description: c.manifest?.description ?? pkg.description ?? readme.split("\n").find((l) => l.trim() && !l.startsWith("#") && !l.startsWith("[") && !l.startsWith("!") && !l.startsWith("<"))?.trim().slice(0, 200),
    homepage: pkg.homepage,
  };
  return { tags: [...tags].sort(),assumed: [...assumed].sort(), found, product, ask: ASK, fileCount: files.length };
}
