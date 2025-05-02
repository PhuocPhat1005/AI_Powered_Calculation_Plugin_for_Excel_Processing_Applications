# Assignment 03: AI-Powered Calculation Plugin for Excel Processing Applications

---

## 1. Introduction
In this assignment, I will designed an AI-powered calculation plugin for seamless integration into Google Sheet as an add-on. 
This tool empowers many individuals to improve their processing experience by customizing the prompts directly within the Google Sheets interface. 
Leveraging advanced AI models, the add-on provides high-quality, context-aware translations with customizable settings tailored to academic, professional, or casual writing styles.

## 2. Key Features
### 2.1. Sidebar - Based User Interface
#### **Intuitive Layout**
This dedicated sidebar allows users to set a customized prompt without leaving their document.

![SideBar](https://raw.githubusercontent.com/PhuocPhat1005/AI_Powered_Calculation_Plugin_for_Excel_Processing_Applications/refs/heads/main/images/layout.gif)

#### **Main Features**
In this AI-Powered Calculation Sidebar, there are a lot of interesting features shown below:
* In this header's sidebar, users can choose from **multiple AI models** to do generate the new prompt based on the customized prompt that users gave.
* In the **Basic Settings** region, users can select the **number of header row** to skip when being processed.
* In the **Input Prompt** region, users can:
  * Insert variables **{{value}}** which is the column name into the customized prompt set by the user to run each row.
  * Type their prompt in the prompt text to run for each row.
* In the **Output Prompt** region, users can choose the output columns to put the results in. Besides, users can choose the function that get or don't get 2 variants per row.
* In the **Advanced Settings** region, there are some functions that help users optimize their performance when they want to generate their prompt.
  * In the **Custom Instructions**, users can type their custom instructions.
  * In the **Spreadsheet Settings**, user can:
    * Choose the AI models to generate the results.
    * Choose the existed global instructions.
    * Adjust the creativity (temperature), top P, frequency penalty, and presence penalty.
* In the **Start from row**, user can:
  * Auto type: choose the number of rows (e.g., 3 rows) or all rows within Google Sheets environment.
  * Fixed type: choose a range of rows (e.g., from 2 to 4, which means from row index 2 to row index 4).

### 2.2. Models AI-Powered Calculation

In this assignment, thanks to supporting various **Gemini** and **Gemma** models, the plugin can provide high-quality experience by customizing prompt. The models include:
* **Preview model:** used for quick demonstrations and low-resource environments. It is suitable for rapid, basic translation tasks.
* **Gemini models:** are designed to provide high-quality translations with a focus on accuracy and fluency.
    * **Gemini 1.5 Series:** consists of Gemini 1.5 Pro, Gemini 1.5 Flash, and Gemini 1.5 Flash-8B
    * **Gemini 2.0 Series:** consists of Gemini 2.0 Flash Thinking Experimental 01-21, Gemini 2.0 Flash, Gemini 2.0 Flash-Lite, and Gemini 2.0 Flash (Image Generation) Experimental.
    * **Gemini 2.5 (Experimental):** is Gemini 2.5 Pro Experimental 03-25.
* **Gemma models:** is less powerful than Gemini models, but these models are efficient for translation need or offline scenarios. These models are Gemma 3 27B, Gemma 2 2B, Gemma 2 9B, and Gemma 2 27B.

### 2.3. GPT Functions

In this assignment, I implement **one function** called **GPT_SUMMARIZE** to summarize the content in one cell.
This function includes some parameters:
* Text: the cell to get the text or the specific text
* Format: the format that user would like to output (a prompt)
* Temperature: the creativity that user wants to set
* Model: the model that user would like to use

## 3. Installation & Deployment
### 3.1. Installation

**Step 1:** Download the file named **22127322.zip** on course moodle, or cloning the source code from project repository on GitHub by running the following command in the terminal:

```bash
git clone https://github.com/PhuocPhat1005/AI_Powered_Calculation_Plugin_for_Excel_Processing_Applications.git
```

**Step 2:** Create new project on Google Apps Script.
* Visit [Google Apps Script](https://script.google.com/home) and create a new standalone project.
* Create and copy all files in source, including `Code.gs` and `Sidebar.html`into the project.

**Step 3:** Configure OAuth Scopes & Manifest

Open `appsscript.json` on Google Apps Script and add required OAuth Scopes and URL Fetch Whitelist:

```json
{
  "timeZone": "Asia/Ho_Chi_Minh",
  "exceptionLogging": "STACKDRIVER",
  "runtimeVersion": "V8",
  "oauthScopes": [
    "https://www.googleapis.com/auth/spreadsheets.currentonly",
    "https://www.googleapis.com/auth/script.container.ui",
    "https://www.googleapis.com/auth/userinfo.email",
    "https://www.googleapis.com/auth/script.external_request",
    "https://www.googleapis.com/auth/script.locale",
    "https://www.googleapis.com/auth/spreadsheets"
  ],
  "urlFetchWhitelist": [
    "https://generativelanguage.googleapis.com/"
  ],
  "addOns": {
    "common": {
      "name": "Lê Phước Phát - 22127322",
      "logoUrl": "https://img.icons8.com/color/48/000000/artificial-intelligence.png",
      "useLocaleFromApp": true
    },
    "sheets": {
      "homepageTrigger": {
        "runFunction": "showSidebar",
        "enabled": true
      }
    }
  }
}
```

**Step 4:** Set `GEMINI_API_KEY` in this project

* In the Google Apps Script editor, go to **File > Project Settings > Script Properties**
* Click the "Add script property" button to add a new property:
  * **Key:** `GEMINI_API_KEY`
  * **Value:** `your_api_keys`

### 3.2. Testing

* In the Apps Script editor, click on `Deploy` > `Test deployments`.
* Then, choosing `select type` > `Editor Add-on`.
* Then `Add Test` on `Editor Add-on` and select document to test.

### 3.3. Deployment

* In the Apps Script editor, click on `Deploy` > `New deployment`
* Choose `select type` > `Add-on`.
* Choosing `User acessing the web app` and `Anyone with Google Account` on `Web app`.
* Click `Deploy` button.
