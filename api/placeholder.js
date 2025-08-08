// Simple placeholder image generator API
export default async function handler(req, res) {
  const { width = 400, height = 300, text = "Image" } = req.query;

  // Set headers for SVG
  res.setHeader("Content-Type", "image/svg+xml");
  res.setHeader("Cache-Control", "public, max-age=3600");

  // Generate a simple SVG placeholder
  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#f3f4f6"/>
      <rect x="50%" y="50%" width="1" height="1" fill="#9ca3af"/>
      <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="14" fill="#6b7280" text-anchor="middle" dominant-baseline="middle">
        ${decodeURIComponent(text)}
      </text>
    </svg>
  `;

  res.status(200).send(svg);
}
