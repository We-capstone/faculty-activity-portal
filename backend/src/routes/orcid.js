// routes/orcid.js

import express from "express";
import { fetchOrcidData } from "../controllers/orcidController.js";

const router = express.Router();

router.get("/:orcidId", fetchOrcidData);

export default router;
