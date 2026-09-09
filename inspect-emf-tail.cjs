const ExcelJS = require("exceljs");

(async () => {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(process.argv[2]);

  const sheet = workbook.worksheets[0];

  console.log(`Rows ${Math.max(1, sheet.rowCount - 20)} through ${sheet.rowCount}`);

  for (
    let r = Math.max(1, sheet.rowCount - 20);
    r <= sheet.rowCount;
    r++
  ) {
    const row = sheet.getRow(r);
    const cells = [];

    row.eachCell(
      { includeEmpty: false },
      (cell, col) => {
        const value =
          cell.text ||
          (cell.value !== null && cell.value !== undefined
            ? String(cell.value)
            : "");

        if (value.trim()) {
          cells.push(`${col}=[${value.trim()}]`);
        }
      }
    );

    console.log(
      `ROW ${r}: ${cells.length ? cells.join(" | ") : "<EMPTY>"}`
    );
  }
})();
