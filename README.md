# TabSquad

> Keep tab groups organized.

A Chromium-based browser extension that intercepts new tabs spawned from
inside a tab group and routes them somewhere else — another tab group,
another window, or out of the browser entirely via a custom URL scheme
handler.

The intended use case is to recreate, with native tab groups, the
kind of service isolation that all-in-one messenger apps (Ferdium,
Rambox, Franz, ...) provide: keep dedicated tabs (Slack, GitHub,
your CRM) together as a "squad", but force every link they spawn to
open in your everyday browsing area or a different browser.

## What TabSquad does not do

A dedicated all-in-one messenger app does more than just hold tabs
together.  TabSquad is just a browser extension, so a handful of those
features are out of reach -- here is what it does not do and what to
use instead:

- **Confirm before closing a tab.**  TabSquad cannot reliably gate
  every close: `beforeunload` only fires for tabs the user has
  interacted with, the dialog text is browser-controlled, and
  session-restored tabs are not covered.  Rely on the "Reopen closed
  tab" feature.
- **Keep tabs always loaded.**  TabSquad does nothing to stop the
  browser from discarding a sleeping tab.  Use the browser's
  memory-saver / sleeping-tabs settings and add per-site "always
  keep this site active" exceptions there.
- **Per-group storage / sessions.**  All tabs share the same
  cookies, logins, and extensions of the current browser profile.
  If you need a fully separate identity for a squad, use a separate
  browser profile (or container) for it.
- **Dedicated taskbar icon or unread-count badge.**  TabSquad shows
  one toolbar icon for itself, not one per group.  For OS-level
  presence per service, the dedicated messenger apps still win.

## Status

Early development. Not yet published to any extension store.

## Features

- Watches `chrome.webNavigation.onCreatedNavigationTarget` so it catches
  every new tab created from a link click (left/middle/⌘-click) or
  `window.open`.
- Per-rule action chosen from:
  1. **Default** — do nothing.
  2. **Rewrite URL** — rewrite the URL via a template and update the
     tab. The rewritten URL is intended to be a custom scheme handled
     by an external tool (Hammerspoon, Choosy, Finicky, …) which then
     opens the original URL wherever it belongs.
  3. **Move to the same group's tail** — keep the tab in the source
     group but push it to the end.
  4. **Move to the window's tail** — eject the tab from the group and
     pin it to the end of the current window.
  5. **Move to the next window's tail** — push the tab into a different
     normal window. Creates one if none exists.
  6. **Move to a named tab group** — find an existing group by title
     (current window first, then others), or create one in the current
     window.
- Rules are matched by tab group title and an optional URL regex
  (case-insensitive).
- Settings are stored in `chrome.storage.sync` and can be exported and
  imported as JSON.

## Permissions

`tabs`, `tabGroups`, `webNavigation`, `storage`. No `<all_urls>` host
permission is requested — URL matching and rewriting are done
in-extension.

## Develop

```sh
pnpm install
pnpm dev          # Chrome
pnpm dev:edge
pnpm build        # Chrome
pnpm build:edge
pnpm zip
```

WXT generates the manifest and bundles entrypoints. See `wxt.config.ts`
for manifest details.

## URL handler recipes

When using the **Rewrite URL** action, you'll typically point the
template at a custom scheme handled outside the browser. Examples:

### Hammerspoon (macOS)

```lua
-- ~/.hammerspoon/init.lua
-- TabSquad (running in Chrome) sends links here to open them in Edge.
hs.urlevent.bind("open-in-edge", function(_, params)
  local url = params and params.url
  if not url or url == "" then return end
  hs.task.new("/usr/bin/open", nil, { "-g", "-a", "Microsoft Edge", url }):start()
end)

-- Reverse direction: TabSquad in Edge -> Chrome.
hs.urlevent.bind("open-in-chrome", function(_, params)
  local url = params and params.url
  if not url or url == "" then return end
  hs.task.new("/usr/bin/open", nil, { "-g", "-a", "Google Chrome", url }):start()
end)
```

Default URL templates pre-filled by TabSquad:

- Running in Chrome: `hammerspoon://open-in-edge?url={urlencoded}`
- Running in Edge: `hammerspoon://open-in-chrome?url={urlencoded}`

`hs.urlevent.bind` requires lowercase event names; the templates above
follow that convention.

### Choosy / Finicky

If Choosy or Finicky is your default browser, you can use the raw
`{url}` template — they will dispatch based on their own rules.

## License

[MIT](LICENSE) (c) 2026 Akinori Musha
