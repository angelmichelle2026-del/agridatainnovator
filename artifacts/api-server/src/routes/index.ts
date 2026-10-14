import { Router, type IRouter } from "express";
import chatRouter from "./chat";
import healthRouter from "./health";
import searchRouter from "./search";

const router: IRouter = Router();

router.use(healthRouter);
router.use(chatRouter);
router.use(searchRouter);

export default router;
