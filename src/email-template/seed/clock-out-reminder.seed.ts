export const clockOutReminderTemplate = {
  title: 'Clock Out Reminder',
  slug: 'clock-out-reminder',
  subject: 'Reminder: Please Clock Out - {{currentDate}}',
  body: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Clock Out Reminder</title>
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
      background: linear-gradient(135deg, #20bf6b 0%, #26a65b 100%);
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
      background-color: #d1ecf1;
      border-left: 4px solid #17a2b8;
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
      color: #20bf6b;
      font-weight: 600;
    }
    .button-container {
      text-align: center;
      margin: 30px 0;
    }
    .button {
      display: inline-block;
      padding: 12px 30px;
      background: linear-gradient(135deg, #20bf6b 0%, #26a65b 100%);
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
    .work-summary {
      background-color: #e7f3ff;
      padding: 15px;
      border-radius: 6px;
      margin: 20px 0;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🏁 Clock-Out Reminder</h1>
    </div>
    
    <div class="content">
      <div class="greeting">
        Hello <strong>{{userName}}</strong>,
      </div>
      
      <div class="message">
        <strong>ℹ️ End of Day Reminder</strong><br>
        Don't forget to clock out for today to complete your attendance record.
      </div>
      
      <div class="work-summary">
        <h3 style="margin-top: 0; color: #17a2b8;">📊 Today's Work Summary</h3>
        <div class="info-item">
          <span class="info-label">Clock-In Time:</span>
          <span class="info-value">{{clockInTime}}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Expected Clock-Out:</span>
          <span class="info-value highlight">{{expectedTime}}</span>
        </div>
      </div>
      
      <div class="info-box">
        <div class="info-item">
          <span class="info-label">Date:</span>
          <span class="info-value">{{currentDate}}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Grace Period:</span>
          <span class="info-value">{{gracePeriod}} minutes</span>
        </div>
      </div>
      
      <p>
        Please remember to clock out before leaving. This helps us maintain accurate work hour records 
        and ensures proper calculation of your working hours and overtime.
      </p>
      
      <div class="button-container">
        <a href="{{frontendUrl}}/attendance" class="button">Clock Out Now</a>
      </div>
      
      <p class="note">
        <strong>Important:</strong> Forgetting to clock out may result in incomplete attendance records. 
        If you've already left, please contact your supervisor or HR to update your attendance manually.
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
