const { Parser } = require('json2csv');

exports.exportToCSV = (logs, res) => {
  const fields = ['userId.name', 'logDate', 'startTime', 'endTime', 'status', 'breakTime', 'breakCount', 'approveness'];
  const opts = { fields };
  try {
    const parser = new Parser(opts);
    const csv = parser.parse(logs);
    res.header('Content-Type', 'text/csv');
    res.attachment('report.csv');
    res.send(csv);
  } catch (err) {
    res.status(500).json({ message: 'Failed to export CSV' });
  }
};
