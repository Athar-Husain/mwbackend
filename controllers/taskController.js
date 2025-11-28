import { updateOne } from '../models/Project.model.js';
import Task, {
  findOne,
  findOneAndUpdate,
  updateOne as _updateOne,
  create as _create,
  find,
  deleteMany,
} from '../models/Task.model.js';
import Attachment, {
  findOne as _findOne,
  deleteOne,
  deleteMany as _deleteMany,
} from '../models/Attachment.model.js';
import { deleteMany as __deleteMany } from '../models/Comment.model.js';
import Todo, {
  deleteOne as _deleteOne,
  deleteMany as ___deleteMany,
} from '../../models/Todo';
import { required } from '../auth';
import { getNotNullFields, getFileName } from '../../utils';
import { upload, getImageName } from '../../config/storage';
import { upload as _upload, remove as _remove } from '../../config/s3';
import { Types } from 'mongoose';

const create = async (req, res, next) => {
  try {
    const { title, project, board, order } = req.body;
    const task = new Task({ title, board, order });
    await task.save();
    await updateOne(
      { _id: project },
      {
        $push: {
          tasks: task._id,
          history: { title: `"${title.substring(0, 10)}" task has created.` },
        },
      }
    );
    res.status(200).json(task);
  } catch (e) {
    next(e);
  }
};

const get = async (req, res, next) => {
  try {
    const data = await Promise.all([
      findOne({ _id: req.params.id })
        .populate('attachments')
        .populate('todoGroup.list')
        .populate('members', 'firstName , lastName , avatar')
        .populate('attachments', 'type , src , name , size')
        .populate({
          path: 'comments',
          populate: [
            { path: 'user', select: { firstName: 1, lastName: 1, avatar: 1 } },
            {
              path: 'attachments',
              select: { src: 1, type: 1, name: 1, size: 1 },
            },
          ],
        }),
    ]);
    res.status(200).json({ ...data[0].toJSON() });
  } catch (e) {
    next(e);
  }
};

const update = async (req, res, next) => {
  try {
    const { title, desc, board, order, endDate, members, tags, archived } =
      req.body;
    const data = getNotNullFields({
      title,
      board,
      order,
      endDate,
      tags,
      archived,
      desc,
    });
    if (Array.isArray(tags) && tags.length === 0) data['tags'] = [];
    if (Array.isArray(members)) data['members'] = members;
    const task = await findOneAndUpdate(
      { _id: req.params.id },
      { $set: data },
      { new: true }
    );
    res.status(200).json(task);
  } catch (e) {
    next(e);
  }
};

const updateMultiple = async (req, res, next) => {
  try {
    const { tasks } = req.body;
    const reqs = [];
    tasks.map((t) => t._id);
    tasks.forEach((item) =>
      reqs.push(_updateOne({ _id: item._id }, { $set: getNotNullFields(item) }))
    );
    await Promise.all(reqs);
    res.status(200).json({ ok: 1 });
  } catch (e) {
    next(e);
  }
};

const duplicate = async (req, res, next) => {
  try {
    const duplicateItem = await findOne(
      { _id: req.params.id },
      { comments: 0, todoGroup: 0, archived: 0, _id: 0, createdAt: 0 }
    );
    const _id = new Types.ObjectId();
    const item = { ...duplicateItem._doc, _id };
    const a = await _create(item);
    await updateOne({ _id: req.body.project }, { $push: { tasks: _id } });
    res.status(200).json(a);
  } catch (e) {
    next(e);
  }
};

