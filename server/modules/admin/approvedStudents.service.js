const ExcelJS = require('exceljs');
const { Readable } = require('stream');
const csvParser = require('csv-parser');
const PreapprovedStudent = require('../users/prepprovedStudent.model');
const College = require('../colleges/college.model');

// Helper to extract rows from CSV buffer
const parseCsvBuffer = (buffer) => {
  return new Promise((resolve, reject) => {
    const results = [];
    const stream = Readable.from(buffer);
    stream
      .pipe(csvParser())
      .on('data', (data) => results.push(data))
      .on('end', () => resolve(results))
      .on('error', (err) => reject(err));
  });
};

// Helper to extract rows from Excel buffer
const parseExcelBuffer = async (buffer) => {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);
  const worksheet = workbook.worksheets[0];
  if (!worksheet) return [];

  const rows = [];
  let headers = [];

  worksheet.eachRow((row, rowNumber) => {
    const values = Array.isArray(row.values) ? row.values.slice(1) : [];
    if (rowNumber === 1) {
      headers = values.map((h) => (h ? String(h).trim() : ''));
    } else {
      const rowObj = {};
      headers.forEach((header, idx) => {
        if (header) {
          rowObj[header] = values[idx] !== undefined && values[idx] !== null ? String(values[idx]).trim() : '';
        }
      });
      rows.push(rowObj);
    }
  });

  return rows;
};

// Extract field value flexibly
const getField = (row, fieldVariants) => {
  for (const variant of fieldVariants) {
    if (row[variant] !== undefined && row[variant] !== null && String(row[variant]).trim() !== '') {
      return String(row[variant]).trim();
    }
  }
  // Try case-insensitive matching
  const keys = Object.keys(row);
  for (const variant of fieldVariants) {
    const matchedKey = keys.find((k) => k.toLowerCase() === variant.toLowerCase());
    if (matchedKey && row[matchedKey]) {
      return String(row[matchedKey]).trim();
    }
  }
  return '';
};

const { isSuperAdmin } = require('../../core/utils/roleHelper');

exports.listApprovedStudents = async (query = {}, requester = {}) => {
  const { q = '', collegeId, page = 1, limit = 20 } = query;
  const filter = {};

  if (q) {
    filter.$or = [
      { name: new RegExp(q, 'i') },
      { rollNumber: new RegExp(q, 'i') },
      { email: new RegExp(q, 'i') },
      { department: new RegExp(q, 'i') }
    ];
  }

  // Scoping: If user is scoped to a college (College Admin / SPOC), enforce that college
  if (requester && !isSuperAdmin(requester) && requester.college) {
    filter.college = requester.college;
  } else if (collegeId && collegeId !== 'all') {
    filter.college = collegeId;
  }

  const pageNum = Math.max(parseInt(page) || 1, 1);
  const perPage = Math.min(Math.max(parseInt(limit) || 20, 1), 100);

  const [items, total] = await Promise.all([
    PreapprovedStudent.find(filter)
      .populate('college', 'name shortName')
      .populate('uploadedBy', 'name email')
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * perPage)
      .limit(perPage)
      .lean(),
    PreapprovedStudent.countDocuments(filter)
  ]);

  return {
    items,
    pagination: {
      page: pageNum,
      limit: perPage,
      total,
      pages: Math.ceil(total / perPage) || 1
    }
  };
};

