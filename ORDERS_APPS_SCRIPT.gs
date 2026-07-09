// ============================================================
// A.R. GiftCollection — Orders Google Apps Script
// ============================================================
// SETUP STEPS:
// 1. Create a NEW Google Sheet at sheets.google.com
//    Name it: "AR GiftCollection Orders"
// 2. Go to Extensions → Apps Script
// 3. Delete existing code and paste ALL of this file
// 4. Click Save (Ctrl+S)
// 5. Click Deploy → New Deployment
//    - Type: Web App
//    - Execute as: Me
//    - Who has access: Anyone
// 6. Click Deploy → Copy the Web App URL
// 7. Paste that URL into main.js → const ORDERS_SCRIPT_URL = "PASTE HERE"
// ============================================================

const SHEET_NAME = "Orders";

function doPost(e) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(SHEET_NAME);

    // Create sheet with headers if it doesn't exist
    if (!sheet) {
      sheet = ss.insertSheet(SHEET_NAME);
      sheet.appendRow([
        "Timestamp",
        "Name",
        "Phone",
        "Business",
        "City",
        "Order Items",
        "Order Total",
        "Notes",
        "Status"
      ]);
      // Style header row
      const headerRange = sheet.getRange(1, 1, 1, 9);
      headerRange.setBackground("#ff6600");
      headerRange.setFontColor("#ffffff");
      headerRange.setFontWeight("bold");
      sheet.setFrozenRows(1);
    }

    // Extract form data
    const params = e.parameter;
    sheet.appendRow([
      params.Timestamp  || new Date().toLocaleString(),
      params.Name       || "",
      params.Phone      || "",
      params.Business   || "—",
      params.City       || "",
      params.OrderItems || "",
      params.OrderTotal || "",
      params.Notes      || "—",
      "New"  // Default status
    ]);

    return ContentService
      .createTextOutput(JSON.stringify({ status: "success" }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: "error", message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// Test function — run this once manually to verify it works
function testSubmit() {
  const testData = {
    parameter: {
      Timestamp:  new Date().toLocaleString(),
      Name:       "Test Customer",
      Phone:      "+91 99999 00000",
      Business:   "Test Shop",
      City:       "Mumbai, Maharashtra",
      OrderItems: "Tanjiro Figure x5 = ₹650 | Katana x2 = ₹500",
      OrderTotal: "₹1,150",
      Notes:      "Test order"
    }
  };
  doPost(testData);
  Logger.log("Test submitted — check your Orders sheet!");
}