const uploadFiles = async (req, res, next) => {
  try {
    const requests = [];
    const newReq = [];
    for (const file of req.files) {
      requests.push(_upload(file, 'attachment', getImageName(file)));
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
      .json({ task: req.params.id, uploadedAttachments: savedAttachments });
  } catch (e) {
    next(e);
  }
};

const removeAttachment = async (req, res, next) => {
  try {
    const file = await _findOne({ _id: req.params.file }, { src: 1 });
    await Promise.all([
      _updateOne(
        { _id: req.params.id },
        { $pull: { attachments: req.params.file } }
      ),
      deleteOne({ _id: req.params.file }),
      _remove(file.src),
    ]);
    res.send({ deletedFile: file._id });
  } catch (e) {
    next(e);
  }
};

const createTodoGroup = async (req, res, next) => {
  try {
    const _id = new Types.ObjectId();
    const data = { _id, title: req.body.title, list: [] };
    await _updateOne({ _id: req.params.id }, { $push: { todoGroup: data } });
    res.status(200).json(data);
  } catch (e) {
    next(e);
  }
};

const updateTodoGroup = async (req, res, next) => {
  try {
    await _updateOne(
      { _id: req.params.id, 'todoGroup._id': req.params.todoGroup },
      { $set: { 'todoGroup.$.title': req.body.title } }
    );
    res.status(200).json({ ok: 1 });
  } catch (e) {
    next(e);
  }
};

const newTodo = async (req, res, next) => {
  try {
    const todo = await new Todo({ text: req.body.text }).save();
    await _updateOne(
      { _id: req.params.id, 'todoGroup._id': req.params.todoGroup },
      { $push: { 'todoGroup.$.list': todo._id } }
    );
    res.status(200).json(todo);
  } catch (e) {
    next(e);
  }
};

const deleteTodo = async (req, res, next) => {
  try {
    await Promise.all([
      _deleteOne({ _id: req.params.todo }),
      _updateOne(
        { _id: req.params.id, 'todoGroup.list._id': req.params.todo },
        { $pull: { 'todoGroup.list.$': req.params.todo } }
      ),
    ]);
    res.status(200).json({ ok: 1 });
  } catch (e) {
    next(e);
  }
};

const deleteTodoGroup = async (req, res, next) => {
  try {
    const todoGroup = (await findOne({ _id: req.params.id })).todoGroup.find(
      (t) => t._id == req.params.todoGroup
    );
    await Promise.all([
      ...todoGroup.list.map((t) => _deleteOne({ _id: t })),
      _updateOne(
        { _id: req.params.id },
        { $pull: { todoGroup: { _id: req.params.todoGroup } } }
      ),
    ]);
    res.send({ ok: 1 });
  } catch (e) {
    next(e);
  }
};

const remove = async (req, res, next) => {
  try {
    const tasks = await find({ _id: { $in: req.body.tasks } });
    const todos = tasks
      .map((task) => task.todoGroup?.map((group) => group.list.map((t) => t)))
      .flat()
      .flat();
    const comments = tasks.map((task) => task.comments).flat();
    const attachments = tasks.map((task) => task.attachments).flat();
    await deleteMany({ _id: { $in: req.body.tasks } });
    await Promise.all([
      ___deleteMany({ _id: { $in: todos } }),
      __deleteMany({ _id: { $in: comments } }),
      _deleteMany({ _id: { $in: attachments } }),
      deleteMany({ _id: { $in: tasks.map((t) => t._id) } }),
      updateOne(
        { tasks: { $in: req.body.tasks } },
        { $pull: { tasks: { $in: req.body.tasks } } }
      ),
    ]);
    res.status(200).json({ ok: 1 });
  } catch (e) {
    next(e);
  }
};

router.post('/', required, create);
router.get('/:id', required, get);
router.put('/:id', required, update);
router.post('/:id/duplicate', required, duplicate);
router.put('/update/multi', required, updateMultiple);
router.put('/:id/file', [required, upload.array('file')], uploadFiles);
router.put('/:id/todoGroup', required, createTodoGroup);
router.put('/:id/todoGroup/:todoGroup', required, updateTodoGroup);
router.put('/:id/newTodo/:todoGroup', required, newTodo);
router.delete('/:id/todoGroup/:todoGroup', required, deleteTodoGroup);
router.delete('/:id/todo/:todo', required, deleteTodo);
router.delete('/:id/file/:file', required, removeAttachment);
router.put('/delete/tasks', required, remove);

export default router;
