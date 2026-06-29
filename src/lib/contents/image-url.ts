/** Next/Image unoptimized — 로컬·DB API 경로 */
export function isSelfHostedContentImage(url: string): boolean {
  return url.startsWith('/uploads/') || url.startsWith('/api/content-images/');
}
