const approvedStudentsService = require('./approvedStudents.service');
const asyncHandler = require('../../core/utils/asyncHandler');

exports.listApprovedStudents = asyncHandler(async (req, res) => {
  const result = await approvedStudentsService.listApprovedStudents(req.query, req.user);
  res.json(result);
});

exports.bulkUpload = asyncHandler(async (req, res) => {
  const collegeId = req.body.collegeId || req.user?.college;
  const result = await approvedStudentsService.bulkUploadApprovedStudents(req.file, {
    collegeId,
    uploadedBy: req.user?._id || req.user?.id
  });
  res.status(200).json(result);
});

exports.addSingle = asyncHandler(async (req, res) => {
  const collegeId = req.body.collegeId || req.user?.college;
  const result = await approvedStudentsService.addSingleApprovedStudent(
    { ...req.body, collegeId },
    req.user?._id || req.user?.id
  );
  res.status(201).json({ msg: 'Student added to approved list', student: result });
});

exports.deleteSingle = asyncHandler(async (req, res) => {
  const result = await approvedStudentsService.deleteApprovedStudent(req.params.id);
  res.json(result);
});

exports.bulkDelete = asyncHandler(async (req, res) => {
  const result = await approvedStudentsService.bulkDeleteApprovedStudents(req.body.ids);
  res.json({ msg: `${result.count} students removed from approved list`, count: result.count });
});
