/**
 * The look of every AI Launch Space email, in the site's own style: a dark
 * "launch console" (near-black canvas, mint text, orange call to action with a
 * hard offset shadow, JetBrains Mono), plus the Sponsored / Featured blocks.
 *
 * Email-client safe on purpose: table layout, inline styles, no SVG, no
 * external CSS. Pure functions (no imports), so they are unit-tested directly.
 * Every value that can come from a user is escaped here.
 */

export type EmailSite = { name: string; url: string; contactEmail: string };

export type EmailSponsor = {
  name: string;
  description?: string | null;
  logoUrl?: string | null;
  url: string;
  cta?: string | null;
};

export type EmailFeatured = {
  name: string;
  tagline?: string | null;
  logoUrl?: string | null;
  slug: string;
};

export type EmailPromo = { sponsors: EmailSponsor[]; featured: EmailFeatured[] };

const C = {
  canvas: '#07090b',
  card: '#101418',
  panel: '#151b20',
  line: '#22302b',
  text: '#d9f7ea',
  body: '#9fbcb0',
  muted: '#61786f',
  mint: '#3dffb0',
  orange: '#ff7a1a',
  ink: '#07090b',
};

const FONT = `'JetBrains Mono', 'SFMono-Regular', Menlo, Consolas, 'Liberation Mono', monospace`;

export const esc = (value: unknown) => String(value ?? '').replace(/[&<>"']/g, (ch) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
})[ch] as string);

/** Only http(s) links make it into an href; anything else becomes the site URL. */
export function safeUrl(value: unknown, fallback: string): string {
  try {
    const url = new URL(String(value));
    if (url.protocol === 'http:' || url.protocol === 'https:') return esc(url.href);
  } catch { /* fall through */ }
  return esc(fallback);
}

/** Email clients do not render SVG images, so only raster logos are used. */
const rasterLogo = (value?: string | null) =>
  value && /^https?:\/\//i.test(value) && !/\.svg(\?|#|$)/i.test(value) ? value : null;

const link = (site: EmailSite, path: string) => esc(new URL(path, site.url).href);

// ── Building blocks ────────────────────────────────────────────────────────

export function paragraph(html: string) {
  return `<p style="margin:0 0 16px;font-family:${FONT};font-size:14px;line-height:1.7;color:${C.body}">${html}</p>`;
}

export function strong(text: unknown) {
  return `<strong style="color:${C.text};font-weight:700">${esc(text)}</strong>`;
}

/** Primary orange button with the site's hard offset shadow, plus an optional text link. */
export function actions(primary: { label: string; href: string }, secondary?: { label: string; href: string }) {
  return `<table role="presentation" class="stack" cellpadding="0" cellspacing="0" border="0" style="margin:8px 0 24px">
    <tr>
      <td bgcolor="${C.orange}" style="background:${C.orange};border:2px solid ${C.ink};box-shadow:4px 4px 0 ${C.mint}">
        <a href="${primary.href}" style="display:inline-block;padding:13px 22px;font-family:${FONT};font-size:13px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;color:${C.ink};text-decoration:none">${esc(primary.label)} &rarr;</a>
      </td>
      ${secondary ? `<td style="padding-left:20px"><a href="${secondary.href}" style="font-family:${FONT};font-size:13px;color:${C.mint};text-decoration:underline">${esc(secondary.label)}</a></td>` : ''}
    </tr>
  </table>`;
}

/** Three-step status bar: done steps are mint, the current one orange, later ones dim. */
export function statusSteps(steps: string[], current: number) {
  const cells = steps.map((label, index) => {
    const done = index < current;
    const now = index === current;
    const bg = done ? C.mint : C.panel;
    const fg = done ? C.ink : now ? C.orange : C.muted;
    const border = now ? C.orange : done ? C.mint : C.line;
    return `<td width="${Math.floor(100 / steps.length)}%" bgcolor="${bg}" style="background:${bg};border:1px solid ${border};padding:10px 8px;font-family:${FONT};font-size:10px;line-height:1.4;letter-spacing:.06em;text-transform:uppercase;color:${fg};font-weight:700">
      ${String(index + 1).padStart(2, '0')} ${done ? '&#10003;' : now ? '&#9656;' : ''}<br>${esc(label)}
    </td>`;
  }).join('<td width="4" style="font-size:0">&nbsp;</td>');
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:4px 0 24px"><tr>${cells}</tr></table>`;
}

