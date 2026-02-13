/**
 * Utility to export data to CSV and trigger a download in the browser
 */
export function exportToCSV(data: any[], fileName: string) {
    if (data.length === 0) return;

    // Get headers from the first object
    const headers = Object.keys(data[0]);

    // Create CSV rows
    const csvRows = [];

    // Add header row
    csvRows.push(headers.join(","));

    // Add data rows
    for (const row of data) {
        const values = headers.map(header => {
            const val = row[header];
            // Handle null/undefined
            if (val === null || val === undefined) return "";

            // Escape double quotes and wrap in quotes if it contains commas or newlines
            const stringVal = String(val);
            if (stringVal.includes(",") || stringVal.includes('"') || stringVal.includes("\n")) {
                return `"${stringVal.replace(/"/g, '""')}"`;
            }
            return stringVal;
        });
        csvRows.push(values.join(","));
    }

    // Combine rows into a single string
    const csvString = csvRows.join("\n");

    // Create blob and trigger download
    const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${fileName}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
