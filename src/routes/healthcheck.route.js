import { Router } from "express";
import { healthcheckController } from "../controllers/healthcheck.controller.js";

const healthRouter = Router();

healthRouter.route("/").get(healthcheckController);

export default healthRouter;
