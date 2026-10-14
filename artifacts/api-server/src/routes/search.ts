import { Router, type Request, type Response } from "express";
import { searchAgriData } from "./chat-tools";

const router = Router();

router.get("/search", (req: Request, res: Response) => {
  const query = typeof req.query.q === "string" ? req.query.q.trim() : "";
  if (!query || query.length > 240) {
    res.status(400).json({
      error: "Provide a search query between 1 and 240 characters.",
    });
    return;
  }
  const rawLimit =
    typeof req.query.limit === "string" ? Number(req.query.limit) : 6;
  const limit = Number.isInteger(rawLimit)
    ? Math.max(1, Math.min(10, rawLimit))
    : 6;
  res.setHeader(
    "Cache-Control",
    "public, max-age=30, stale-while-revalidate=60",
  );
  res.json(searchAgriData(query, limit));
});

export default router;
