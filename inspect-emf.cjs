const ExcelJS = require("exceljs");

(async () => {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(process.argv[2]);

  for (const sheet of workbook.worksheets) {
    console.log(`\n===== SHEET: ${sheet.name} =====`);
    console.log(`Rows: ${sheet.rowCount}  Columns: ${sheet.columnCount}`);

    let found = 0;

    for (let r = 1; r <= sheet.rowCount; r++) {
      const row = sheet.getRow(r);

      const text = [];
      row.eachCell({ includeEmpty: false }, (cell, col) => {
        const value =
          cell.text ||
          (cell.value !== null && cell.value !== undefined
            ? String(cell.value)
            : "");

        if (value.trim()) {
          text.push(`${col}=[${value.trim()}]`);
        }
      });

      if (
        text.some((value) =>
          value.toLowerCase().includes("total employee errors")
        )
      ) {
        found++;

        console.log(`\n--- TOTAL BLOCK ${found} / row ${r} ---`);

        const start = Math.max(1, r - 6);
        const end = Math.min(sheet.rowCount, r + 2);

        for (let rr = start; rr <= end; rr++) {
          const inspectRow = sheet.getRow(rr);
          const cells = [];

          inspectRow.eachCell(
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
            `ROW ${rr}: ${cells.length ? cells.join(" | ") : "<EMPTY>"}`
          );
        }

        if (found >= 8) {
          break;
        }
      }
    }
  }
})();