exports.bulkUploadApprovedStudents = async (file, options = {}) => {
  const { collegeId, uploadedBy } = options;
  if (!file || !file.buffer) {
    throw new Error('No file uploaded');
  }

  let rawRows = [];
  const fileName = (file.originalname || '').toLowerCase();

  if (fileName.endsWith('.csv') || file.mimetype.includes('csv')) {
    rawRows = await parseCsvBuffer(file.buffer);
  } else {
    rawRows = await parseExcelBuffer(file.buffer);
  }

  if (!rawRows.length) {
    return {
      totalRows: 0,
      addedCount: 0,
      skippedCount: 0,
      errors: ['The uploaded sheet contains no readable rows or headers.']
    };
  }

  // Normalize parsed student objects
  const parsedStudents = [];
  const errors = [];

  rawRows.forEach((row, index) => {
    const rollNumber = getField(row, ['rollNumber', 'roll_number', 'Roll Number', 'Roll No', 'RollNo', 'Roll', 'collegeIdNumber', 'ID', 'Registration Number']);
    const name = getField(row, ['name', 'Name', 'Student Name', 'Full Name', 'StudentName']);
    const email = getField(row, ['email', 'Email', 'Student Email', 'Mail']);
    const department = getField(row, ['department', 'Department', 'Dept', 'Branch', 'Stream']);
    const course = getField(row, ['course', 'Course', 'Program', 'Degree']);
    const yearRaw = getField(row, ['year', 'Year', 'Academic Year', 'Semester']);
    const phone = getField(row, ['phone', 'Phone', 'Mobile', 'Contact']);

    if (!rollNumber) {
      errors.push(`Row ${index + 2}: Missing roll number`);
      return;
    }
    if (!name) {
      errors.push(`Row ${index + 2} (${rollNumber}): Missing student name`);
      return;
    }

    let year = parseInt(yearRaw);
    if (isNaN(year) || year < 1 || year > 5) year = undefined;

    parsedStudents.push({
      rollNumber: String(rollNumber).trim(),
      name: String(name).trim(),
      email: email ? String(email).trim().toLowerCase() : undefined,
      department: department || undefined,
      course: course || undefined,
      year,
      phone: phone || undefined,
      college: collegeId || undefined,
      uploadedBy: uploadedBy || undefined
    });
  });

  if (!parsedStudents.length) {
    return {
      totalRows: rawRows.length,
      addedCount: 0,
      skippedCount: 0,
      errors
    };
  }

  // Deduplication: check existing roll numbers in DB
  const rollNumbers = parsedStudents.map((s) => s.rollNumber);
  const existingQuery = { rollNumber: { $in: rollNumbers } };
  if (collegeId) {
    existingQuery.$or = [{ college: collegeId }, { college: { $exists: false } }, { college: null }];
  }

  const existingDocs = await PreapprovedStudent.find(existingQuery).select('rollNumber').lean();
  const existingRollSet = new Set(existingDocs.map((d) => d.rollNumber.toLowerCase()));

  const toInsert = [];
  const seenInBatch = new Set();
  let skippedCount = 0;

  for (const student of parsedStudents) {
    const lowerRoll = student.rollNumber.toLowerCase();
    if (existingRollSet.has(lowerRoll) || seenInBatch.has(lowerRoll)) {
      skippedCount++;
    } else {
      seenInBatch.add(lowerRoll);
      toInsert.push(student);
    }
  }

  let addedCount = 0;
  if (toInsert.length > 0) {
    const result = await PreapprovedStudent.insertMany(toInsert, { ordered: false });
    addedCount = result.length;
  }

  return {
    totalRows: rawRows.length,
    addedCount,
    skippedCount,
    errors: errors.slice(0, 20)
  };
};

exports.addSingleApprovedStudent = async (data, uploadedBy) => {
  const { rollNumber, name, email, department, course, year, phone, collegeId } = data;
  if (!rollNumber || !name) {
    throw new Error('Roll Number and Name are required');
  }

  const existing = await PreapprovedStudent.findOne({
    rollNumber: String(rollNumber).trim(),
    ...(collegeId ? { college: collegeId } : {})
  });

  if (existing) {
    throw new Error(`Student with roll number "${rollNumber}" is already in the approved list`);
  }

  const student = new PreapprovedStudent({
    rollNumber: String(rollNumber).trim(),
    name: String(name).trim(),
    email: email ? String(email).trim().toLowerCase() : undefined,
    department: department || undefined,
    course: course || undefined,
    year: parseInt(year) || undefined,
    phone: phone || undefined,
    college: collegeId || undefined,
    uploadedBy
  });

  await student.save();
  return student;
};

exports.deleteApprovedStudent = async (id) => {
  const student = await PreapprovedStudent.findByIdAndDelete(id);
  if (!student) throw new Error('Approved student record not found');
  return { msg: 'Approved student record deleted successfully' };
};

exports.bulkDeleteApprovedStudents = async (ids) => {
  if (!ids || !ids.length) throw new Error('No IDs provided');
  const res = await PreapprovedStudent.deleteMany({ _id: { $in: ids } });
  return { count: res.deletedCount };
};
