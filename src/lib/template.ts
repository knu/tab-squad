export function applyTemplate(template: string, rawUrl: string): string {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    return template
      .replaceAll('{urlencoded}', encodeURIComponent(rawUrl))
      .replaceAll('{url}', rawUrl)
      .replaceAll('{host}', '')
      .replaceAll('{path}', '')
      .replaceAll('{search}', '')
      .replaceAll('{hash}', '');
  }
  return template
    .replaceAll('{urlencoded}', encodeURIComponent(rawUrl))
    .replaceAll('{url}', rawUrl)
    .replaceAll('{host}', url.host)
    .replaceAll('{path}', url.pathname)
    .replaceAll('{search}', url.search)
    .replaceAll('{hash}', url.hash);
}
