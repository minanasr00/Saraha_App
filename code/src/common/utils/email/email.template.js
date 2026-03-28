export const emailTemplate = (otp,title) => {
    return `
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
        /* CSS Reset */
        body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
        table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
        img { -ms-interpolation-mode: bicubic; }
        
        /* General Styles */
        body {
            margin: 0;
            padding: 0;
            background-color: #f4f7f6;
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            color: #333333;
        }
        .container {
            max-width: 600px;
            margin: 40px auto;
            background-color: #ffffff;
            border-radius: 8px;
            box-shadow: 0 4px 10px rgba(0,0,0,0.05);
            overflow: hidden;
        }
        .header {
            background-color: #4CAF50; /* Change to your brand color */
            padding: 30px 20px;
            text-align: center;
            color: #ffffff;
        }
        .header h1 {
            margin: 0;
            font-size: 24px;
            font-weight: 600;
        }
        .content {
            padding: 40px 30px;
            text-align: center;
        }
        .content p {
            font-size: 16px;
            line-height: 1.6;
            margin-bottom: 25px;
            color: #555555;
        }
        .otp-box {
            display: inline-block;
            background-color: #f0fdf4; /* Light green background */
            border: 2px dashed #4CAF50;
            border-radius: 6px;
            padding: 15px 40px;
            margin-bottom: 25px;
        }
        .otp-code {
            font-size: 32px;
            font-weight: bold;
            color: #4CAF50;
            letter-spacing: 5px;
            margin: 0;
        }
        .footer {
            background-color: #f9fafb;
            padding: 20px;
            text-align: center;
            border-top: 1px solid #eeeeee;
        }
        .footer p {
            font-size: 13px;
            color: #888888;
            margin: 5px 0;
            line-height: 1.5;
        }
    </style>
</head>
<body>

    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f4f7f6;">
        <tr>
            <td align="center">
                <div class="container">
                    
                    <div class="header">
                        <h1>Security Verification</h1>
                    </div>

                    <div class="content">
                        <p>Hello,</p>
                        <p>Please use the following One-Time Password (OTP) to complete your process.</p>
                        
                        <div class="otp-box">
                            <p class="otp-code">${otp}</p>
                        </div>

                        <p style="font-size: 14px; color: #888;">This code is valid for the next <strong>5 minutes</strong>. Please do not share this code with anyone.</p>
                    </div>

                    <div class="footer">
                        <p>If you didn't request this code, you can safely ignore this email.</p>
                        <p>&copy; 2026 Sraha App. All rights reserved.</p>
                    </div>

                </div>
            </td>
        </tr>
    </table>

</body>
</html>`
}
