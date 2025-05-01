function onOpen(e) {
  // Lấy đối tượng UI của Google Sheets
  const ui = SpreadsheetApp.getUi();

  // Tạo menu 'Add-on' mới trong giao diện
  ui.createAddonMenu()
    // Thêm mục menu 'Open Sidebar', khi nhấn sẽ gọi hàm showSidebar()
    .addItem('Open Sidebar', 'showSidebar')
    // Đưa menu tuỳ chỉnh vào giao diện
    .addToUi();

  // Ghi log để theo dõi khi chạy hàm
  Logger.log('onOpen: Đã khởi tạo menu Add-on');
}

function onInstall(e) {
  // Tái sử dụng logic onOpen
  onOpen(e);

  // Ghi log khi Add-on được cài đặt
  Logger.log('onInstall: Add-on đã được cài');
}

function showSidebar() {
  // Ghi log trước khi render sidebar
  Logger.log('showSidebar: Đang render SideBar.html');

  // Tạo HtmlOutput từ file SideBar.html
  const html = HtmlService
    .createHtmlOutputFromFile('SideBar')  // Tên file HTML (không kèm .html)
    .setTitle('Lê Phước Phát - 22127322'); // Tiêu đề hiển thị ở đầu sidebar

  // Hiển thị sidebar trong giao diện
  SpreadsheetApp.getUi().showSidebar(html);
}

function columnNumberToLetter(n) {
  let letter = ''; // Khởi tạo chuỗi kết quả

  // Lặp cho đến khi số cột hết
  while (n > 0) {
    // Tính phần dư cho chữ cái
    const rem = (n - 1) % 26;
    // Chuyển phần dư thành ký tự (65 = 'A') và ghép vào front
    letter = String.fromCharCode(65 + rem) + letter;
    // Cập nhật n để lặp tiếp
    n = Math.floor((n - 1) / 26);
  }

  return letter; // Trả về chuỗi ký tự cột
}

function getHeaderColumns(headerRow) {
  // Lấy sheet đang hoạt động
  const sheet = SpreadsheetApp.getActiveSheet();
  // Số cột tối đa trong sheet
  const lastCol = sheet.getMaxColumns();

  // Lấy giá trị headerRow, từ cột 1 đến lastCol
  const headerValues = sheet.getRange(headerRow, 1, 1, lastCol)
                            .getValues()[0] || [];

  const headers = []; // Mảng chứa kết quả

  // Duyệt qua từng cột
  for (let i = 0; i < lastCol; i++) {
    headers.push({
      name: headerValues[i] || '',             // Tên header (nếu trống thì chuỗi rỗng)
      col: columnNumberToLetter(i + 1)         // Ký tự cột tương ứng
    });
  }

  // Ghi log để debug
  Logger.log('getHeaderColumns: %s', JSON.stringify(headers));

  // Trả về mảng header cho phía client
  return headers;
}

function runSummarize(config) {
  Logger.log('runSummarize: nhận config=%s', JSON.stringify(config));

  const sheet = SpreadsheetApp.getActiveSheet();
  const headerRow = parseInt(config.headerRow, 10) || 1;
  Logger.log(`runSummarize: headerRow=${headerRow}`);

  // Xác định phạm vi xử lý
  let startRow, endRow;
  if (config.mode === 'auto') {
    if (config.autoMode === 'all') {
      startRow = headerRow + 1;
      endRow = sheet.getLastRow();
    } else {
      startRow = headerRow + 1;
      endRow = headerRow + parseInt(config.autoRows, 10);
    }
  } else {
    startRow = parseInt(config.fixedStart, 10);
    endRow = parseInt(config.fixedEnd, 10);
  }
  Logger.log(`runSummarize: startRow=${startRow}, endRow=${endRow}`);
  if (!Number.isInteger(startRow) || !Number.isInteger(endRow) || startRow < headerRow + 1) {
    throw new Error(`Invalid rows: start=${startRow}, end=${endRow}`);
  }

  // Xác định cột đầu ra
  let outCols;
  if (config.variants) {
    outCols = config.outputColumn.split(',').map(c => c.trim());
    Logger.log(`runSummarize: variants mode, outCols=${outCols}`);
  } else {
    outCols = [config.outputColumn];
    Logger.log(`runSummarize: single mode, outCols=${outCols}`);
  }

  const inputCols = config.inputColumns;
  Logger.log(`runSummarize: inputCols=${inputCols}`);
  const basePrompt = config.prompt;
  const sysInstr = [config.spreadsheetInstructions || '', config.customInstructions || '']
                   .filter(Boolean).join('\n');

  // Đọc các tham số tạo sinh
  const temp = parseFloat(config.temperature);
  const topP = parseFloat(config.topP) || 1;
  const frequencyPenalty = parseFloat(config.frequencyPenalty) || 0;
  const presencePenalty = parseFloat(config.presencePenalty) || 0;
  const maxTokens = 512;
  const candidateCount = config.variants ? 2 : 1;

  // Log cấu hình chi tiết
  Logger.log(`runSummarize: temp=${temp}, topP=${topP}, freqPenalty=${frequencyPenalty}, presPenalty=${presencePenalty}, maxTokens=${maxTokens}, count=${candidateCount}`);

  for (let r = startRow; r <= endRow; r++) {
    // Lấy dữ liệu input và xây prompt cho hàng r
    Logger.log(`runSummarize: xử lý hàng ${r}`);
    const vals = inputCols.map(c => sheet.getRange(c + r).getValue());
    Logger.log(`runSummarize: giá trị input hàng ${r} = ${vals}`);
    const map = Object.fromEntries(inputCols.map((c, i) => [c, vals[i]]));
    const promptText = basePrompt.replace(/\{\{(\w+)\}\}/g, (_, key) => map[key] || '');
    Logger.log(`runSummarize: promptText hàng ${r} = ${promptText}`);

    // Gọi API với đầy đủ tham số penalty
    const result = GPT_TEXT_SUMMARIZE(
      promptText,
      temp,
      config.model,
      candidateCount,
      sysInstr,
      topP,
      frequencyPenalty,
      presencePenalty,
      maxTokens
    );
    Logger.log(`runSummarize: API result hàng ${r} = ${result}`);

    // Ghi kết quả
    if (config.variants) {
      const arr = Array.isArray(result) ? result : [result, result];
      outCols.forEach((col, i) => {
        Logger.log(`runSummarize: ghi arr[${i}] vào ${col}${r}`);
        sheet.getRange(col + r).setValue(arr[i] || '');
      });
    } else {
      Logger.log(`runSummarize: ghi result vào ${outCols[0]}${r}`);
      sheet.getRange(outCols[0] + r).setValue(result);
    }
  }
  Logger.log('runSummarize: Hoàn thành tất cả các hàng');
}

