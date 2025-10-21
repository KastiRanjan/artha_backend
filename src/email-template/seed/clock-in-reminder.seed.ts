export const clockInReminderTemplate = {
  title: 'Clock In Reminder',
  slug: 'clock-in-reminder',
  subject: 'Reminder: Please Clock In - {{currentDate}}',
  body: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Clock In Reminder</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      background-color: #f5f5f5;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 600px;
      margin: 20px auto;
      background-color: #ffffff;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: #ffffff;
      padding: 30px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 24px;
      font-weight: 600;
    }
    .content {
      padding: 30px;
    }
    .greeting {
      font-size: 18px;
      color: #333;
      margin-bottom: 20px;
    }
    .message {
      background-color: #fff3cd;
      border-left: 4px solid #ffc107;
      padding: 15px;
      margin: 20px 0;
      border-radius: 4px;
    }
    .info-box {
      background-color: #f8f9fa;
      padding: 20px;
      border-radius: 6px;
      margin: 20px 0;
    }
    .info-item {
      margin: 10px 0;
    }
    .info-label {
      font-weight: 600;
      color: #555;
      display: inline-block;
      width: 150px;
    }
    .info-value {
      color: #333;
    }
    .highlight {
      color: #d9534f;
      font-weight: 600;
    }
    .button-container {
      text-align: center;
      margin: 30px 0;
    }
    .button {
      display: inline-block;
      padding: 12px 30px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: #ffffff;
      text-decoration: none;
      border-radius: 5px;
      font-weight: 600;
      transition: transform 0.2s;
    }
    .button:hover {
      transform: translateY(-2px);
    }
    .footer {
      background-color: #f8f9fa;
      padding: 20px;
      text-align: center;
      font-size: 12px;
      color: #6c757d;
      border-top: 1px solid #dee2e6;
    }
    .note {
      font-size: 14px;
      color: #6c757d;
      margin-top: 20px;
      font-style: italic;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>⏰ Clock-In Reminder</h1>
    </div>
    
    <div class="content">
      <div class="greeting">
        Hello <strong>{{userName}}</strong>,
      </div>
      
      <div class="message">
        <strong>⚠️ Attendance Reminder</strong><br>
        We noticed that you haven't clocked in yet for today.
      </div>
      
      <div class="info-box">
        <div class="info-item">
          <span class="info-label">Date:</span>
          <span class="info-value">{{currentDate}}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Expected Time:</span>
          <span class="info-value highlight">{{expectedTime}}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Grace Period:</span>
          <span class="info-value">{{gracePeriod}} minutes</span>
        </div>
      </div>
      
      <p>
        Please clock in as soon as possible to ensure accurate attendance tracking. 
        Regular attendance is important for maintaining your work records and payroll processing.
      </p>
      
      <div class="button-container">
        <a href="{{frontendUrl}}/attendance" class="button">Clock In Now</a>
      </div>
      
      <p class="note">
        If you're on leave or have a valid reason for not attending, please contact your supervisor or HR department.
      </p>
    </div>
    
    <div class="footer">
      <p>This is an automated reminder from the Artha Attendance System.</p>
      <p>Please do not reply to this email.</p>
    </div>
  </div>
</body>
</html>
  `,
  isActive: true,
};
