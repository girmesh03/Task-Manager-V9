import dayjs from "dayjs";
import { jsPDF } from "jspdf";
import { applyPlugin } from "jspdf-autotable";

applyPlugin(jsPDF);

// tasks: array of objects (each with at least _id, id, date, title, description, status, location, taskType)
// selectionModel: array of string IDs
const generatePDF = (tasks = [], selectionModel = []) => {
  // 1) Instantiate jsPDF in landscape mode
  const doc = new jsPDF({ orientation: "landscape" });

  // 2) Header‐drawing helper
  const addHeader = (doc) => {
    const pageWidth = doc.internal.pageSize.width;

    // Title
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.text("Maintenance Report", pageWidth / 2, 20, { align: "center" });

    // Left‐aligned details
    doc.setFont("helvetica", "italic");
    doc.setFontSize(12);
    doc.text("Company: Elilly International Hotel", 14, 30);
    doc.text("Department: Engineering", 14, 36);
    doc.text(`Report Date: ${new Date().toLocaleDateString()}`, 14, 42);

    // Right‐aligned details
    const rightX = pageWidth - 14;
    doc.text("Prepared by: Assistant Chief Engineer", rightX, 30, {
      align: "right",
    });
    doc.text("Report Type: Scheduled & Emergency Tasks", rightX, 36, {
      align: "right",
    });
    doc.text("Status: Internal Use Only", rightX, 42, { align: "right" });
    doc.text("Software: Task Manager Web App", rightX, 48, { align: "right" });
    doc.text("Developed by: Girmachew Zewdie", rightX, 54, { align: "right" });

    // Horizontal rule below header
    doc.setLineWidth(0.5);
    doc.line(14, 57, pageWidth - 14, 57);
  };

  // 3) Pre‐format each task:
  //    • ensure both _id and id are present
  //    • format date with dayjs
  //    • split any semicolon‐separated text in description into newline‐separated strings
  const formattedTasks = tasks.map((task) => {
    // Use task._id for the “_id” column, but also preserve task.id if it exists
    const rawId = task._id ?? task.id ?? "";
    const rawIdField = String(rawId);
    const idField = String(task.id ?? rawId);

    // Format date
    const dateField = task.date ? dayjs(task.date).format("YYYY-MM-DD") : "";

    // Split description on “;” into multiple lines
    const descriptionField = task.description
      ? task.description
          .split(";")
          .map((s) => s.trim())
          .join("\n")
      : "";

    // We only need the eight common fields:
    // _id, id, date, title, description, status, location, taskType
    return {
      _id: rawIdField,
      id: idField,
      date: dateField,
      title: String(task.title ?? ""),
      description: descriptionField,
      status: String(task.status ?? ""),
      location: String(task.location ?? ""),
      taskType: String(task.taskType ?? ""),
    };
  });

  // 4) Filter down to only those tasks whose ID is in selectionModel
  const rowsToExport = formattedTasks.filter((task) =>
    selectionModel.includes(task.id)
  );

  // If there are no selected rows, do nothing
  if (rowsToExport.length === 0) {
    console.warn(
      "No tasks match the selectionModel. PDF will not be generated."
    );
    return;
  }

  // 5) Build the table’s column definitions and body
  //    Column order: _id, id, date, title, description, status, location, taskType
  const head = [["Date", "Description", "Location"]];

  const body = rowsToExport.map((row) => [
    // row._id,
    // row.id,
    row.date,
    // row.title,
    row.description,
    row.status,
    // row.location,
    // row.taskType,
  ]);

  // 6) Draw header once, then the full table. autoTable will automatically paginate if needed.
  addHeader(doc);

  const startY = 75;

  doc.autoTable({
    startY,
    theme: "grid",
    head,
    body,
    bodyStyles: { fontSize: 14 },
    // headStyles: { fontSize: 12, halign: "center" },
    columnStyles: {
      0: { cellWidth: "auto", halign: "left", valign: "top" },
      1: {
        // cellWidth: "wrap",
        overflow: "linebreak",
        cellPadding: 3,
        halign: "left",
        valign: "top",
      },
      2: { cellWidth: "auto", halign: "center", valign: "top" },
    },
    didDrawPage: (data) => {
      // Footer: page number in bottom‐left corner
      doc.setFontSize(10);
      const pageHeight = doc.internal.pageSize.height;
      doc.text(
        `Page ${doc.internal.getNumberOfPages()}`,
        data.settings.margin.left,
        pageHeight - 10
      );
    },
  });

  // 7) Save the PDF
  doc.save("maintenance_report_all_tasks.pdf");
};

export default generatePDF;