/** "key ......... value" rows, like a terminal readout. */
export function readout(rows: Array<[string, string]>) {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 24px;border-top:1px dashed ${C.line}">
    ${rows.map(([key, value]) => `<tr>
      <td style="padding:10px 0;border-bottom:1px dashed ${C.line};font-family:${FONT};font-size:12px;letter-spacing:.06em;text-transform:uppercase;color:${C.muted}">${esc(key)}</td>
      <td align="right" style="padding:10px 0;border-bottom:1px dashed ${C.line};font-family:${FONT};font-size:13px;color:${C.text}">${value}</td>
    </tr>`).join('')}
  </table>`;
}

/** Numbered list; items are trusted HTML built by the caller. */
export function steps(items: string[]) {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 20px">
    ${items.map((item, index) => `<tr>
      <td valign="top" width="34" style="padding:0 0 12px;font-family:${FONT};font-size:12px;font-weight:700;color:${C.orange}">${String(index + 1).padStart(2, '0')}</td>
      <td valign="top" style="padding:0 0 12px;font-family:${FONT};font-size:14px;line-height:1.65;color:${C.body}">${item}</td>
    </tr>`).join('')}
  </table>`;
}

/** Quoted block (e.g. reviewer feedback). */
export function quote(text: unknown) {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 24px">
    <tr><td bgcolor="${C.panel}" style="background:${C.panel};border-left:3px solid ${C.orange};padding:14px 16px;font-family:${FONT};font-size:13px;line-height:1.7;color:${C.text};white-space:pre-line">${esc(text)}</td></tr>
  </table>`;
}

/** Dashed orange box that sells Premium. */
export function premiumOffer(site: EmailSite, opts: { title: string; href: string; cta: string; price?: string }) {
  const points = [
    'Live right away: no review, no 2-week queue',
    'Dofollow link for life, no badge to keep on your site',
    `Pinned at the top of ${site.name}, seen by ~10,000 visitors a month`,
  ];
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:8px 0 24px">
    <tr><td style="border:1px dashed ${C.orange};padding:20px">
      <div style="font-family:${FONT};font-size:10px;letter-spacing:.16em;text-transform:uppercase;color:${C.orange};font-weight:700;margin-bottom:8px">&#9670; Premium ${opts.price ? `&middot; ${esc(opts.price)} once` : ''}</div>
      <div style="font-family:${FONT};font-size:16px;line-height:1.4;font-weight:700;color:${C.text};margin-bottom:12px">${esc(opts.title)}</div>
      ${points.map((point) => `<div style="font-family:${FONT};font-size:13px;line-height:1.6;color:${C.body};margin-bottom:4px"><span style="color:${C.mint}">+</span> ${esc(point)}</div>`).join('')}
      <div style="margin-top:16px"><a href="${opts.href}" style="font-family:${FONT};font-size:13px;font-weight:700;color:${C.orange};text-decoration:underline">${esc(opts.cta)} &rarr;</a></div>
    </td></tr>
  </table>`;
}

// ── Sponsored & Featured ───────────────────────────────────────────────────

function sectionLabel(text: string, right?: string) {
  return `<tr><td style="padding:0 0 10px">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
      <td style="font-family:${FONT};font-size:10px;letter-spacing:.18em;text-transform:uppercase;color:${C.muted};font-weight:700">${text}</td>
      ${right ? `<td align="right" style="font-family:${FONT};font-size:10px;letter-spacing:.06em;color:${C.muted}">${right}</td>` : ''}
    </tr></table>
  </td></tr>`;
}

function logoCell(logo: string | null, name: string, size: number) {
  if (logo) {
    return `<img src="${esc(logo)}" width="${size}" height="${size}" alt="${esc(name)}" style="display:block;width:${size}px;height:${size}px;border-radius:4px;border:1px solid ${C.line};object-fit:cover">`;
  }
  return `<div style="width:${size}px;height:${size}px;line-height:${size}px;text-align:center;background:${C.panel};border:1px solid ${C.line};border-radius:4px;font-family:${FONT};font-size:${Math.round(size / 2.4)}px;font-weight:700;color:${C.mint}">${esc(name.trim().charAt(0).toUpperCase() || '?')}</div>`;
}

