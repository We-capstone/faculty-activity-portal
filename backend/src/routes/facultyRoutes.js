import express from "express";
import { authenticate } from "../middleware/authMiddleware.js";

const router = express.Router();

//Create Activity
router.post("/:module", authenticate, (req, res) => {
  res.json({
    message: "Create Activity API working",
    module: req.params.module,
    body: req.body
  });
});

//List Own Activities
router.get("/:module", authenticate, (req, res) => {
  res.json({
    message: "List Activities API working",
    module: req.params.module
  });
});

//Get Single Activity
router.get("/:module/:id", authenticate, (req, res) => {
  res.json({
    message: "Get Single Activity API working",
    module: req.params.module,
    id: req.params.id
  });
});

//Update Activity
router.put("/:module/:id", authenticate, (req, res) => {
  res.json({
    message: "Update Activity API working",
    module: req.params.module,
    id: req.params.id,
    updates: req.body
  });
});

//Delete Activity
router.delete("/:module/:id", authenticate, (req, res) => {
  res.json({
    message: "Delete Activity API working",
    module: req.params.module,
    id: req.params.id
  });
});

//Upload Proof
router.post("/:module/:id/upload-proof", authenticate, (req, res) => {
  res.json({
    message: "Upload Proof API working",
    module: req.params.module,
    id: req.params.id
  });
});

//Smart Duplicate Validation
router.post("/:module/validate", authenticate, (req, res) => {
  res.json({
    message: "Duplicate Validation API working",
    module: req.params.module,
    payload: req.body
  });
});

export default router;
