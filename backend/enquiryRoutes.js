const express = require("express");
const XLSX = require("xlsx");
const path = require("path");
const fs = require("fs");

const transporter = require("../config/mail");

const router = express.Router();

const excelFile = path.join(__dirname, "..", "enquiries.xlsx");

// Save enquiry to Excel
function saveToExcel(name, email, message) {
    let workbook;
    let worksheet;

    if (fs.existsSync(excelFile)) {
        workbook = XLSX.readFile(excelFile);
        worksheet = workbook.Sheets["Enquiries"];
    } else {
        workbook = XLSX.utils.book_new();
        worksheet = XLSX.utils.json_to_sheet([]);
        XLSX.utils.book_append_sheet(workbook, worksheet, "Enquiries");
    }

    const existingData = XLSX.utils.sheet_to_json(worksheet);

    existingData.push({
        "Date & Time": new Date().toLocaleString("en-IN"),
        "Name": name,
        "Email": email,
        "Message": message
    });

    worksheet = XLSX.utils.json_to_sheet(existingData);
    workbook.Sheets["Enquiries"] = worksheet;

    XLSX.writeFile(workbook, excelFile);
}

// POST /api/enquiries
router.post("/", async (req, res) => {
    try {
        const { name, email, message } = req.body;

        if (!name || !email || !message) {
            return res.status(400).json({
                success: false,
                message: "Name, email and message are required."
            });
        }

        // Save to Excel
        saveToExcel(name, email, message);

        // Send email to ADR Corporation
        await transporter.sendMail({
            from: `"ADR Corporation Website" <${process.env.SMTP_USER}>`,
            to: process.env.OWNER_EMAIL,
            replyTo: email,
            subject: `New Enquiry from ${name}`,
            text: `
New enquiry received from ADR Corporation website.

Name: ${name}

Email: ${email}

Message:
${message}

--------------------------------

ADR Corporation
Packaging That Protects Your Promise.
            `
        });

        // Send confirmation email to customer
        await transporter.sendMail({
            from: `"ADR Corporation" <${process.env.SMTP_USER}>`,
            to: email,
            subject: "We received your enquiry — ADR Corporation",
            text: `
Dear ${name},

Thank you for contacting ADR Corporation.

We have successfully received your enquiry.

Our team will review your message and shortly connect with you regarding your packaging requirement.

We appreciate your interest in ADR Corporation.

Regards,

ADR Corporation
Packaging That Protects Your Promise.

Email: adrcorp153@gmail.com
Phone: +91 7623047153
            `
        });

        console.log("Enquiry saved and emails sent successfully.");

        res.status(201).json({
            success: true,
            message: "Enquiry submitted successfully. A confirmation email has been sent."
        });

    } catch (error) {
        console.error("ENQUIRY ERROR:", error);

        res.status(500).json({
            success: false,
            message: "Enquiry was received, but there was a problem sending the email."
        });
    }
});

module.exports = router;