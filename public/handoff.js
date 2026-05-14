// Read the target URL from the query string and open it via window.open
// so the system handler fires.  Then ask the background script to close
// this tab.  Looking up our own tab id and asking the background to do
// the close avoids the Chrome behavior where the child tab's
// openerTabId points at the user's original tab, not at us.
const target = new URLSearchParams(location.search).get('url');
if (target) {
  window.open(target, '_blank');
}
chrome.tabs.getCurrent().then((tab) => {
  if (tab && tab.id != null) {
    chrome.runtime.sendMessage({ kind: 'closeHandoffTab', tabId: tab.id });
  }
});
