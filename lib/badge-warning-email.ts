const escapeHtml = (value: string) => String(value).replace(/[&<>"']/g, character => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
})[character]);

type Site = { name: string; url: string };

function layout(site: Site, body: string) {
  const dashboard = escapeHtml(new URL('/dashboard', site.url).href);
  return `<!doctype html><html lang="en"><body style="font-family:Arial,sans-serif;color:#182033;background:#f6f7fb;padding:24px">
    <main style="max-width:600px;margin:auto;background:#fff;padding:32px;border-radius:12px">
      <p style="font-weight:bold">${escapeHtml(site.name)}</p>
      ${body}
      <p style="margin-top:28px"><a href="${dashboard}" style="background:#7918ed;color:#fff;padding:12px 20px;border-radius:6px;display:inline-block;text-decoration:none">Manage listing / Upgrade to Premium</a></p>
      <p style="color:#657085;font-size:13px">This is a service notification about your listing on ${escapeHtml(site.name)}.</p>
    </main>
  </body></html>`;
}

const premiumPitch = (site: Site) =>
  `<strong>Upgrade your listing to Premium ($4.99, one-time).</strong> Your dofollow link becomes permanent and no longer depends on our badge, and Premium listings are shown at the top of ${escapeHtml(site.name)}.`;

export function badgeWarningHtml(data: { projectName: string; deadline: string }, site: Site) {
  const deadline = new Date(data.deadline).toLocaleString('en-US', {
    timeZone: 'UTC', dateStyle: 'long', timeStyle: 'short',
  });
  return layout(site, `
      <h1 style="font-size:24px">Please restore your listing badge</h1>
      <p>Our daily check could no longer find a qualifying badge link on the website for <strong>${escapeHtml(data.projectName)}</strong>.</p>
      <p>Your dofollow link is still active. Please take one of these steps within <strong>7 days</strong>, by <strong>${escapeHtml(deadline)} UTC</strong>:</p>
      <ol>
        <li style="margin-bottom:16px"><strong>Restore the badge.</strong> Add it back to the page you originally verified, with a clickable link to ${escapeHtml(site.name)} and without <code>rel="nofollow"</code>. You can copy the badge from your dashboard.</li>
        <li>${premiumPitch(site)}</li>
      </ol>
      <p>If the badge is still missing after the deadline, your link will be switched to nofollow. Your listing stays online, and the dofollow link comes back automatically within a day of restoring the badge.</p>
      <p>If you have already restored the badge or upgraded to Premium, no further action is needed.</p>`);
}

export function badgeRevokedHtml(data: { projectName: string }, site: Site) {
  return layout(site, `
      <h1 style="font-size:24px">Your dofollow link was switched to nofollow</h1>
      <p>We could not find our badge on the website for <strong>${escapeHtml(data.projectName)}</strong> for 7 days, so the link from your listing is now <code>nofollow</code> and no longer passes SEO value. Your listing is still online.</p>
      <p>You can get the dofollow link back at any time:</p>
      <ol>
        <li style="margin-bottom:16px"><strong>Restore the badge.</strong> Put it back on the page you originally verified. Our daily check restores your dofollow link automatically.</li>
        <li>${premiumPitch(site)}</li>
      </ol>`);
}
