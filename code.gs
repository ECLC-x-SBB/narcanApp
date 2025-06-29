const SS_ID = '17xhdNmk84d5AmTln6xbHgbD3lOaZEQZ_rkKdHfbQdSI';      
const SHEET_PICKUP = 'Pick Up';    
const SHEET_USE    = 'Administered';
const SHEET_VOLUNTEERS = 'Volunteers';        

function doPost(e) {
  try {
    const params   = e.parameter;
    const ss       = SpreadsheetApp.openById(SS_ID);
  
  let sheet;
  if (params.formType === 'pickup') {
    sheet = ss.getSheetByName(SHEET_PICKUP);
  }
  else if (params.formType === 'use') {
    sheet = ss.getSheetByName(SHEET_USE);
  }
  else if (params.formType === 'volunteer') {
    sheet = ss.getSheetByName(SHEET_VOLUNTEERS);
  }
  else {
    throw new Error('Unrecognized formType: ' + params.formType);
  }

  let row;
  if (params.formType === 'pickup') {
    row = [
      new Date(),              
      params.boxes,         
      params.age || '',           
      params.sex || '',           
      params.ethnicity || '',     
      params.education || '',     
      params.relationship || '',  
      params.comments || '',      
      params.name || ''           
    ];
    const recipient = 'emeraldcoastlifecenter@gmail.com';
    const subject = 'New Narcan Pick-Up Submission from ' + (params.name || 'anonymous');
    const body = 
      'A new Narcan Pick-Up form has been submitted:\n\n' +
      'Amount Picked Up: ' + (params.boxes) + '\n' +
      'Users age: ' + (params.age || 'Not given') + '\n' +
      'Sex: ' + (params.sex || 'Not given') + '\n' +
      'Ethnicity: ' + (params.ethnicity || 'Not given') + '\n' +
      'Education: ' + (params.education || 'Not given') + '\n' +
      'Relationship Status: ' + (params.relationship || 'Not given') + '\n' +
      'Additional comments: ' + (params.comments || 'None added') + '\n\n' +
      '- This email was sent automatically by your Apps Script.';
    MailApp.sendEmail(recipient, subject, body);
  } 
  else if (params.formType === 'use') {  
    row = [
      new Date(),              
      params.doses,         
      params.result,      
      params.called911,     
      params.hospital,      
      params.comments || '',      
      params.name || ''           
    ];
    const recipient = 'emeraldcoastlifecenter@gmail.com';
    const subject = 'New Narcan Use Submission from ' + (params.name || 'anonymous');
    const body = 
      'A new Narcan Use form has been submitted:\n\n' +
      'Doses Administered: ' + (params.doses) + '\n' +
      'Result following Narcan administration: ' + (params.result) + '\n' +
      'Was 911 Called?: ' + (params.called911) + '\n' +
      'Did they go to the hospital?: ' + (params.hospital) + '\n' +
      'Additional comments: ' + (params.comments || 'None added') + '\n\n' +
      '- This email was sent automatically by your Apps Script.';
    MailApp.sendEmail(recipient, subject, body);
  }
  else {
    row = [
      new Date(),
      params.name,
      params.email,
      params.phone,
      params.contactPref,
      params.experience
    ];
    const recipient = 'emeraldcoastlifecenter@gmail.com';
    const subject = 'New Volunteer Signup: '+ (params.name || '(no name)');
    const body =
      'A new volunteer submission has arrived:\n\n' +
      'Name: ' + (params.name || '')       + '\n' +
      'Email: ' + (params.email || '')      + '\n' +
      'Phone: ' + (params.phone || '')      + '\n' +
      'Contact Preference: ' + (params.contactPref || '')    + '\n' +
      'Experience: ' + (params.experience || 'none') + '\n\n' +
      '- This email was sent automatically by your Apps Script.';
    MailApp.sendEmail(recipient, subject, body);
  }

  sheet.appendRow(row);

  return ContentService
    .createTextOutput(JSON.stringify({status:'success'}))
    .setMimeType(ContentService.MimeType.JSON);
  } catch(err) {
    Logger.log('=== Error in doPost ===');
    Logger.log(err.toString());
    Logger.log('Parameters: ' + JSON.stringify(e.parameter));
    throw err;
  }
}

