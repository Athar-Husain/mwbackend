const router = require("express").Router();
import { updateOne } from "../../models/Task";
import Comment, {
  findOneAndUpdate,
  updateOne as _updateOne,
  deleteOne,
} from "../../models/Comment";
import Attachment, {
  findOne,
  deleteOne as _deleteOne,
} from "../../models/Attachment";
import { required } from "../auth";
import { getNotNullFields, getFileName } from "../../utils";
import { upload, getImageName } from "../../config/storage";
import { upload as _upload, remove as _remove } from "../../config/s3";

const create = async (req, res, next) => {
  try {
    const { content, task } = req.body;
    const comment = new Comment({
      content,
      user: req.payload.id,
      createdAt: new Date(),
    });
    await comment.save();
    await updateOne({ _id: task }, { $push: { comments: comment._id } });
    res.status(200).json(comment);
  } catch (e) {
    next(e);
  }
};

const update = async (req, res, next) => {
  try {
    const { content } = req.body;
    const comment = await findOneAndUpdate(
      { _id: req.params.id },
      { $set: getNotNullFields({ content }) },
      { new: true }
    );
    res.status(200).json(comment);
  } catch (e) {
    next(e);
  }
};

const uploadFiles = async (req, res, next) => {
  try {
    const requests = [];
    const newReq = [];
    for (const file of req.files) {
      requests.push(_upload(file, "attachment", getImageName(file)));
    }
    const uploadedFiles = await Promise.all(requests);
    uploadedFiles.forEach((file, index) => {
      const { mimetype, size, filename } = req.files[index];
      newReq.push(
        new Attachment({
          src: file.key,
          type: mimetype,
          size,
          name: getFileName(filename),
        }).save()
      );
    });
    const savedAttachments = await Promise.all(newReq);
    await _updateOne(
      { _id: req.params.id },
      { $push: { attachments: savedAttachments.map((a) => a._id) } }
    );
    res
      .status(200)
      .json({ comment: req.params.id, uploadedAttachments: savedAttachments });
  } catch (e) {
    next(e);
  }
};

const removeAttachment = async (req, res, next) => {
  try {
    const file = await findOne({ _id: req.params.file }, { src: 1 });
    await Promise.all([
      _updateOne(
        { _id: req.params.id },
        { $pull: { attachments: req.params.file } }
      ),
      _deleteOne({ _id: req.params.file }),
      _remove(file.src),
    ]);
    res.send({ deletedFile: file._id });
  } catch (e) {
    next(e);
  }
};

const remove = async (req, res, next) => {
  try {
    await deleteOne({ _id: req.params.id });
    await updateOne(
      { comments: { $in: req.params.id } },
      { $pull: { comments: req.params.id } }
    );
    res.status(200).json({ ok: 1 });
  } catch (e) {
    next(e);
  }
};

router.post("/", required, create);
router.put("/:id", required, update);
router.put("/:id/file", [required, upload.array("file")], uploadFiles);
router.delete("/:id/file/:file", required, removeAttachment);
router.delete("/:id", required, remove);

export default router;
