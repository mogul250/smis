import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: process.env.SMTP_PORT || 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  }

  // Send welcome email to new user
  async sendWelcomeEmail(email, firstName, role) {
    try {
      const mailOptions = {
        from: process.env.SMTP_USER,
        to: email,
        subject: 'Welcome to SMIS - School Management Information System',
        html: `
          <h1>Welcome to SMIS, ${firstName}!</h1>
          <p>Your account has been created successfully as a ${role}.</p>
          <p>You can now log in to the system using your email and password.</p>
          <p>If you have any questions, please contact the administrator.</p>
          <br>
          <p>Best regards,<br>SMIS Team</p>
        `
      };

      await this.transporter.sendMail(mailOptions);
      console.log(`Welcome email sent to ${email}`);
    } catch (error) {
      console.error('Error sending welcome email:', error);
      throw error;
    }
  }

  // Send password reset email
  async sendPasswordResetEmail(email, resetToken) {
    try {
      const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

      const mailOptions = {
        from: process.env.SMTP_USER,
        to: email,
        subject: 'Password Reset - SMIS',
        html: `
          <h1>Password Reset Request</h1>
          <p>You have requested to reset your password for SMIS.</p>
          <p>Click the link below to reset your password:</p>
          <a href="${resetLink}">Reset Password</a>
          <p>This link will expire in 1 hour.</p>
          <p>If you didn't request this, please ignore this email.</p>
          <br>
          <p>Best regards,<br>SMIS Team</p>
        `
      };

      await this.transporter.sendMail(mailOptions);
      console.log(`Password reset email sent to ${email}`);
    } catch (error) {
      console.error('Error sending password reset email:', error);
      throw error;
    }
  }

  // Send grade notification to student
  async sendGradeNotification(email, studentName, courseName, grade) {
    try {
      const mailOptions = {
        from: process.env.SMTP_USER,
        to: email,
        subject: `Grade Update - ${courseName}`,
        html: `
          <h1>Grade Update Notification</h1>
          <p>Dear ${studentName},</p>
          <p>Your grade for ${courseName} has been updated.</p>
          <p><strong>Grade: ${grade}</strong></p>
          <p>Please log in to the system to view detailed information.</p>
          <br>
          <p>Best regards,<br>SMIS Team</p>
        `
      };

      await this.transporter.sendMail(mailOptions);
      console.log(`Grade notification sent to ${email}`);
    } catch (error) {
      console.error('Error sending grade notification:', error);
      throw error;
    }
  }

  // Send fee payment reminder
  async sendFeeReminder(email, studentName, amount, dueDate) {
    try {
      const mailOptions = {
        from: process.env.SMTP_USER,
        to: email,
        subject: 'Fee Payment Reminder',
        html: `
          <h1>Fee Payment Reminder</h1>
          <p>Dear ${studentName},</p>
          <p>This is a reminder that you have outstanding fees amounting to $${amount}.</p>
          <p><strong>Due Date: ${dueDate}</strong></p>
          <p>Please make the payment as soon as possible to avoid any penalties.</p>
          <p>You can view and pay your fees through the student portal.</p>
          <br>
          <p>Best regards,<br>Finance Department</p>
        `
      };

      await this.transporter.sendMail(mailOptions);
      console.log(`Fee reminder sent to ${email}`);
    } catch (error) {
      console.error('Error sending fee reminder:', error);
      throw error;
    }
  }

  // Send attendance alert to parent/guardian
  async sendAttendanceAlert(email, studentName, attendancePercentage, absences) {
    try {
      const mailOptions = {
        from: process.env.SMTP_USER,
        to: email,
        subject: 'Attendance Alert',
        html: `
          <h1>Attendance Alert</h1>
          <p>Dear Parent/Guardian of ${studentName},</p>
          <p>This is to inform you that ${studentName}'s attendance percentage is currently ${attendancePercentage}%.</p>
          <p>Number of absences: ${absences}</p>
          <p>Please ensure regular attendance to maintain academic progress.</p>
          <p>If there are any concerns, please contact the class teacher or HOD.</p>
          <br>
          <p>Best regards,<br>Academic Department</p>
        `
      };

      await this.transporter.sendMail(mailOptions);
      console.log(`Attendance alert sent to ${email}`);
    } catch (error) {
      console.error('Error sending attendance alert:', error);
      throw error;
    }
  }

  // General notification email
  async sendNotification(email, subject, message) {
    try {
      const mailOptions = {
        from: process.env.SMTP_USER,
        to: email,
        subject: subject,
        html: `
          <h1>SMIS Notification</h1>
          <p>${message}</p>
          <br>
          <p>Best regards,<br>SMIS Team</p>
        `
      };

      await this.transporter.sendMail(mailOptions);
      console.log(`Notification sent to ${email}`);
    } catch (error) {
      console.error('Error sending notification:', error);
      throw error;
    }
  }
}

export default new EmailService();
