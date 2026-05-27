import express from "express";
import cors from "cors";
import multer from "multer";
import path from "path";
import fs from "fs";
import csv from "csv-parser";
import nodemailer from "nodemailer";

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS and JSON body parser
app.use(cors());
app.use(express.json());


//  delete hr_list file as soon as automation start => for clean environment . 
// Process & Purge Approach

// Ensure uploads folder exists
const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Preserve file extension
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${Date.now()}${ext}`);
  },
});

const upload = multer({ storage });

// Interfaces
interface HRData {
  email: string;
  name?: string;
  company?: string;
}

interface AutomationState {
  status: "idle" | "sending" | "stopped" | "finished";
  totalEmails: number;
  sentEmails: number;
  failedEmails: number;
  logs: string[];
}

// In-memory state tracking
// BE side state need to be synced with FE state
let state: AutomationState = {
  status: "idle",
  totalEmails: 0,
  sentEmails: 0,
  failedEmails: 0,
  logs: [],
};

// Global abort controller/flag to stop the sending loop
let stopRequested = false;

// Helper to log messages to both state and console
function logMsg(message: string) {
  const timestamp = new Date().toLocaleTimeString();
  const formattedMsg = `[${timestamp}] ${message}`;
  state.logs.push(formattedMsg);
  console.log(formattedMsg);
}

// // root route
app.get("/", (req, res) => {
  res.send("Hello World!");
});

// Route to get current automation status
app.get("/api/v1/status", (req, res) => {
  res.json(state);
});


// Route to stop automation
app.get("/api/v1/stop-automation", (req, res) => {
  if (state.status === "sending") {
    stopRequested = true;
    logMsg("🛑 Stop requested by user. Waiting for current sending cycle to finish...");
    res.json({ success: true, message: "Stop command sent." });
  } else {
    res.status(400).json({ success: false, message: "Automation is not running." });
  }
});

// Route to start email automation
app.post(
  "/api/v1/start-automation",
  upload.fields([
    { name: "hr_list", maxCount: 1 },
    { name: "resume", maxCount: 1 },
  ]),
  async (req, res) => {

    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,           // ✅ Not 465
      secure: false,       // ✅ false for 587
      family: 4,           // ✅ Force IPv4
      auth: {
        user: process.env.EMAIL,
        pass: process.env.GMAIL_APP_PASSWORD,  // ✅ App password not real password
      },
      tls: {
        rejectUnauthorized: false,  // ✅ Avoids TLS cert issues on cloud
      },
    });

    // ✅ Always verify connection on server start
    transporter.verify((error) => {
      if (error) {
        console.error("❌ Mail server connection failed:", error);
      } else {
        console.log("✅ Mail server ready!");
      }
    });
    // If files are in req.files typecast it correctly
    //   const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;

    //   console.log("files : ", files);
    //   if (state.status === "sending") {
    //     res.status(400).json({ success: false, message: "An automation run is already in progress." });
    //     return;
    //   }

    //   const {
    //     email,
    //     password,
    //     name,
    //     phone,
    //     linkedin,
    //     portfolio,
    //     github,
    //     subject,
    //     body,
    //   } = req.body;

    //   // Validate inputs
    //   if (!email || !password) {
    //     res.status(400).json({ success: false, message: "Sender email and password (app password) are required." });
    //     return;
    //   }

    //   const hrListFile = files?.["hr_list"]?.[0];
    //   const resumeFile = files?.["resume"]?.[0];

    //   if (!hrListFile) {
    //     res.status(400).json({ success: false, message: "HR list CSV file is required." });
    //     return;
    //   }

    //   // Reset and initialize state
    //   state = {
    //     status: "sending",
    //     totalEmails: 0,
    //     sentEmails: 0,
    //     failedEmails: 0,
    //     logs: [],
    //   };
    //   stopRequested = false;

    //   logMsg(`🚀 Starting email automation system for: ${name || email}`);
    //   logMsg(`📁 HR List file: ${hrListFile.originalname}`);
    //   if (resumeFile) {
    //     logMsg(`📄 Resume file attached: ${resumeFile.originalname}`);
    //   }

    //   // Parse CSV and trigger email sending process in the background
    //   const hrList: HRData[] = [];
    //   const csvPath = hrListFile.path;

    //   fs.createReadStream(csvPath)
    //     .pipe(csv())
    //     .on("data", (data: any) => {
    //       // Find first key that contains 'email' case-insensitively, or default to data.email
    //       let emailVal = data.email || data.Email || "";
    //       if (!emailVal) {
    //         const key = Object.keys(data).find((k) => k.toLowerCase().includes("email"));
    //         if (key) emailVal = data[key];
    //       }

    //       // Clean up email value
    //       emailVal = String(emailVal).trim();
    //       console.log("hrlist all emails: ", data);
    //       if (emailVal && emailVal.includes("@")) {
    //         hrList.push({
    //           email: emailVal,
    //           name: data.name || data.Name || data.hr_name || data.HR_Name || "",
    //           company: data.company || data.Company || data.company_name || "",
    //         });
    //       }
    //     })
    //     .on("error", (err) => {
    //       logMsg(`❌ Error reading CSV: ${err.message}`);
    //       state.status = "idle";
    //       if (fs.existsSync(csvPath)) {
    //         fs.unlink(csvPath, (unlinkErr) => {
    //           if (unlinkErr) console.error(unlinkErr);
    //         });
    //       }
    //     })
    //     .on("end", () => {
    //       state.totalEmails = hrList.length;
    //       logMsg(`📊 Found ${hrList.length} valid HR emails to process.`);

    //       // Run sending loop in background
    //       runSendingLoop(hrList, {
    //         email,
    //         password,
    //         name,
    //         phone,
    //         linkedin,
    //         portfolio,
    //         github,
    //         subject,
    //         body,
    //         resumeFile,
    //         csvPath,
    //       });
    //     });

    //   res.json({ success: true, message: "Email automation process started successfully." });
  }
);

// Background Email Sending Loop
// async function runSendingLoop(
//   hrList: HRData[],
//   config: {
//     email: string;
//     password: string;
//     name?: string;
//     phone?: string;
//     linkedin?: string;
//     portfolio?: string;
//     github?: string;
//     subject?: string;
//     body?: string;
//     resumeFile?: Express.Multer.File;
//     csvPath?: string;
//   }
// ) {


//   try {

//     // Set up nodemailer transporter
//     const transporter = nodemailer.createTransport({
//       host: "smtp.gmail.com",
//       port: 587,
//       secure: false,
//       auth: {
//         user: config.email,
//         pass: config.password,
//       },
//       family: 4,   // ✅ Force IPv4
//     });


//     for (let i = 0; i < hrList.length; i++) {
//       if (stopRequested) {
//         logMsg("🛑 Sending loop paused/stopped by user action.");
//         state.status = "stopped";
//         return;
//       }

//       const hr = hrList[i];
//       logMsg(`📧 [${i + 1}/${hrList.length}] Preparing email for ${hr.email}...`);

//       // Prepare subject and body with fallbacks or simple tag replacement
//       let subjectText = config.subject || `Software Developer Opportunity | Full-Stack Developer – ${config.name || ""}`;
//       let bodyText = config.body || getDefaultBodyTemplate(config);

//       // Replace dynamic tags if available, e.g., {Name}, {Company}
//       if (hr.name) {
//         subjectText = subjectText.replace(/{HR_Name}/g, hr.name).replace(/{Name}/g, hr.name);
//         bodyText = bodyText.replace(/{HR_Name}/g, hr.name).replace(/{Name}/g, hr.name);
//       } else {
//         subjectText = subjectText.replace(/{HR_Name}/g, "Hiring Team").replace(/{Name}/g, "Hiring Team");
//         bodyText = bodyText.replace(/{HR_Name}/g, "Hiring Team").replace(/{Name}/g, "Hiring Team");
//       }

//       if (hr.company) {
//         subjectText = subjectText.replace(/{Company}/g, hr.company);
//         bodyText = bodyText.replace(/{Company}/g, hr.company);
//       } else {
//         subjectText = subjectText.replace(/{Company}/g, "your company");
//         bodyText = bodyText.replace(/{Company}/g, "your company");
//       }

//       const mailOptions: nodemailer.SendMailOptions = {
//         from: `"${config.name || "Job Applicant"}" <${config.email}>`,
//         to: hr.email,
//         subject: subjectText,
//         text: bodyText,
//       };

//       // Attach resume if uploaded
//       if (config.resumeFile) {
//         mailOptions.attachments = [
//           {
//             filename: config.resumeFile.originalname,
//             path: config.resumeFile.path,
//           },
//         ];
//       }

//       try {
//         await new Promise((resolve, reject) => {
//           transporter.sendMail(mailOptions, (error, info) => {
//             if (error) {
//               reject(error);
//             } else {
//               resolve(info);
//             }
//           });
//         });
//         state.sentEmails++;
//         logMsg(`✅ Email successfully sent to ${hr.email}`);
//       } catch (err: any) { // if email not sent due to invalid credentials and all.
//         state.failedEmails++;

//         console.log("details :", config.email, "  ", config.password)
//         logMsg(`❌ Failed sending email to ${hr.email}. Error: ${err.message || err}`);
//       }

//       // Delay between emails to avoid spam filters (except for the last email)
//       if (i < hrList.length - 1 && !stopRequested) {
//         const delay = Math.floor(Math.random() * 8000) + 12000; // Random delay between 12-20 seconds
//         logMsg(`⏳ Waiting for ${Math.round(delay / 1000)} seconds before next email to prevent spam detection...`);
//         await new Promise((resolve) => setTimeout(resolve, delay));
//       }
//     }

//     if (stopRequested) {
//       state.status = "stopped";
//       logMsg("🏁 Process execution halted. Automation stopped.");
//     } else {
//       state.status = "finished";
//       logMsg("🎉 Automation completed! All emails processed.");
//     }
//   } finally {
//     if (config.csvPath && fs.existsSync(config.csvPath)) {
//       fs.unlink(config.csvPath, (err) => {
//         if (err) {
//           logMsg(`❌ Error deleting HR list file: ${err.message}`);
//         } else {
//           logMsg(`🗑️ HR list file successfully deleted.`);
//         }
//       });
//     }
//   }
// }

// // Default fallback email template
// function getDefaultBodyTemplate(config: any) {
//   const name = config.name || "[Your Name]";
//   const phone = config.phone || "[Your Phone Number]";
//   const linkedin = config.linkedin || "";
//   const portfolio = config.portfolio || "";
//   const github = config.github || "";

//   return `Dear Hiring Team,

// I hope you are doing well.

// My name is ${name}, and I am a Software Developer interested in exploring opportunities at your organization.

// Please find my resume attached for your consideration.

// Best regards,
// ${name}

// ${phone}
// ${linkedin ? `LinkedIn: ${linkedin}` : ""}
// ${portfolio ? `Portfolio: ${portfolio}` : ""}
// ${github ? `GitHub: ${github}` : ""}`;
// }

// Start Server
app.listen(PORT, () => {
  console.log(`🚀 server running on port ${PORT}`);
});