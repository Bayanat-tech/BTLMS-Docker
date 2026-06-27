import * as express from "express";
import multer from "multer";
import passport from "passport";
import { deleteEmployeeFiles, editEmployeeFiles, getEmployeeFiles } from "../controllers/files.controller";
import { BTdeleteEmployeeFiles, BTeditEmployeeFiles, BTgetEmployeeFiles } from "../BT_INDIA/controllers/Btfiles.controller";
import { checkUserAuthorization } from "../middleware/checkUserAthorization";
import { uploadEmployeeAttachmentToS3 } from "../services/ociUpload.service";

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter(req, file, next) {
    next(null, true);
  },
});

router.get(
  "/employees/:request_number",
  passport.authenticate("jwt", { session: false }),
  checkUserAuthorization,
  getEmployeeFiles
);

router.put(
  "/editEmployeeFile",
  passport.authenticate("jwt", { session: false }),
  checkUserAuthorization,
  editEmployeeFiles
);

router.post(
  "/uploadEmployeeAttachment",
  passport.authenticate("jwt", { session: false }),
  checkUserAuthorization,
  upload.single("file"),
  uploadEmployeeAttachmentToS3
);

router.delete(
  "/deleteEmployeeFiles/:request_number(.+)/:sr_no",
  passport.authenticate("jwt", { session: false }),
  checkUserAuthorization,
  deleteEmployeeFiles
);

router.get(
  "/BTemployees/:request_number",
  passport.authenticate("jwt", { session: false }),
  checkUserAuthorization,
  BTgetEmployeeFiles
);

router.put(
  "/BTeditEmployeeFile",
  passport.authenticate("jwt", { session: false }),
  checkUserAuthorization,
  BTeditEmployeeFiles
);

router.delete(
  "/BTdeleteEmployeeFiles/:request_number(.+)/:sr_no",
  passport.authenticate("jwt", { session: false }),
  checkUserAuthorization,
  BTdeleteEmployeeFiles
);

export default router;
