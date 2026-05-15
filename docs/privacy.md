# TabSquad privacy policy

TabSquad is a browser extension for Chrome and Edge that helps you
organize native tab groups.  It is designed to keep all of your data
inside the browser.

## What TabSquad stores

Only your TabSquad configuration: the routing rules and saved-group
snapshots you create in the options page.

That data lives in the browser's own extension storage
(`chrome.storage.sync` for the synced part of your settings, with
`chrome.storage.local` as a fallback, and `chrome.storage.local` for
the local-only rules).  When you sign in to your Chrome or Edge
profile on another device, the synced part travels with that profile
through the browser's sync service exactly the way bookmarks and
passwords do.  TabSquad itself does not operate a server.

TabSquad reads the URLs of new tabs spawned from your jailed tab
groups in order to decide what to do with them, but does not send,
log, or persist those URLs anywhere outside the regular browser
storage used for the routing decision.

When a routing rule rewrites a link to an external (non-browser)
scheme, TabSquad briefly loads its own internal handoff page in the
tab so the OS scheme handler fires reliably.  It then deletes that
handoff page's URL from the browser history so it does not appear in
the history view or the "recently closed tabs" list.  TabSquad never
reads, modifies, or transmits any other history entry.

## What TabSquad does not do

- TabSquad does not have a server.  No data is uploaded to any service
  controlled by the author.
- TabSquad does not request any host permissions, so it cannot read
  the contents of any page you visit.
- TabSquad does not collect analytics, telemetry, crash reports, or
  any other usage data.
- TabSquad does not embed third-party SDKs, advertising trackers, or
  fingerprinting code.

## Third parties

TabSquad does not transmit data to any third party.  The only places
your TabSquad data goes are:

- the local extension storage on the current device, and
- the browser vendor's profile sync service if you have it enabled in
  Chrome or Edge.

The privacy practices of those browser sync services are governed by
the respective browser vendor's privacy policy, not by TabSquad.

## Contact

If you have a question about this policy, please open an issue at
<https://github.com/knu/tabsquad/issues>.
