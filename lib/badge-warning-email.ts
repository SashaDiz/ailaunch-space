const escapeHtml = (value: string) => String(value).replace(/[&<>"']/g, character => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
})[character]);

export function badgeWarningHtml(data: { projectName: string; deadline: string }, site: { name: string; url: string }) {
  const deadline = new Date(data.deadline).toLocaleString('en-US', {
    timeZone: 'UTC', dateStyle: 'long', timeStyle: 'short',
  });
  const dashboard = escapeHtml(new URL('/dashboard', site.url).href);
  return `<!doctype html><html lang="en"><body style="font-family:Arial,sans-serif;color:#182033;background:#f6f7fb;padding:24px">
    <main style="max-width:600px;margin:auto;background:#fff;padding:32px;border-radius:12px">
      <p style="font-weight:bold">${escapeHtml(site.name)}</p>
      <h1 style="font-size:24px">Please restore your listing badge</h1>
      <p>Our weekly check could no longer find a qualifying badge link on the website for <strong>${escapeHtml(data.projectName)}</strong>.</p>
      <p>Your listing and dofollow link are still active. Please take one of these steps within <strong>7 days</strong>, by <strong>${escapeHtml(deadline)} UTC</strong>:</p>
      <ol>
        <li style="margin-bottom:16px"><strong>Restore the badge.</strong> Add it back to the page you originally submitted for verification, with a clickable link to ${escapeHtml(site.name)} and without <code>rel="nofollow"</code>. You can copy the badge from your dashboard.</li>
        <li><strong>Upgrade your listing to Premium.</strong> Open your dashboard, choose this listing, and select Upgrade to Premium. Once payment is completed, your dofollow link no longer depends on displaying our badge.</li>
      </ol>
      <p>At the next weekly check after the deadline, if the badge is still missing and your listing has not been upgraded to Premium, we will revoke the dofollow link and remove the listing from the public directory.</p>
      <p>If you have already restored the badge or completed a Premium upgrade, no further action is needed.</p>
      <p style="margin-top:28px"><a href="${dashboard}" style="background:#7918ed;color:#fff;padding:12px 20px;border-radius:6px;display:inline-block;text-decoration:none">Manage listing / Upgrade to Premium</a></p>
      <p style="color:#657085;font-size:13px">This is a service notification about your listing on ${escapeHtml(site.name)}.</p>
    </main>
  </body></html>`;
}
