// ********************************************************************************
// ⚠️ ใส่ Google Sheet ID ของคุณที่นี่
// ********************************************************************************
const SPREADSHEET_ID = '187UPbC-lL8fng20ar_Qp2TYcw2o5MnD28S8JSo4Cwt0'; 

const MENU_SHEET_NAME = 'Menu_List';
const ORDERS_SHEET_NAME = 'Orders_Log';
  
function doGet() {
  var htmlTemplate = HtmlService.createTemplateFromFile('index');
  return htmlTemplate.evaluate()
      .setTitle('ASL Lunch Box')
      .setSandboxMode(HtmlService.SandboxMode.IFRAME)
      .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

// --- ดึงข้อมูลเมนู ---
function getMenuData() {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(MENU_SHEET_NAME);
    if (!sheet) throw new Error('ไม่พบชีต: ' + MENU_SHEET_NAME);

    const values = sheet.getDataRange().getValues();
    if (values.length < 2) return []; 

    // Map ข้อมูลตามคอลัมน์: A=ID, B=Name, C=Price, E=Image, F=SpicyOption
    const menuData = values.slice(1).map(row => ({
      id: row[0], 
      name: row[1], 
      price: parseFloat(row[2] || 0), 
      imageUrl: row[4], 
      hasSpicy: (String(row[5]).toUpperCase() === 'TRUE' || String(row[5]).toUpperCase() === 'YES')
    }));
    
    return menuData;
  } catch (e) {
    Logger.log("Error: " + e.message);
    return []; 
  }
}

// --- บันทึกข้อมูล ---
function processForm(formData) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(ORDERS_SHEET_NAME);
    if (!sheet) throw new Error('ไม่พบชีต: ' + ORDERS_SHEET_NAME);

    const itemsText = formData.items.map(item => 
      `${item.name} x${item.quantity} (${item.spiciness})`
    ).join(', ');

    // สร้าง Order ID: ปีเดือนวัน-เวลา (เช่น 20251120-1045)
    const now = new Date();
    const orderId = 'ORD-' + now.getTime().toString().slice(-6);

    const newRow = [
      orderId, 
      formData.orderDate,
      formData.deliveryDate,
      formData.customerName,
      formData.contactInfo,
      itemsText,
      formData.totalPrice, 
      formData.additionalNotes,
      'รอดำเนินการ'
    ];

    sheet.appendRow(newRow);

    return { success: true, orderId: orderId, totalPrice: formData.totalPrice };

  } catch (e) {
    return { success: false, message: e.message };
  }
   // --- ดึงออเดอร์ล่าสุดของผู้สั่ง ---
function getLastOrder(orderId) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(ORDERS_SHEET_NAME);
    const values = sheet.getDataRange().getValues();
    const headers = values[0];

    // หา row ของ Order ID
    const row = values.slice(1).find(r => r[0] === orderId);
    if (!row) throw new Error("ไม่พบ Order ID: " + orderId);

    // แปลงเป็น object
    const order = {};
    headers.forEach((h, i) => order[h] = row[i]);
    return order;

  } catch(e) {
    Logger.log(e);
    return null;
  }
}

}
