export default async function handler(req, res) {
  // Simple test endpoint
  if (req.method === "GET") {
    return res.status(200).json({
      message: "API is working!",
      timestamp: new Date().toISOString(),
      method: req.method,
    });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
