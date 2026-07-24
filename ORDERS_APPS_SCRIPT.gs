// ============================================================
// A.R. GiftCollection — Orders Google Apps Script v2
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
//
// EMAIL SETUP:
// - The script sends order confirmation emails automatically using Gmail
// - The email includes a QR code linking to order details
// - Make sure to authorize Gmail when prompted on first run
// ============================================================

const SHEET_NAME       = "Orders";
const INVENTORY_SHEET  = "Inventory";   // Optional: track stock here
const SENDER_EMAIL     = "argiftcollection@gmail.com"; // Change to your email

// ─── Utility: Generate short Order ID ───────────────────────
function generateOrderId() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let id = "ARG-";
  for (let i = 0; i < 8; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return id;
}

// ─── Main POST Handler ───────────────────────────────────────
function doPost(e) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(SHEET_NAME);

    // Create Orders sheet with headers if it doesn't exist
    if (!sheet) {
      sheet = ss.insertSheet(SHEET_NAME);
      sheet.appendRow([
        "Order ID",
        "Timestamp",
        "Name",
        "WhatsApp",
        "Email",
        "Business",
        "City",
        "Order Items",
        "Order Total",
        "Notes",
        "Status"
      ]);
      const headerRange = sheet.getRange(1, 1, 1, 11);
      headerRange.setBackground("#ff6600");
      headerRange.setFontColor("#ffffff");
      headerRange.setFontWeight("bold");
      sheet.setFrozenRows(1);
      // Set column widths
      sheet.setColumnWidth(1, 140);
      sheet.setColumnWidth(6, 200);
      sheet.setColumnWidth(8, 350);
    }

    const params  = e.parameter;
    const orderId = generateOrderId();

    // Append order row
    sheet.appendRow([
      orderId,
      params.Timestamp  || new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }),
      params.Name       || "",
      params.WhatsApp   || params.Phone || "",
      params.Email      || "",
      params.Business   || "—",
      params.City       || "",
      params.OrderItems || "",
      params.OrderTotal || "",
      params.Notes      || "—",
      "New"
    ]);

    // ── Update Inventory if Inventory sheet exists ──────────
    try {
      updateInventory(ss, params.OrderItems || "");
    } catch(invErr) {
      Logger.log("Inventory update skipped: " + invErr);
    }

    // ── Send Confirmation Email ─────────────────────────────
    if (params.Email && params.Email.trim() !== "") {
      sendOrderEmail(params, orderId);
    }

    return ContentService
      .createTextOutput(JSON.stringify({ status: "success", orderId: orderId }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: "error", message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// ─── Send HTML Order Confirmation Email ─────────────────────
function sendOrderEmail(params, orderId) {
  const recipientEmail = params.Email;
  const customerName   = params.Name || "Valued Customer";
  const whatsapp       = params.WhatsApp || params.Phone || "";
  const orderItems     = params.OrderItems || "";
  const orderTotal     = params.OrderTotal || "—";
  const city           = params.City || "";
  const business       = params.Business || "";
  const timestamp      = params.Timestamp || new Date().toLocaleString("en-IN");

  // Format order items as HTML table rows
  const itemRows = orderItems.split("|").map(item => {
    const trimmed = item.trim();
    if (!trimmed) return "";
    const parts = trimmed.split("=");
    const itemName = parts[0] ? parts[0].trim() : trimmed;
    const itemTotal = parts[1] ? parts[1].trim() : "";
    return `<tr>
      <td style="padding:8px 12px;border-bottom:1px solid #f0e0d0;color:#1a0a00;">${itemName}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #f0e0d0;color:#ff6600;font-weight:700;text-align:right;">${itemTotal}</td>
    </tr>`;
  }).join("");

  const subject = `✅ Order Confirmed — ${orderId} | A.R. GiftCollection`;

  const htmlBody = `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:40px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
        
        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#cc3300,#ff6600,#ff8c00);padding:32px 40px;text-align:center;">
            <h1 style="margin:0;color:#fff;font-size:26px;font-weight:800;letter-spacing:-0.5px;">
              A.R. GiftCollection
            </h1>
            <p style="margin:6px 0 0;color:rgba(255,255,255,0.85);font-size:13px;text-transform:uppercase;letter-spacing:2px;">
              Wholesale Order Confirmation
            </p>
          </td>
        </tr>

        <!-- Order ID Banner -->
        <tr>
          <td style="background:#fff7f0;border-bottom:2px solid rgba(255,102,0,0.15);padding:20px 40px;text-align:center;">
            <p style="margin:0;font-size:13px;color:#a07050;text-transform:uppercase;letter-spacing:1.5px;">Your Order Reference</p>
            <p style="margin:6px 0 0;font-size:28px;font-weight:800;color:#ff6600;letter-spacing:2px;font-family:monospace;">${orderId}</p>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:36px 40px;">
            <p style="margin:0 0 24px;font-size:16px;color:#1a0a00;line-height:1.6;">
              Dear <strong>${customerName}</strong>,<br>
              Thank you for your wholesale order! We have received your request and our team will confirm the details on <strong>WhatsApp</strong> shortly.
            </p>

            <!-- Customer Details -->
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#fff7f0;border-radius:10px;margin-bottom:28px;overflow:hidden;border:1px solid rgba(255,102,0,0.15);">
              <tr><td colspan="2" style="padding:12px 16px;background:rgba(255,102,0,0.08);font-weight:700;font-size:12px;text-transform:uppercase;letter-spacing:1px;color:#6b3a1f;">Customer Details</td></tr>
              <tr>
                <td style="padding:8px 16px;color:#6b3a1f;font-size:13px;width:40%;">WhatsApp / Phone</td>
                <td style="padding:8px 16px;color:#1a0a00;font-weight:600;">${whatsapp || "—"}</td>
              </tr>
              ${business ? `<tr><td style="padding:8px 16px;color:#6b3a1f;font-size:13px;">Business / Shop</td><td style="padding:8px 16px;color:#1a0a00;font-weight:600;">${business}</td></tr>` : ""}
              <tr>
                <td style="padding:8px 16px;color:#6b3a1f;font-size:13px;">Delivery City</td>
                <td style="padding:8px 16px;color:#1a0a00;font-weight:600;">${city || "—"}</td>
              </tr>
              <tr>
                <td style="padding:8px 16px;color:#6b3a1f;font-size:13px;">Order Time</td>
                <td style="padding:8px 16px;color:#1a0a00;font-weight:600;">${timestamp}</td>
              </tr>
            </table>

            <!-- Order Items -->
            <p style="margin:0 0 10px;font-weight:700;font-size:15px;color:#1a0a00;">Order Summary</p>
            <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid rgba(255,102,0,0.15);border-radius:10px;overflow:hidden;margin-bottom:28px;">
              <tr style="background:rgba(255,102,0,0.08);">
                <th style="padding:10px 12px;text-align:left;font-size:12px;color:#6b3a1f;text-transform:uppercase;letter-spacing:0.5px;">Item</th>
                <th style="padding:10px 12px;text-align:right;font-size:12px;color:#6b3a1f;text-transform:uppercase;letter-spacing:0.5px;">Subtotal</th>
              </tr>
              ${itemRows}
              <tr style="background:#fff7f0;">
                <td style="padding:12px;font-weight:800;font-size:16px;color:#1a0a00;">Grand Total</td>
                <td style="padding:12px;font-weight:800;font-size:20px;color:#ff6600;text-align:right;">${orderTotal}</td>
              </tr>
            </table>

            <!-- Payment QR Code -->
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td align="center" style="padding:20px;background:#fff7f0;border-radius:12px;border:1px solid rgba(255,102,0,0.15);">
                  <p style="margin:0 0 12px;font-size:14px;color:#1a0a00;font-weight:700;">💳 Scan QR Code to Pay</p>
                  <img src="https://raw.githubusercontent.com/yoshika02/argiftenterprises/main/payment_qr.jpeg" alt="Payment QR Code" width="200" style="display:block;margin:0 auto;border-radius:8px;border:3px solid #ff6600;">
                  <p style="margin:12px 0 0;font-size:12px;color:#a07050;font-weight:600;">Please share a screenshot of the payment on WhatsApp after paying.</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- WhatsApp CTA -->
        <tr>
          <td style="padding:0 40px 36px;text-align:center;">
            <a href="https://wa.me/918585979398?text=Hi%20A.R.%20GiftCollection%2C%20I%20just%20placed%20an%20order%20(${orderId})%20and%20want%20to%20confirm%20the%20details."
               style="display:inline-block;background:#25d366;color:#fff;font-weight:700;padding:14px 32px;border-radius:50px;text-decoration:none;font-size:15px;margin-bottom:10px;">
              💬 Message Us on WhatsApp
            </a>
            <p style="margin:10px 0 0;font-size:12px;color:#a07050;">
              Tap to send us a WhatsApp message for order confirmation & updates
            </p>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#fff7f0;border-top:1px solid rgba(255,102,0,0.15);padding:20px 40px;text-align:center;">
            <p style="margin:0;font-size:12px;color:#a07050;">
              A.R. Enterprises | B-137/8, Shanti Mohalla, New Usmanpur, North East Delhi, New Delhi 110053<br>
              📞 Rahul: +91 85859 79398 | Aman: +91 83759 37237 | Anil: +91 95828 99535
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

  try {
    GmailApp.sendEmail(recipientEmail, subject, "", {
      htmlBody: htmlBody,
      name: "A.R. GiftCollection",
      replyTo: SENDER_EMAIL
    });
    Logger.log("Email sent to: " + recipientEmail);
  } catch(emailErr) {
    Logger.log("Email send failed: " + emailErr);
  }
}

// ─── Update Inventory Sheet (deduct ordered quantities) ──────
function updateInventory(ss, orderItemsStr) {
  let invSheet = ss.getSheetByName(INVENTORY_SHEET);
  if (!invSheet) return; // Skip if no Inventory sheet

  // Parse items: "TANJIRO x5 = ₹650 | GOKU x2 = ₹400"
  const items = orderItemsStr.split("|");
  items.forEach(item => {
    const trimmed = item.trim();
    // Match pattern: "NAME xQTY = ..."
    const match = trimmed.match(/^(.+?)\s+x(\d+)\s*=/);
    if (!match) return;
    const productName = match[1].trim().toUpperCase();
    const qty = parseInt(match[2], 10);

    // Find row in Inventory sheet where column A matches product name
    const data = invSheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      const rowName = String(data[i][0]).toUpperCase().trim();
      if (rowName === productName || rowName.includes(productName)) {
        const currentStock = parseInt(data[i][2]) || 0; // Column C = Stock
        const newStock = Math.max(0, currentStock - qty);
        invSheet.getRange(i + 1, 3).setValue(newStock);
        break;
      }
    }
  });
}

// ─── GET: Return Inventory as JSON for the website ──────────
function doGet(e) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const invSheet = ss.getSheetByName(INVENTORY_SHEET);
    if (!invSheet) {
      return ContentService
        .createTextOutput(JSON.stringify({ status: "no_inventory" }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    const data = invSheet.getDataRange().getValues();
    const headers = data[0];
    const rows = data.slice(1).map(row => {
      const obj = {};
      headers.forEach((h, i) => { obj[h] = row[i]; });
      return obj;
    });
    return ContentService
      .createTextOutput(JSON.stringify({ status: "ok", inventory: rows }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch(err) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: "error", message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// ─── Test Function ──────────────────────────────────────────
function testSubmit() {
  const testData = {
    parameter: {
      Timestamp:  new Date().toLocaleString("en-IN"),
      Name:       "Test Customer",
      WhatsApp:   "+91 99999 00000",
      Email:      "test@example.com",
      Business:   "Test Shop",
      City:       "Mumbai, Maharashtra",
      OrderItems: "TANJIRO x5 = ₹650 | GOKU x2 = ₹400",
      OrderTotal: "₹1,050",
      Notes:      "Test order"
    }
  };
  const result = doPost(testData);
  Logger.log("Test submitted: " + result.getContent());
}
