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
  pickedUp: dosesPickedUp,
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