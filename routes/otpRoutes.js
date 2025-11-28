import { Router } from "express";
const router = Router();
// import { requestOtp, verifyOtp } from "../controllers/otpController";
import sendOtp from "../utils/sendOtp";
import verifyOtp from "../utils/verifyOtp";

router.post("/send", sendOtp);
router.post("/verify", verifyOtp);

// use for real world scenarios
// router.post("/send", requestOtp);
// router.post("/verify", verifyOtp);

export default router;