function resetTestData() {
  const ss = SpreadsheetApp.openById(SS_ID);
  [SHEET_PICKUP, SHEET_USE, SHEET_VOLUNTEERS].forEach(name => {
    const sh = ss.getSheetByName(name);
    const lastRow = sh.getLastRow();
    const lastCol = sh.getLastColumn();
    if (lastRow > 2) {
      sh.getRange(3, 1, lastRow - 2, lastCol)
        .clearContent();
    }
  });
}
function doGet(e) {
  if (e.parameter.action !== 'impact') {
    return ContentService
    .createTextOutput('Invalid action')
    .setMimeType(ContentService.MimeType.TEXT);
}

const ss = SpreadsheetApp.openById(SS_ID);
const pick = ss.getSheetByName(SHEET_PICKUP)
  .getDataRange().getValues().slice(1);
const use = ss.getSheetByName(SHEET_USE)
  .getDataRange().getValues().slice(1);

const now = new Date();
let startDate;
switch (e.parameter.range) {
  case 'week':
    startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6);
    break;
  case 'year':
    startDate = new Date(now.getFullYear(), 0, 1);
    break;
  case 'month':
    default:
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
}

const inWindow = row => {
  const d = new Date(row[0]);
  return d >= startDate && d <= now;
};

const pickF = pick.filter(inWindow);
const useF = use.filter(inWindow);

const totalBoxes = pickF.reduce((sum,r) => sum + Number(r[1]||0), 0);
const dosesPickedUp = totalBoxes * 2;
const totalUsed = useF.reduce((sum,r) => sum + Number(r[1]||0), 0);
const livesSaved = useF.filter(r => r[2]==='Overdose Reversal').length;
const hospitalized = useF.filter(r => r[4]==='Yes').length;

const result = {
  pickedUp: totalBoxes,
  dosesPickedUp: dosesPickedUp,
  dosesUsed: totalUsed,
  livesSaved: livesSaved,
  hospitalizations: hospitalized
};

const cb = e.parameter.callback || 'handleImpact';
const js = `${cb}(${JSON.stringify(result)});`;

return ContentService
  .createTextOutput(js)
  .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }

function monthlySummaryReport() {
  const ss = SpreadsheetApp.openById(SS_ID);
  const now = new Date();

  let month = now.getMonth() - 1;
  let year = now.getFullYear();
  if (month < 0) {month = 11; year -= 1; }

  const isInMonth = date =>
    date instanceof Date &&
    date.getMonth() === month &&
    date.getFullYear() === year;

  const pickupVals = ss.getSheetByName(SHEET_PICKUP)
    .getDataRange()
    .getValues();
  let totalBoxes = 0, pickupCount = 0;
  pickupVals.forEach(row => {
    if (isInMonth(row[0])) {
      pickupCount++;
      totalBoxes += Number(row[1]) || 0;
    }
  });

  const useVals = ss.getSheetByName(SHEET_USE)
    .getDataRange()
    .getValues();
  let totalDoses = 0, useCount = 0;
  useVals.forEach(row => {
    if (isInMonth(row[0])) {
      useCount++;
      totalDoses += Number(row[1]) || 0;
    }
  });

  const volVals = ss.getSheetByName(SHEET_VOLUNTEERS)
    .getDataRange()
    .getValues();

  const newVols = volVals.filter(row => isInMonth(row[0])).length;

  const subject = `ECLC Monthly Report: ${year}-${String(month+1).padStart(2,'0')}`;
  const body = 
    `Here's your ${year}-${String(month+1).padStart(2,'0')} summary:
    
    • Pick-up forms: ${pickupCount} submissions
      -Total boxes taken: ${totalBoxes}
      
    • Administered forms: ${useCount} submissions
      -Total doses: ${totalDoses}
      
    • New volunteer sign-ups: ${newVols}
    
    -End of report (automated by Apps Script)
    `.trim();

    MailApp.sendEmail('emeraldcoastlifecenter@gmail.com', subject, body);
}