const cron = require('node-cron');
const { scrapeSIH } = require('./update.scraper');

exports.startScheduler = () => {

  cron.schedule('*/30 * * * *', async () => {
    console.log('Running scheduled SIH scrape...');
    try {
      await scrapeSIH();
    } catch (err) {
      console.error('Scheduled scrape failed:', err.message);
    }
  });
};