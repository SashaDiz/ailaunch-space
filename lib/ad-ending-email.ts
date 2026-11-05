const escapeHtml = (value: string) => String(value).replace(/[&<>"']/g, character => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
})[character]);

export function adEndingHtml(
  data: { projectName: string; endsAt: string; clicks: number },
  site: { name: string; url: string }
) {
  const endsAt = new Date(data.endsAt).toLocaleDateString('en-US', {
    timeZone: 'UTC', dateStyle: 'long',
  });
  const promote = escapeHtml(new URL('/promote', site.url).href);
  const clicks = `${data.clicks} ${data.clicks === 1 ? 'click' : 'clicks'}`;
  return `<!doctype html><html lang="en"><body style="font-family:Arial,sans-serif;color:#182033;background:#f6f7fb;padding:24px">
    <main style="max-width:600px;margin:auto;background:#fff;padding:32px;border-radius:12px">
      <p style="font-weight:bold">${escapeHtml(site.name)}</p>
      <h1 style="font-size:24px">Your ad ends on ${escapeHtml(endsAt)}</h1>
      <p>The ad for <strong>${escapeHtml(data.projectName)}</strong> has received <strong>${clicks}</strong> so far. It comes down automatically on ${escapeHtml(endsAt)}, and you won't be charged again.</p>
      <p>To keep running, book another 30 days. Spots go to whoever books first once yours ends.</p>
      <p style="margin-top:28px"><a href="${promote}" style="background:#7918ed;color:#fff;padding:12px 20px;border-radius:6px;display:inline-block;text-decoration:none">Book another 30 days</a></p>
      <p style="color:#657085;font-size:13px">This is a service notification about your ad on ${escapeHtml(site.name)}.</p>
    </main>
  </body></html>`;
}