export function promoBlock(site: EmailSite, promo?: EmailPromo | null) {
  const sponsors = (promo?.sponsors || []).slice(0, 3);
  const featured = (promo?.featured || []).slice(0, 3);
  const promote = link(site, '/promote');

  const sponsorRows = sponsors.map((ad) => `<tr><td style="padding:0 0 8px">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${C.panel}" style="background:${C.panel};border:1px solid ${C.line}">
      <tr>
        <td width="56" valign="top" style="padding:14px 0 14px 14px">${logoCell(rasterLogo(ad.logoUrl), ad.name, 40)}</td>
        <td valign="top" style="padding:14px">
          <div style="font-family:${FONT};font-size:14px;font-weight:700;color:${C.text}">${esc(ad.name)} <span style="font-size:9px;letter-spacing:.12em;color:${C.muted};border:1px solid ${C.line};padding:1px 4px;vertical-align:middle">AD</span></div>
          ${ad.description ? `<div style="font-family:${FONT};font-size:12px;line-height:1.55;color:${C.body};margin-top:4px">${esc(ad.description)}</div>` : ''}
          <div style="margin-top:8px"><a href="${safeUrl(ad.url, site.url)}" style="font-family:${FONT};font-size:12px;font-weight:700;color:${C.orange};text-decoration:none">${esc(ad.cta || `Visit ${ad.name}`)} &#8599;</a></div>
        </td>
      </tr>
    </table>
  </td></tr>`).join('');

  const featuredCells = featured.map((project, index) => `<td width="${Math.floor(100 / featured.length)}%" valign="top" style="padding:0 ${index === featured.length - 1 ? 0 : 4}px 0 ${index === 0 ? 0 : 4}px">
    <a href="${link(site, `/project/${encodeURIComponent(project.slug)}`)}" style="text-decoration:none;display:block;background:${C.panel};border:1px solid ${C.line};padding:12px">
      ${logoCell(rasterLogo(project.logoUrl), project.name, 32)}
      <div style="font-family:${FONT};font-size:12px;font-weight:700;color:${C.text};margin-top:8px;line-height:1.3">${esc(project.name)}</div>
      ${project.tagline ? `<div style="font-family:${FONT};font-size:11px;line-height:1.45;color:${C.muted};margin-top:4px">${esc(project.tagline.length > 60 ? `${project.tagline.slice(0, 57)}...` : project.tagline)}</div>` : ''}
    </a>
  </td>`).join('');

  const yourSlot = `<tr><td style="padding:0 0 8px">
    <a href="${promote}" style="display:block;border:1px dashed ${C.line};padding:12px;text-align:center;font-family:${FONT};font-size:12px;color:${C.mint};text-decoration:none">+ your product here &middot; book an ad spot &#8599;</a>
  </td></tr>`;

  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:8px">
    ${sponsors.length ? sectionLabel('&#9670; Sponsored') + sponsorRows : ''}
    ${yourSlot}
    ${featured.length ? `<tr><td style="padding:16px 0 0"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
      ${sectionLabel('&#9733; Featured on ' + esc(site.name), `<a href="${link(site, '/')}" style="color:${C.muted}">see all</a>`)}
      <tr><td><table role="presentation" class="stack" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>${featuredCells}</tr></table></td></tr>
    </table></td></tr>` : ''}
  </table>`;
}

// ── Page ───────────────────────────────────────────────────────────────────

export function renderEmail(opts: {
  site: EmailSite;
  /** Hidden inbox preview line. */
  preheader: string;
  /** Small orange label above the title, e.g. "Submission received". */
  eyebrow: string;
  title: string;
  /** Trusted HTML built from the helpers above. */
  body: string;
  promo?: EmailPromo | null;
  /** Why the reader got this email. */
  reason: string;
  unsubscribeUrl?: string;
}) {
  const { site } = opts;
  const home = link(site, '/');
  const logo = link(site, '/assets/favicon/android-chrome-192x192.png');
  const dither = ['&#9617;', '&#9618;', '&#9619;', '&#9608;'];
  const ditherRow = Array.from({ length: 24 }, (_, i) => dither[Math.min(3, Math.floor((i % 12) / 3))]).join('');

  return `<!doctype html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="dark light">
<meta name="supported-color-schemes" content="dark light">
<title>${esc(opts.title)}</title>
<link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&display=swap" rel="stylesheet">
<style>
  body { margin:0; padding:0; background:${C.canvas}; }
  a { color:${C.mint}; }
  @media (max-width: 620px) {
    .shell { width:100% !important; }
    .pad { padding:24px 20px !important; }
    .title { font-size:22px !important; }
    .stack, .stack td { display:block !important; width:100% !important; padding:0 0 8px !important; }
    .stack td + td { padding-top:14px !important; }
  }
</style>
</head>
<body style="margin:0;padding:0;background:${C.canvas}" bgcolor="${C.canvas}">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent">${esc(opts.preheader)}&#8199;&#65279;&#847;&#8199;&#65279;&#847;&#8199;&#65279;&#847;</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${C.canvas}" style="background:${C.canvas}">
  <tr><td align="center" style="padding:24px 12px 40px">
    <table role="presentation" class="shell" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px;max-width:600px">

      <tr><td style="padding:0 0 14px;font-family:${FONT};font-size:10px;line-height:1.6;letter-spacing:.12em;text-transform:uppercase;color:${C.muted}">
        <a href="${link(site, '/promote')}" style="color:${C.muted};text-decoration:none">+ your product here</a>
        &nbsp;<span style="color:${C.line}">/</span>&nbsp; launch &middot; list &middot; get backlinks
      </td></tr>

      <tr><td bgcolor="${C.card}" style="background:${C.card};border:1px solid ${C.line};border-radius:4px">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr><td class="pad" style="padding:28px 36px 0">
            <a href="${home}" style="text-decoration:none">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
                <td><img src="${logo}" width="30" height="30" alt="" style="display:block;border-radius:4px"></td>
                <td style="padding-left:10px;font-family:${FONT};font-size:15px;font-weight:700;color:${C.text};letter-spacing:-.01em">${esc(site.name)}</td>
              </tr></table>
            </a>
          </td></tr>
          <tr><td class="pad" style="padding:28px 36px 8px">
            <div style="font-family:${FONT};font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:${C.orange};font-weight:700;margin-bottom:12px">[ ${esc(opts.eyebrow)} ]</div>
            <h1 class="title" style="margin:0 0 18px;font-family:${FONT};font-size:26px;line-height:1.25;font-weight:700;color:${C.text};letter-spacing:-.02em">${esc(opts.title)}</h1>
            ${opts.body}
          </td></tr>
          <tr><td class="pad" style="padding:8px 36px 32px;border-top:1px solid ${C.line}">
            <div style="height:20px;line-height:20px;font-size:0">&nbsp;</div>
            ${promoBlock(site, opts.promo)}
          </td></tr>
        </table>
      </td></tr>

      <tr><td style="padding:18px 4px 0;font-family:${FONT};font-size:12px;line-height:1;color:${C.line};letter-spacing:1px">${ditherRow}</td></tr>
      <tr><td style="padding:14px 4px 0;font-family:${FONT};font-size:11px;line-height:1.7;color:${C.muted}">
        ${esc(opts.reason)}<br>
        Questions? Just reply, or write to <a href="mailto:${esc(site.contactEmail)}" style="color:${C.muted}">${esc(site.contactEmail)}</a>.<br>
        <a href="${home}" style="color:${C.muted}">${esc(site.name)}</a>
        &nbsp;&middot;&nbsp;<a href="${link(site, '/settings')}" style="color:${C.muted}">Email settings</a>
        ${opts.unsubscribeUrl ? `&nbsp;&middot;&nbsp;<a href="${esc(opts.unsubscribeUrl)}" style="color:${C.muted}">Unsubscribe</a>` : ''}
      </td></tr>

    </table>
  </td></tr>
</table>
</body>
</html>`;
}

// ══ Email content ══════════════════════════════════════════════════════════
/*
 * Content of every email AI Launch Space sends. Each one describes how the
 * site works today: free listings need the badge and wait ~2 weeks for
 * review, paid Premium goes live at once, approval publishes immediately.
 * Built from the layout helpers above.
 */

type Ctx = { site: EmailSite; promo?: EmailPromo | null };

const url = (site: EmailSite, path: string) => esc(new URL(path, site.url).href);
const PREMIUM_PRICE = '$4.99';
const REVIEW_TIME = 'about 2 weeks';
const SERVICE = (site: EmailSite) => `You received this service email because of your account on ${site.name}.`;

export function welcomeEmail(data: { userName?: string }, { site, promo }: Ctx) {
  const name = data.userName ? `, ${data.userName}` : '';
  return renderEmail({
    site, promo,
    preheader: 'Your account is ready. Two ways to get your project listed.',
    eyebrow: 'Account created',
    title: `Welcome aboard${name}`,
    body: [
      paragraph(`Your ${esc(site.name)} account is ready. There are two ways to list your AI project:`),
      readout([
        ['Free', 'add our badge &middot; review ~2 weeks'],
        ['Premium', `${PREMIUM_PRICE} once &middot; live right away`],
      ]),
      steps([
        `${strong('Free listing.')} Put our badge on your site, we verify it, and an admin reviews your listing. Review currently takes ${REVIEW_TIME}. Keep the badge up to keep your dofollow link.`,
        `${strong('Premium listing.')} Pay ${PREMIUM_PRICE} once and your project goes live immediately, with no review. The dofollow link is yours for life, no badge required, and Premium listings sit at the top of the directory.`,
      ]),
      actions({ label: 'Submit your project', href: url(site, '/submit') }, { label: 'Open dashboard', href: url(site, '/dashboard') }),
    ].join(''),
    reason: SERVICE(site),
  });
}

export function accountDeletedEmail(_data: unknown, { site, promo }: Ctx) {
  return renderEmail({
    site, promo,
    preheader: 'Your account and listings have been removed.',
    eyebrow: 'Account deleted',
    title: 'Your account has been deleted',
    body: [
      paragraph(`As requested, we deleted your ${esc(site.name)} account and every project you submitted. Your listings are no longer shown on the site, and you can no longer sign in with this account.`),
      paragraph('If this was a mistake or you change your mind later, you are welcome to create a new account at any time.'),
      actions({ label: `Visit ${site.name}`, href: url(site, '/') }),
    ].join(''),
    reason: `You received this email because your ${site.name} account was deleted.`,
  });
}

export function submissionReceivedEmail(
  data: { projectName: string; slug?: string; plan?: string; isDraft?: boolean; status?: string },
  { site, promo }: Ctx,
) {
  const project = strong(data.projectName);
  if (data.plan === 'premium' && data.status === 'live') {
    return submissionApprovedEmail({ ...data, dofollow: true }, { site, promo });
  }
  if (data.plan === 'premium') {
    return renderEmail({
      site, promo,
      preheader: 'Finish the payment and your listing goes live right away.',
      eyebrow: 'Draft saved',
      title: `${data.projectName} is one step from going live`,
      body: [
        statusSteps(['Details saved', 'Payment', 'Live'], 1),
        paragraph(`We saved the Premium listing for ${project}. Complete the ${PREMIUM_PRICE} payment and it is published immediately, with no review and a dofollow link for life.`),
        actions({ label: 'Complete payment', href: url(site, '/dashboard') }),
        paragraph(`Changed your mind? You can switch it to a free listing from your dashboard. Free listings need our badge and wait ${REVIEW_TIME} for review.`),
      ].join(''),
      reason: SERVICE(site),
    });
  }
  return renderEmail({
    site, promo,
    preheader: `Review takes ${REVIEW_TIME}. Keep the badge on your site until then.`,
    eyebrow: 'Submission received',
    title: `${data.projectName} is in the review queue`,
    body: [
      statusSteps(['Submitted', `In review · ~2 weeks`, 'Live'], 1),
      paragraph(`Thanks for submitting ${project}. We review free listings by hand, and with the current volume of submissions review takes ${REVIEW_TIME}. We will email you as soon as it is approved, or if something needs to change.`),
      steps([
        `${strong('Keep our badge on your site')} the whole time, during review and after you go live. We check it daily: a listing without the badge loses its dofollow link.`,
        `Track the status in your dashboard. You can still edit the listing while it waits.`,
      ]),
      premiumOffer(site, {
        title: 'Rather not wait 2 weeks?',
        price: PREMIUM_PRICE,
        cta: `Upgrade ${data.projectName} to Premium`,
        href: url(site, '/dashboard'),
      }),
      actions({ label: 'Open dashboard', href: url(site, '/dashboard') }),
    ].join(''),
    reason: SERVICE(site),
  });
}

export function submissionApprovedEmail(
  data: { projectName: string; slug?: string; plan?: string; dofollow?: boolean },
  { site, promo }: Ctx,
) {
  const projectUrl = data.slug ? url(site, `/project/${encodeURIComponent(data.slug)}`) : url(site, '/');
  const premium = data.plan === 'premium';
  const linkLine = data.dofollow
    ? premium
      ? 'dofollow &middot; for life'
      : 'dofollow &middot; while the badge is up'
    : 'nofollow';
  return renderEmail({
    site, promo,
    preheader: `${data.projectName} is live on ${site.name}.`,
    eyebrow: premium ? 'Premium listing live' : 'Approved',
    title: `${data.projectName} is live`,
    body: [
      statusSteps(['Submitted', premium ? 'Paid' : 'Reviewed', 'Live'], 3),
      paragraph(`${strong(data.projectName)} is now published on ${esc(site.name)} and visitors can find it in the directory.`),
      readout([
        ['Status', '<span style="color:#3dffb0">&#9679; live</span>'],
        ['Plan', premium ? 'Premium' : 'Free'],
        ['Link to your site', linkLine],
      ]),
      data.dofollow && !premium
        ? paragraph(`Your dofollow link depends on our badge. ${strong('Keep it on your site')}: we check daily, and if the badge is gone for 7 days the link switches to nofollow until you put it back.`)
        : '',
      !data.dofollow && !premium
        ? paragraph('Your link is nofollow because we could not verify our badge on your site. Add the badge and verify it from your dashboard to get a dofollow link, or upgrade to Premium.')
        : '',
      paragraph('Share your listing with your audience: upvotes and comments from visitors help it stand out.'),
      actions({ label: 'View your listing', href: projectUrl }, { label: 'Open dashboard', href: url(site, '/dashboard') }),
      !premium
        ? premiumOffer(site, {
          title: 'Want a permanent dofollow link and a spot at the top?',
          price: PREMIUM_PRICE,
          cta: 'Upgrade to Premium',
          href: url(site, '/dashboard'),
        })
        : '',
    ].join(''),
    reason: SERVICE(site),
  });
}

export function submissionDeclinedEmail(
  data: { projectName: string; rejectionReason?: string },
  { site, promo }: Ctx,
) {
  return renderEmail({
    site, promo,
    preheader: 'Your submission was not approved. Here is why and what you can do.',
    eyebrow: 'Submission update',
    title: `${data.projectName} was not approved`,
    body: [
      paragraph(`We reviewed ${strong(data.projectName)} and could not approve it in its current form. Feedback from the reviewer:`),
      quote(data.rejectionReason || 'The listing does not meet our submission policy.'),
      steps([
        `Read the <a href="${url(site, '/submission-policy')}" style="color:#3dffb0">submission policy</a> to check that the project qualifies.`,
        'Fix what the feedback mentions and submit the project again.',
        'Not sure what to change? Reply to this email and we will help.',
      ]),
      actions({ label: 'Submit again', href: url(site, '/submit') }, { label: 'Submission policy', href: url(site, '/submission-policy') }),
    ].join(''),
    reason: SERVICE(site),
  });
}

export function newsletterWelcomeEmail(
  data: { isResubscription?: boolean; unsubscribeUrl?: string },
  { site, promo }: Ctx,
) {
  return renderEmail({
    site, promo,
    preheader: 'New AI launches and tips, straight to your inbox.',
    eyebrow: data.isResubscription ? 'Welcome back' : 'Subscribed',
    title: data.isResubscription ? 'You are subscribed again' : `You are on the ${site.name} list`,
    body: [
      paragraph(`Thanks for subscribing. Now and then we will send you a short email with:`),
      steps([
        'New AI tools launching on the site, and the ones worth a look.',
        'Updates to the directory and how listing works.',
        'Practical tips for launching and promoting your own project.',
      ]),
      paragraph('No spam, and you can unsubscribe with one click at any time.'),
      actions({ label: 'Browse new launches', href: url(site, '/') }, { label: 'Submit your project', href: url(site, '/submit') }),
    ].join(''),
    reason: `You received this email because you subscribed to the ${site.name} newsletter.`,
    unsubscribeUrl: data.unsubscribeUrl,
  });
}

export function adEndingEmail(
  data: { projectName: string; endsAt: string; clicks: number },
  { site, promo }: Ctx,
) {
  const endsAt = new Date(data.endsAt).toLocaleDateString('en-US', { timeZone: 'UTC', dateStyle: 'long' });
  const clicks = `${data.clicks} ${data.clicks === 1 ? 'click' : 'clicks'}`;
  return renderEmail({
    site, promo,
    preheader: `Your ad comes down on ${endsAt}.`,
    eyebrow: 'Ad ending soon',
    title: `Your ad ends on ${endsAt}`,
    body: [
      readout([
        ['Ad', esc(data.projectName)],
        ['Clicks so far', esc(clicks)],
        ['Ends', `${esc(endsAt)}`],
      ]),
      paragraph(`The ad for ${strong(data.projectName)} comes down automatically on ${esc(endsAt)}, and you won't be charged again.`),
      paragraph('To keep it running, book another 30 days. Spots go to whoever books first once yours ends.'),
      actions({ label: 'Book another 30 days', href: url(site, '/promote') }),
    ].join(''),
    reason: `You received this service email about your ad on ${site.name}.`,
  });
}

