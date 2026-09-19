/**
 * Converts array of objects into CSV format and triggers a browser download.
 * @param {Array<Object>} data - Array of row objects to export.
 * @param {String} filename - Desired output filename (e.g., 'AAPL_stock_data.csv').
 * @param {Array<String>} [customHeaders] - Optional explicit order/list of headers.
 */
export const exportToCSV = (data, filename = "export.csv", customHeaders = null) => {
  if (!data || !data.length) {
    alert("No data available to export.");
    return;
  }

  // Determine headers
  const headers = customHeaders || Object.keys(data[0]);

  // Build CSV string
  const csvRows = [];
  csvRows.push(headers.join(","));

  for (const row of data) {
    const values = headers.map((header) => {
      let val = row[header] !== undefined && row[header] !== null ? row[header] : "";
      const stringVal = String(val).replace(/"/g, '""');
      return `"${stringVal}"`;
    });
    csvRows.push(values.join(","));
  }

  const csvString = csvRows.join("\n");
  const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
