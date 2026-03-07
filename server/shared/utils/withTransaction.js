const mongoose = require('mongoose');

/* ============================================================================
   WITH TRANSACTION HELPER
   Wraps a function in MongoDB session + transaction
============================================================================ */
module.exports = async function withTransaction(work) {

  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const result = await work(session);

    await session.commitTransaction();
    return result;

  } catch (error) {
    await session.abortTransaction();
    throw error;

  } finally {
    session.endSession();
  }
};