export function badgeWarningEmail(data: { projectName: string; deadline: string }, { site, promo }: Ctx) {
  const deadline = new Date(data.deadline).toLocaleString('en-US', { timeZone: 'UTC', dateStyle: 'long', timeStyle: 'short' });
  return renderEmail({
    site, promo,
    preheader: `Restore the badge by ${deadline} UTC to keep your dofollow link.`,
    eyebrow: 'Action required',
    title: 'Please restore your listing badge',
    body: [
      paragraph(`Our daily check could no longer find a qualifying badge link on the website for ${strong(data.projectName)}. Your dofollow link is still active.`),
      readout([
        ['Badge', '<span style="color:#ff7a1a">&#9679; missing</span>'],
        ['Deadline', `${esc(deadline)} UTC`],
        ['After that', 'link becomes nofollow'],
      ]),
      paragraph('Take one of these steps within 7 days:'),
      steps([
        `${strong('Restore the badge.')} Add it back to the page you originally verified, with a clickable link to ${esc(site.name)} and without <code>rel="nofollow"</code>. You can copy the badge from your dashboard.`,
        `${strong(`Upgrade your listing to Premium (${PREMIUM_PRICE}, one-time).`)} Your dofollow link becomes permanent and no longer depends on our badge, and Premium listings are shown at the top of ${esc(site.name)}.`,
      ]),
      paragraph('If the badge is still missing after the deadline, your link will be switched to nofollow. Your listing stays online, and the dofollow link comes back automatically within a day of restoring the badge.'),
      actions({ label: 'Manage listing / Upgrade to Premium', href: url(site, '/dashboard') }),
    ].join(''),
    reason: `This is a service notification about your listing on ${site.name}.`,
  });
}

export function badgeRevokedEmail(data: { projectName: string }, { site, promo }: Ctx) {
  return renderEmail({
    site, promo,
    preheader: 'Put the badge back and the dofollow link returns automatically.',
    eyebrow: 'Link changed',
    title: 'Your dofollow link was switched to nofollow',
    body: [
      paragraph(`We could not find our badge on the website for ${strong(data.projectName)} for 7 days, so the link from your listing is now <code>nofollow</code> and no longer passes SEO value. Your listing is still online.`),
      paragraph('You can get the dofollow link back at any time:'),
      steps([
        `${strong('Restore the badge.')} Put it back on the page you originally verified. Our daily check restores your dofollow link automatically.`,
        `${strong(`Upgrade your listing to Premium (${PREMIUM_PRICE}, one-time).`)} Your dofollow link becomes permanent and no longer depends on our badge, and Premium listings are shown at the top of ${esc(site.name)}.`,
      ]),
      actions({ label: 'Manage listing / Upgrade to Premium', href: url(site, '/dashboard') }),
    ].join(''),
    reason: `This is a service notification about your listing on ${site.name}.`,
  });
}
