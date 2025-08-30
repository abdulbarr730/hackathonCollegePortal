const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const csv = require('csv-parser');
const PreapprovedStudent = require('./models/PreapprovedStudent'); // Adjust path if needed
require('dotenv').config(); // Make sure to load your environment variables

const importStudents = async () => {
  // Connect to your database
  await mongoose.connect(process.env.MONGO_URI);
  console.log('MongoDB Connected...');

  const results = [];
  const filePath = path.join(__dirname, 'students.csv');

  fs.createReadStream(filePath)
    .pipe(csv())
    .on('data', (data) => results.push(data))
    .on('end', async () => {
      try {
        console.log(`Found ${results.length} students in CSV file.`);
        // Using an unordered bulk write for efficiency
        const operations = results.map(student => ({
          updateOne: {
            filter: { rollNumber: student.rollNumber },
            update: { $set: student },
            upsert: true, // This will insert if not found, or update if it exists
          },
        }));

        if (operations.length > 0) {
          await PreapprovedStudent.bulkWrite(operations, { ordered: false });
          console.log('Successfully imported students!');
        }
      } catch (error) {
        console.error('Error during import:', error);
      } finally {
        // Disconnect from the database
        await mongoose.disconnect();
        console.log('MongoDB Disconnected.');
      }
    });
};

importStudents();