function GPT_TEXT_SUMMARIZE(
  promptText,
  temperature,
  model,
  candidateCount,
  sysInstr = '',
  topP = 1.0,
  frequencyPenalty = 0,
  presencePenalty = 0,
  maxTokens = 512
) {
  Logger.log(`GPT_TEXT_SUMMARIZE: bắt đầu với model=${model}, candidateCount=${candidateCount}`);
  const apiKey = PropertiesService.getScriptProperties().getProperty('GEMINI_API_KEY');
  if (!apiKey) return 'Error: GEMINI_API_KEY chưa thiết lập.';

  // Luôn dùng endpoint generateContent
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  const payload = {
    contents: [
      {
        parts: [ { text: sysInstr ? sysInstr + '\n' + promptText : promptText } ]
      }
    ],
    generationConfig: {
      temperature: temperature,
      candidateCount: candidateCount,
      topP: topP,
      frequencyPenalty: frequencyPenalty,
      presencePenalty: presencePenalty,
      maxOutputTokens: maxTokens
    }
  };

  Logger.log('GPT_TEXT_SUMMARIZE: URL=' + url);
  Logger.log('GPT_TEXT_SUMMARIZE: Payload=' + JSON.stringify(payload));

  try {
    const res = UrlFetchApp.fetch(url, {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    });
    Logger.log('GPT_TEXT_SUMMARIZE: HTTP Code=' + res.getResponseCode());
    Logger.log('GPT_TEXT_SUMMARIZE: Response=' + res.getContentText());

    const data = JSON.parse(res.getContentText());
    if (data.error) {
      return `API Error: ${data.error.message}`;
    }
    const cands = data.candidates || [];
    if (!cands.length) {
      return 'Error: Không có kết quả.';
    }

    const extract = c => {
      if (c.content && Array.isArray(c.content.parts)) {
        return c.content.parts.map(p => p.text).join('').trim();
      }
      if (c.output) return c.output.trim();
      if (c.content && c.content.text) return c.content.text.trim();
      return '';
    };

    if (candidateCount > 1) {
      return cands.map(extract);
    }
    return extract(cands[0]);
  } catch (e) {
    Logger.log('GPT_TEXT_SUMMARIZE: Exception=' + e.message);
    return `Fetch Error: ${e.message}`;
  }
}

/**
 * Custom Sheets function: summarize text in one cell.
 *
 * @param {string|Array} text Input text or range.
 * @param {string} [format] Desired format, e.g. "key takeaways".
 * @param {number} [temperature] Creativity (0.0–1.0).
 * @param {string} [model] Gemini model name.
 * @return {string} Summary in a single cell.
 * @customfunction
 */
function GPT_SUMMARIZE(text, format, temperature, model) {
  const input = Array.isArray(text) ? text.flat(Infinity).join(' ') : text;
  if (!input) return '';
  const fmt = format || 'Bullet points';
  const temp = parseFloat(temperature) || 0;
  const mdl = model || 'gemini-1.5-pro';
  const prompt = `Please summarize the following text as ${fmt}:\n\n${input}`;
  return GPT_TEXT_SUMMARIZE(prompt, temp, mdl, 1, '', 1.0, 0, 0, 512);
}
