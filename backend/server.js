const express = require("express");
const cors = require("cors");
const XLSX = require("xlsx");
const path = require("path");
const fs = require("fs");
const dotenv = require("dotenv");

dotenv.config();

const sendEmail = require("./config/mail");

const app = express();

const PORT = process.env.PORT || 5000;


// ==========================================
// MIDDLEWARE
// ==========================================

app.use(cors());
app.use(express.json());


// ==========================================
// EXCEL FILE LOCATION
// ==========================================

const excelFile = path.join(__dirname, "enquiries.xlsx");


// ==========================================
// SAVE ENQUIRY TO EXCEL
// ==========================================

function saveToExcel(name, email, message) {

    let workbook;
    let worksheet;

    if (fs.existsSync(excelFile)) {

        workbook = XLSX.readFile(excelFile);
        worksheet = workbook.Sheets["Enquiries"];

    } else {

        workbook = XLSX.utils.book_new();

        worksheet = XLSX.utils.json_to_sheet([]);

        XLSX.utils.book_append_sheet(
            workbook,
            worksheet,
            "Enquiries"
        );
    }

    const existingData =
        XLSX.utils.sheet_to_json(worksheet);

    existingData.push({

        "Date & Time":
            new Date().toLocaleString("en-IN"),

        "Name": name,

        "Email": email,

        "Message": message

    });

    worksheet =
        XLSX.utils.json_to_sheet(existingData);

    workbook.Sheets["Enquiries"] = worksheet;

    XLSX.writeFile(workbook, excelFile);
}


// ==========================================
// TEST ROUTE
// ==========================================

app.get("/", (req, res) => {

    res.send(
        "ADR Corporation Backend is running!"
    );

});


// ==========================================
// ENQUIRY API
// ==========================================

app.post("/api/enquiries", async (req, res) => {

    try {

        const {
            name,
            email,
            message
        } = req.body;


        // Validation

        if (!name || !email || !message) {

            return res.status(400).json({

                success: false,

                message:
                    "Name, email and message are required."

            });
        }


        // ==================================
        // SAVE TO EXCEL
        // ==================================

        saveToExcel(
            name,
            email,
            message
        );


        console.log("New enquiry saved:");

        console.log("Name:", name);

        console.log("Email:", email);

        console.log("Message:", message);


        // ==================================
        // EMAIL TO OWNER
        // ==================================

        await sendEmail({

            to: process.env.OWNER_EMAIL,

            replyTo: email,

            subject:
                `New Enquiry from ${name}`,

            text: `
New enquiry received from ADR Corporation website.

Name:
${name}

Email:
${email}

Message:
${message}

--------------------------------

ADR Corporation
Packaging That Protects Your Promise.
            `

        });


        // ==================================
        // CONFIRMATION EMAIL TO CUSTOMER
        // ==================================

        await sendEmail({

            to: email,

            subject:
                "We received your enquiry — ADR Corporation",

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


        // ==================================
        // SUCCESS
        // ==================================

        console.log(
            "Enquiry saved and emails sent successfully."
        );


        res.status(201).json({

            success: true,

            message:
                "Enquiry submitted successfully. A confirmation email has been sent."

        });


    } catch (error) {

        console.error(
            "ENQUIRY ERROR:",
            error
        );


        res.status(500).json({

            success: false,

            message:
                "Enquiry was received, but there was a problem sending the email."

        });

    }

});


// ==========================================
// START SERVER
// ==========================================

app.listen(
    PORT,
    "0.0.0.0",
    () => {

        console.log(
            `ADR Corporation backend running on port ${PORT}`
        );

    }
);