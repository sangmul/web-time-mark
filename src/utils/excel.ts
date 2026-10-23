export const EVENT_HEADER = ["No", "Photo", "Date", "Time", "Location"];

export async function createEventWorkbook(
  records: (string | number)[][],
): Promise<ArrayBuffer> {
  const { Workbook } = await import("exceljs");
  const workbook = new Workbook();
  const sheet = workbook.addWorksheet("Time Mark");
  sheet.addRow(EVENT_HEADER).font = { bold: true };
  records.forEach((record) => sheet.addRow(record));
  sheet.columns.forEach((column, index) => {
    const longest = Math.max(
      EVENT_HEADER[index].length,
      ...records.map((record) => String(record[index]).length),
    );
    column.width = longest + 2;
  });
  return workbook.xlsx.writeBuffer();
}
