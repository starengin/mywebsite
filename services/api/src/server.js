const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const { PrismaClient } = require("@prisma/client");
const fs = require("fs");
const path = require("path");
const PDFDocument = require("pdfkit");
const nodemailer = require("nodemailer"); // ✅ ADD (Zoho welcome email)
// ✅ keep ONLY ONE pdfParse (remove other duplicate pdfParse lines)
const pdfParseLib = require("pdf-parse");
const pdfParse = typeof pdfParseLib === "function" ? pdfParseLib : pdfParseLib.default;


dotenv.config();

const axios = require("axios");
const crypto = require("crypto"); // ✅ ADD THIS



const EMAILJS_SERVICE_ID = process.env.EMAILJS_SERVICE_ID;
const EMAILJS_TEMPLATE_ID = process.env.EMAILJS_TEMPLATE_ID;
const EMAILJS_PUBLIC_KEY = process.env.EMAILJS_PUBLIC_KEY;
const EMAILJS_PRIVATE_KEY = process.env.EMAILJS_PRIVATE_KEY; // optional

async function sendOtpEmail({ to_email, to_name, otp, expiry_minutes }) {
  if (!EMAILJS_SERVICE_ID || !EMAILJS_TEMPLATE_ID || !EMAILJS_PUBLIC_KEY) {
    throw new Error("EmailJS env missing");
  }

  const payload = {
    service_id: EMAILJS_SERVICE_ID,
    template_id: EMAILJS_TEMPLATE_ID,
    user_id: EMAILJS_PUBLIC_KEY,
    template_params: {
      to_email,
      to_name: to_name || "Admin",
      otp,
      expiry_minutes: String(expiry_minutes || 3),
      app_name: "STAR Engineering Admin Portal",
      login_time: new Date().toLocaleString("en-IN"),
    },
  };

  if (EMAILJS_PRIVATE_KEY) payload.accessToken = EMAILJS_PRIVATE_KEY;

  await axios.post("https://api.emailjs.com/api/v1.0/email/send", payload, {
    headers: { "Content-Type": "application/json" },
    timeout: 15000,
  });
}
/* =========================
   ZOHO SMTP (WELCOME EMAIL)
========================= */
const smtp = nodemailer.createTransport({
  host: process.env.ZOHO_SMTP_HOST || "smtp.zoho.in",
  port: Number(process.env.ZOHO_SMTP_PORT || 465),
  secure: String(process.env.ZOHO_SMTP_SECURE || "true") === "true",
  auth: {
    user: process.env.ZOHO_EMAIL,
    pass: process.env.ZOHO_APP_PASSWORD,
  },
});

function welcomeEmailHTML({ name, email, password }) {
  const company = process.env.COMPANY_NAME || "STAR ENGINEERING";
  const loginUrl = process.env.LOGIN_URL || "https://www.stareng.co.in/login";
  const logoUrl =
    process.env.MAIL_LOGO_URL ||
    "https://docs5.odoo.com/documents/content/Zir5Nx_CQDG3RHRyCDjt9gof5?download=0";

  const party = name || "Customer";

  return `
<table align="center" width="100%" cellpadding="0" cellspacing="0" style="
  max-width:600px;
  margin:30px auto;
  border-radius:16px;
  overflow:hidden;
  font-family:Arial,Helvetica,sans-serif;
  background:
    radial-gradient(900px 420px at 15% 0%, rgba(255,0,102,0.16), transparent 60%),
    radial-gradient(760px 380px at 95% 18%, rgba(0,102,255,0.15), transparent 55%),
    radial-gradient(920px 520px at 80% 110%, rgba(255,170,0,0.16), transparent 60%),
    radial-gradient(820px 420px at 52% 105%, rgba(163,0,255,0.12), transparent 65%),
    linear-gradient(145deg,#fbfcff,#f2f6ff,#ffffff);
  box-shadow: 0 24px 60px rgba(17,24,39,0.24), 0 10px 24px rgba(17,24,39,0.12);
">
  <tbody>

    <!-- HEADER -->
    <tr>
      <td style="
        background:
          radial-gradient(900px 260px at 18% 0%, rgba(255,220,160,0.18), transparent 55%),
          linear-gradient(135deg,#3b0000,#6a0000,#9a0000,#a100ff,#ff0066,#ff7a00);
        padding:22px 24px;
        color:#ffffff;
        box-shadow: inset 0 -10px 20px rgba(0,0,0,0.30), 0 10px 22px rgba(0,0,0,0.18);
      ">
        <div style="
          height:4px;
          background:linear-gradient(90deg, rgba(255,255,255,0.06), rgba(255,232,190,0.58), rgba(255,255,255,0.10));
          border-radius:999px;
          margin-bottom:14px;
          box-shadow:0 2px 10px rgba(0,0,0,0.25);
        "></div>

        <table width="100%" cellpadding="0" cellspacing="0">
          <tbody>
            <tr>
              <td width="100" valign="middle">
                <img src="${logoUrl}" alt="${company}" style="
                  max-width:80px;
                  display:block;
                  border-radius:10px;
                  box-shadow:0 14px 26px rgba(0,0,0,0.35);
                  border:1px solid rgba(255,232,190,0.45);
                ">
              </td>
              <td valign="middle" style="padding-left:12px;">
                <h1 style="
                  margin:0;
                  font-size:22px;
                  letter-spacing:1px;
                  color:#ffffff;
                  font-weight:bold;
                  text-shadow:0 4px 14px rgba(0,0,0,0.50);
                ">${company}</h1>
                <p style="
                  margin:6px 0 0 0;
                  font-size:15px;
                  color:#fff1f7;
                  font-weight:bold;
                  text-shadow:0 3px 12px rgba(0,0,0,0.45);
                ">Customer Portal Access</p>
              </td>
            </tr>
          </tbody>
        </table>
      </td>
    </tr>

    <!-- BODY -->
    <tr>
      <td style="padding:0">
        <div style="
          padding:22px 20px 18px 20px;
          color:#111827;
          background:
            radial-gradient(900px 260px at 12% 0%, rgba(255,170,0,0.12), transparent 60%),
            radial-gradient(820px 240px at 88% 0%, rgba(163,0,255,0.10), transparent 60%),
            linear-gradient(180deg,rgba(255,255,255,0.92),rgba(255,255,255,0.82));
          border-top:1px solid rgba(255,232,190,0.35);
        ">
          <p style="font-size:16px; margin:0 0 12px 0;">
            Dear <b>${party}</b>,<br>
          </p>

          <p style="font-size:15px; line-height:1.8; margin:0 0 18px 0; color:#1f2937;">
            Greetings from <b>${company}</b>.<br>
            Your customer portal account has been successfully created. Please use the credentials below to login.
          </p>

          <!-- SUMMARY TABLE -->
          <div style="
            border-radius:12px;
            overflow:hidden;
            border:1px solid rgba(255,232,190,0.55);
            box-shadow: 0 16px 30px rgba(17,24,39,0.14), inset 0 1px 0 rgba(255,255,255,0.78);
            background:linear-gradient(180deg,rgba(255,255,255,0.95),rgba(255,255,255,0.88));
          ">
            <table width="100%" cellpadding="10" cellspacing="0" style="font-size:15px;font-family:Arial,Helvetica,sans-serif;border-collapse:collapse;">
              <tbody>
                <tr style="background:linear-gradient(90deg,#fff0f0,#ffffff);">
                  <td width="45%" style="padding:12px 14px;border-bottom:1px solid rgba(17,24,39,0.08);"><b>Login Email</b></td>
                  <td style="padding:12px 14px;border-bottom:1px solid rgba(17,24,39,0.08);">${email}</td>
                </tr>
                <tr style="background:linear-gradient(90deg,#fff6ec,#ffffff);">
                  <td style="padding:12px 14px;border-bottom:1px solid rgba(17,24,39,0.08);"><b>Password</b></td>
                  <td style="padding:12px 14px;border-bottom:1px solid rgba(17,24,39,0.08);">
                    <span style="font-weight:bold;color:#7a0000;">${password}</span>
                  </td>
                </tr>
                <tr style="background:linear-gradient(90deg,#ffffff,#ffffff);">
                  <td style="padding:12px 14px;"><b>Portal Link</b></td>
                  <td style="padding:12px 14px;">
                    <a href="${loginUrl}" target="_blank" style="color:#a100ff;text-decoration:none;font-weight:bold;">
                      ${loginUrl}
                    </a>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- CTA BUTTON -->
          <div style="margin-top:18px; text-align:center;">
            <a href="${loginUrl}" target="_blank" style="
              display:inline-block;
              background:linear-gradient(135deg,#3b0000,#a100ff,#ff0066,#ff7a00);
              color:#ffffff;
              padding:12px 18px;
              text-decoration:none;
              border-radius:999px;
              font-size:14px;
              font-weight:bold;
              box-shadow:0 10px 22px rgba(0,0,0,0.20);
              border:1px solid rgba(255,232,190,0.35);
            ">Login to Portal →</a>
          </div>

          <!-- SUPPORT BOX -->
          <div style="
            margin-top:18px;
            padding:16px;
            border-radius:12px;
            background:
              radial-gradient(700px 180px at 15% 0%, rgba(255,0,102,0.12), transparent 55%),
              radial-gradient(760px 200px at 95% 0%, rgba(0,102,255,0.10), transparent 60%),
              linear-gradient(180deg,#ffffff,#fff7fb);
            border:1px dashed rgba(255,170,0,0.70);
            box-shadow: inset 0 1px 0 rgba(255,255,255,0.78);
          ">
            <p style="font-size:15px;line-height:1.75;margin:0;color:#1f2937;">
              For any clarification, please contact our team at
              <a href="mailto:corporate@stareng.co.in" style="color:#a100ff;text-decoration:none;font-weight:bold;" target="_blank">
                corporate@stareng.co.in
              </a>
            </p>

            <p style="font-size:15px;margin:16px 0 0 0;color:#1f2937;">
              Warm Regards,<br>
              <b>${company}</b><br>
              📧 <a target="_blank" href="mailto:corporate@stareng.co.in" style="color:#a100ff;text-decoration:none;font-weight:bold;">
                corporate@stareng.co.in
              </a><br>
              🌐 <a href="https://www.stareng.co.in" style="color:#a100ff;text-decoration:none;font-weight:bold;" target="_blank">
                www.stareng.co.in
              </a>
            </p>
          </div>

        </div>
      </td>
    </tr>

    <!-- FOOTER -->
    <tr>
      <td style="
        background:
          radial-gradient(900px 220px at 20% 0%, rgba(255,0,102,0.10), transparent 60%),
          radial-gradient(900px 220px at 80% 0%, rgba(0,102,255,0.10), transparent 60%),
          linear-gradient(180deg,#f4f4f6,#efeff2);
        padding:16px;
        text-align:center;
        font-size:12px;
        color:#6b7280;
        border-top:1px solid rgba(17,24,39,0.08);
      ">
        <div style="font-weight:bold; color:#111827; margin-bottom:6px;">
          This is a system-generated email. Please do not reply to this email.
        </div>

        <div style="
          height:2px;
          width:160px;
          margin:10px auto;
          border-radius:999px;
          background:linear-gradient(90deg, rgba(161,0,255,0.25), rgba(255,122,0,0.35), rgba(0,102,255,0.25));
        "></div>

        <div style="line-height:1.7;">
          📧 <a target="_blank" href="mailto:corporate@stareng.co.in" style="color:#a100ff;text-decoration:none;font-weight:bold;">
            corporate@stareng.co.in
          </a><br>
          💬 <a target="_blank" href="https://wa.me/917045276723" style="color:#111827;text-decoration:none;font-weight:bold;">
            WhatsApp: +91-7045276723
          </a><br>
          🌐 <a href="https://www.stareng.co.in" style="color:#111827;text-decoration:none;font-weight:bold;" target="_blank">
            www.stareng.co.in
          </a>
        </div>

        <div style="
          height:2px;
          width:160px;
          margin:10px auto;
          border-radius:999px;
          background:linear-gradient(90deg, rgba(161,0,255,0.25), rgba(255,122,0,0.35), rgba(0,102,255,0.25));
        "></div>

        <div style="margin-top:6px; line-height:1.7;">
          Terms &amp; Conditions:
          <a href="https://www.stareng.co.in/terms" style="color:#6b7280; text-decoration:none;" target="_blank">
            www.stareng.co.in/terms
          </a>
        </div>
      </td>
    </tr>

  </tbody>
</table>
`;
}

// ✅ Corporate inquiry email (premium)
function contactInquiryEmailHTML({
  name, company, phone, email, city, material, details, preferred, subject, page,
}) {
  const companyName = process.env.COMPANY_NAME || "STAR ENGINEERING";
  const logoUrl =
    process.env.MAIL_LOGO_URL ||
    "https://docs5.odoo.com/documents/content/Zir5Nx_CQDG3RHRyCDjt9gof5?download=0";

  const safe = {
    name: esc(name || "-"),
    company: esc(company || "-"),
    phone: esc(phone || "-"),
    email: esc(email || "-"),
    city: esc(city || "-"),
    material: esc(material || "ALL"),
    details: esc(details || "-"),
    preferred: esc(preferred || "Call"),
    subject: esc(subject || "Requirement Enquiry"),
    page: esc(page || "-"),
  };

  return `
${/* same template but with bigger fonts */""}
<table align="center" width="100%" cellpadding="0" cellspacing="0" style=" max-width:600px; margin:30px auto; border-radius:16px; overflow:hidden; font-family:Arial,Helvetica,sans-serif;
background: radial-gradient(900px 420px at 15% 0%, rgba(255,0,102,0.16), transparent 60%),
radial-gradient(760px 380px at 95% 18%, rgba(0,102,255,0.15), transparent 55%),
radial-gradient(920px 520px at 80% 110%, rgba(255,170,0,0.16), transparent 60%),
radial-gradient(820px 420px at 52% 105%, rgba(163,0,255,0.12), transparent 65%),
linear-gradient(145deg,#fbfcff,#f2f6ff,#ffffff);
box-shadow: 0 24px 60px rgba(17,24,39,0.24), 0 10px 24px rgba(17,24,39,0.12); ">
  <tbody>
    <tr>
      <td style=" background: radial-gradient(900px 260px at 18% 0%, rgba(255,220,160,0.18), transparent 55%),
      linear-gradient(135deg,#3b0000,#6a0000,#9a0000,#a100ff,#ff0066,#ff7a00);
      padding:22px 24px; color:#ffffff;
      box-shadow: inset 0 -10px 20px rgba(0,0,0,0.30), 0 10px 22px rgba(0,0,0,0.18); ">
        <div style="height:4px;background:linear-gradient(90deg, rgba(255,255,255,0.06), rgba(255,232,190,0.58), rgba(255,255,255,0.10)); border-radius:999px; margin-bottom:14px;"></div>
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td width="100" valign="middle">
              <img src="${logoUrl}" alt="${companyName}" style="max-width:80px; display:block; border-radius:10px; box-shadow:0 14px 26px rgba(0,0,0,0.35); border:1px solid rgba(255,232,190,0.45);">
            </td>
            <td valign="middle" style="padding-left:12px;">
              <h1 style="margin:0; font-size:22px; letter-spacing:1px; color:#ffffff; font-weight:bold;">${companyName}</h1>
              <p style="margin:6px 0 0 0; font-size:15px; color:#fff1f7; font-weight:bold;">New Requirement / Inquiry</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <tr>
      <td style="padding:0">
        <div style="padding:22px 20px 18px 20px; color:#111827; background:
          radial-gradient(900px 260px at 12% 0%, rgba(255,170,0,0.12), transparent 60%),
          radial-gradient(820px 240px at 88% 0%, rgba(163,0,255,0.10), transparent 60%),
          linear-gradient(180deg,rgba(255,255,255,0.92),rgba(255,255,255,0.82));
          border-top:1px solid rgba(255,232,190,0.35);">

          <p style="font-size:16px; margin:0 0 12px 0;">
            Hello Team,<br><b>New inquiry received from website.</b>
          </p>

          <p style="font-size:15px; line-height:1.8; margin:0 0 18px 0; color:#1f2937;">
            Subject: <b>${safe.subject}</b><br>
            Please contact the customer as per preference.
          </p>

          <div style="border-radius:12px; overflow:hidden; border:1px solid rgba(255,232,190,0.55);
            box-shadow: 0 16px 30px rgba(17,24,39,0.14), inset 0 1px 0 rgba(255,255,255,0.78);
            background:linear-gradient(180deg,rgba(255,255,255,0.95),rgba(255,255,255,0.88));">
            <table width="100%" cellpadding="10" cellspacing="0" style="font-size:15px; font-family:Arial,Helvetica,sans-serif; border-collapse:collapse;">
              <tbody>
                <tr style="background:linear-gradient(90deg,#fff0f0,#ffffff);"><td width="45%" style="padding:12px 14px;border-bottom:1px solid rgba(17,24,39,0.08);"><b>Name</b></td><td style="padding:12px 14px;border-bottom:1px solid rgba(17,24,39,0.08);">${safe.name}</td></tr>
                <tr style="background:#fff;"><td style="padding:12px 14px;border-bottom:1px solid rgba(17,24,39,0.08);"><b>Company</b></td><td style="padding:12px 14px;border-bottom:1px solid rgba(17,24,39,0.08);">${safe.company}</td></tr>
                <tr style="background:linear-gradient(90deg,#eef4ff,#ffffff);"><td style="padding:12px 14px;border-bottom:1px solid rgba(17,24,39,0.08);"><b>Phone</b></td><td style="padding:12px 14px;border-bottom:1px solid rgba(17,24,39,0.08);"><b>${safe.phone}</b></td></tr>
                <tr style="background:linear-gradient(90deg,#fff6ec,#ffffff);"><td style="padding:12px 14px;border-bottom:1px solid rgba(17,24,39,0.08);"><b>Email</b></td><td style="padding:12px 14px;border-bottom:1px solid rgba(17,24,39,0.08);">${safe.email}</td></tr>
                <tr style="background:#fff;"><td style="padding:12px 14px;border-bottom:1px solid rgba(17,24,39,0.08);"><b>City / Location</b></td><td style="padding:12px 14px;border-bottom:1px solid rgba(17,24,39,0.08);">${safe.city}</td></tr>
                <tr style="background:linear-gradient(90deg,#fff0f0,#ffffff);"><td style="padding:12px 14px;border-bottom:1px solid rgba(17,24,39,0.08);"><b>Material</b></td><td style="padding:12px 14px;border-bottom:1px solid rgba(17,24,39,0.08);"><span style="font-weight:bold;color:#7a0000;">${safe.material}</span></td></tr>
                <tr style="background:linear-gradient(90deg,#f6f0ff,#ffffff);"><td style="padding:12px 14px;border-bottom:1px solid rgba(17,24,39,0.08);"><b>Preferred Contact</b></td><td style="padding:12px 14px;border-bottom:1px solid rgba(17,24,39,0.08);">${safe.preferred}</td></tr>
                <tr style="background:#fff;"><td style="padding:12px 14px;"><b>Requirement Details</b></td><td style="padding:12px 14px; line-height:1.8;">${safe.details}</td></tr>
              </tbody>
            </table>
          </div>

          <div style="margin-top:16px; padding:16px; border-radius:12px; background:linear-gradient(180deg,#ffffff,#fff7fb);
          border:1px dashed rgba(255,170,0,0.70);">
            <p style="font-size:14px; margin:0; color:#1f2937;"><b>Page Source:</b> <span style="color:#6b7280;">${safe.page}</span></p>
          </div>

          <div style="margin-top:18px; text-align:center;">
            <a href="https://wa.me/917045276723" target="_blank" style="display:inline-block;
              background:linear-gradient(135deg,#3b0000,#a100ff,#ff0066,#ff7a00);
              color:#ffffff; padding:12px 18px; text-decoration:none; border-radius:999px;
              font-size:14px; font-weight:bold; box-shadow:0 10px 22px rgba(0,0,0,0.20);
              border:1px solid rgba(255,232,190,0.35);">Open WhatsApp →</a>
          </div>

        </div>
      </td>
    </tr>

    <tr>
      <td style="background:linear-gradient(180deg,#f4f4f6,#efeff2); padding:16px; text-align:center; font-size:12px; color:#6b7280; border-top:1px solid rgba(17,24,39,0.08);">
        <div style="font-weight:bold; color:#111827; margin-bottom:6px;">System-generated inquiry email. Please do not reply.</div>
        <div style="line-height:1.7;">
          📧 <a target="_blank" href="mailto:corporate@stareng.co.in" style="color:#a100ff;text-decoration:none;font-weight:bold;">corporate@stareng.co.in</a><br>
          📞 <a href="tel:+919702485922" style="color:#111827;text-decoration:none;font-weight:bold;">Call Now: +91-9702485922</a><br>
          💬 <a target="_blank" href="https://wa.me/917045276723" style="color:#111827;text-decoration:none;font-weight:bold;">WhatsApp: +91-7045276723</a>
        </div>
      </td>
    </tr>
  </tbody>
</table>`;
}

// ✅ Customer ack email (premium)
function contactCustomerAckEmailHTML({ name, subject }) {
  const companyName = process.env.COMPANY_NAME || "STAR ENGINEERING";
  const logoUrl =
    process.env.MAIL_LOGO_URL ||
    "https://docs5.odoo.com/documents/content/Zir5Nx_CQDG3RHRyCDjt9gof5?download=0";

  const safeName = esc(name || "Customer");
  const safeSubject = esc(subject || "Requirement Enquiry");

  return `
<table align="center" width="100%" cellpadding="0" cellspacing="0" style=" max-width:600px; margin:30px auto; border-radius:16px; overflow:hidden; font-family:Arial,Helvetica,sans-serif;
background: radial-gradient(900px 420px at 15% 0%, rgba(255,0,102,0.16), transparent 60%),
radial-gradient(760px 380px at 95% 18%, rgba(0,102,255,0.15), transparent 55%),
radial-gradient(920px 520px at 80% 110%, rgba(255,170,0,0.16), transparent 60%),
radial-gradient(820px 420px at 52% 105%, rgba(163,0,255,0.12), transparent 65%),
linear-gradient(145deg,#fbfcff,#f2f6ff,#ffffff);
box-shadow: 0 24px 60px rgba(17,24,39,0.24), 0 10px 24px rgba(17,24,39,0.12); ">
  <tbody>
    <tr>
      <td style="background:linear-gradient(135deg,#3b0000,#6a0000,#9a0000,#a100ff,#ff0066,#ff7a00); padding:22px 24px; color:#ffffff;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td width="100" valign="middle">
              <img src="${logoUrl}" alt="${companyName}" style="max-width:80px; display:block; border-radius:10px; border:1px solid rgba(255,232,190,0.45);">
            </td>
            <td valign="middle" style="padding-left:12px;">
              <h1 style="margin:0; font-size:22px; letter-spacing:1px; color:#ffffff; font-weight:bold;">${companyName}</h1>
              <p style="margin:6px 0 0 0; font-size:15px; color:#fff1f7; font-weight:bold;">Requirement Received</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <tr>
      <td style="padding:0">
        <div style="padding:22px 20px 18px 20px; background:linear-gradient(180deg,rgba(255,255,255,0.92),rgba(255,255,255,0.82));">
          <p style="font-size:16px; margin:0 0 12px 0;">Dear <b>${safeName}</b>,</p>
          <p style="font-size:15px; line-height:1.8; margin:0 0 14px 0; color:#1f2937;">
            Thank you! We received your requirement (<b>${safeSubject}</b>). Our team will contact you shortly.
          </p>

          <div style="margin-top:14px; padding:16px; border-radius:12px; background:linear-gradient(180deg,#ffffff,#fff7fb); border:1px dashed rgba(255,170,0,0.70);">
            <p style="font-size:15px; margin:0; color:#1f2937;">
              For faster processing, please call Sales:
              <b> +91-7045276723</b> (8:30 am to 7:30 pm)
            </p>
          </div>

          <div style="margin-top:18px; text-align:center;">
            <a href="tel:+917045276723" style="display:inline-block; background:linear-gradient(135deg,#3b0000,#a100ff,#ff0066,#ff7a00);
            color:#fff; padding:12px 18px; border-radius:999px; text-decoration:none; font-weight:bold;">Call Sales →</a>
          </div>
        </div>
      </td>
    </tr>

    <tr>
      <td style="background:linear-gradient(180deg,#f4f4f6,#efeff2); padding:16px; text-align:center; font-size:12px; color:#6b7280;">
        <div style="font-weight:bold; color:#111827; margin-bottom:6px;">This is a system-generated email. Please do not reply.</div>
        <div style="line-height:1.7;">
          📧 <a target="_blank" href="mailto:corporate@stareng.co.in" style="color:#a100ff;text-decoration:none;font-weight:bold;">corporate@stareng.co.in</a><br>
          💬 <a target="_blank" href="https://wa.me/917045276723" style="color:#111827;text-decoration:none;font-weight:bold;">WhatsApp: +91-7045276723</a><br>
          🌐 <a href="https://www.stareng.co.in" style="color:#111827;text-decoration:none;font-weight:bold;" target="_blank">www.stareng.co.in</a>
        </div>
      </td>
    </tr>
  </tbody>
</table>`;
}
function esc(s = "") {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
// ✅ allow any vercel preview (optional but best)
function isAllowedOrigin(origin) {
  try {
    const host = new URL(origin).hostname;
    if (host.endsWith(".vercel.app")) return true;
    return ALLOWED_ORIGINS.includes(origin);
  } catch {
    return false;
  }
}

const app = express();
const prisma = new PrismaClient();
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
// ✅ CORS (Production-safe + Dev-safe)
const ALLOWED_ORIGINS = new Set([
  "http://localhost:5173",
  "http://localhost:3000",

  "https://www.stareng.co.in",
  "https://stareng.co.in",

  "https://portal.stareng.co.in",   // ✅ ADD THIS (customer portal)
  "https://admin.stareng.co.in",    // ✅ admin domain

  "https://stareng.vercel.app",
  "https://stareng-admin.vercel.app",
]);

const corsOptions = {
  origin: (origin, cb) => {
    // ✅ allow Postman/curl/server-to-server (no origin)
    if (!origin) return cb(null, true);

    // ✅ allow exact domains
    if (ALLOWED_ORIGINS.has(origin)) return cb(null, true);

    // ✅ allow ANY vercel preview domain
    if (/^https:\/\/.*\.vercel\.app$/.test(origin)) return cb(null, true);

    // ❗ IMPORTANT: don't throw error (it breaks preflight)
    return cb(null, false);
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

// ✅ Put CORS BEFORE all routes
app.use(cors(corsOptions));

// ✅ Preflight for all routes (MUST use same options)
app.options("*", cors(corsOptions));

// ✅ PASTE HERE (move)
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || "secret";
const UPLOAD_DIR = path.resolve(process.cwd(), process.env.UPLOAD_DIR || "uploads");

if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });
app.use("/uploads", express.static(UPLOAD_DIR));

// ✅ Admin credentials from .env (DO NOT hardcode in frontend)
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "corporate@stareng.co.in";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "@N$@R1_@y@n.";

// In-memory stores (simple & fast)
const captchaStore = new Map(); // captchaId -> { answer, exp }
const tempStore = new Map(); // tempToken -> { otp, exp, tries }

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function makeId() {
  return crypto.randomBytes(16).toString("hex");
}

function now() {
  return Date.now();
}
// ✅ Dashboard (Admin)
app.get("/dashboard", async (req, res) => {
  try {
    const from = req.query.from ? new Date(req.query.from) : new Date(Date.now() - 30 * 86400000);
    const to = req.query.to ? new Date(req.query.to) : new Date();

    // include full day end for "to"
    to.setHours(23, 59, 59, 999);

    // ✅ pick correct model names
    const models = Object.keys(prisma).filter(
      (k) => prisma[k] && typeof prisma[k].findMany === "function"
    );

    const pick = (names) => names.find((n) => prisma[n] && typeof prisma[n].findMany === "function");

    const userModel =
      pick(["customer", "Customer", "customers", "Customers", "user", "User", "users", "Users", "party", "Party"]) || null;

    const txnModel =
      pick(["transaction", "Transaction", "transactions", "Transactions", "txn", "Txn", "voucher", "Voucher"]) || null;

    const usersCount = userModel ? await prisma[userModel].count() : 0;

    const wherePeriod = { date: { gte: from, lte: to } }; // ✅ if your field is txnDate, change here

    const transactionsCount = txnModel
      ? await prisma[txnModel].count({ where: wherePeriod })
      : 0;

    // helper to sum by type
    async function sumByType(type) {
      if (!txnModel) return 0;

      // ✅ if your fields are different, adjust:
      // type field: "type" (SALE/PURCHASE/...)
      // amount field: "amount"
      const agg = await prisma[txnModel].aggregate({
        where: { ...wherePeriod, type },
        _sum: { amount: true },
      });

      return Number(agg?._sum?.amount || 0);
    }

    const totalSales = await sumByType("SALE");
    const totalPurchase = await sumByType("PURCHASE");
    const totalReceipt = await sumByType("RECEIPT");
    const totalPayment = await sumByType("PAYMENT");
    const totalSalesReturn = await sumByType("SALES_RETURN");
    const totalPurchaseReturn = await sumByType("PURCHASE_RETURN");

    return res.json({
      usersCount,
      transactionsCount,
      totalSales,
      totalPurchase,
      totalReceipt,
      totalPayment,
      totalSalesReturn,
      totalPurchaseReturn,
      // debug only (remove later):
      models,
      using: { userModel, txnModel },
      period: { from, to },
    });
  } catch (e) {
    console.error("DASHBOARD ERROR:", e);
    return res.status(500).json({ message: e.message || "Dashboard failed" });
  }
});
app.post("/public/contact", async (req, res) => {
  try {
    const { name, company, phone, email, city, material, details, subject, preferred, page } = req.body || {};

    if (!name || String(name).trim().length < 2) return res.status(400).json({ message: "Name is required" });

    const digits = String(phone || "").replace(/\D/g, "");
    if (digits.length < 10) return res.status(400).json({ message: "Valid phone is required" });

    if (!city || String(city).trim().length < 2) return res.status(400).json({ message: "City is required" });

    if (!details || String(details).trim().length < 10)
      return res.status(400).json({ message: "Requirement details are required" });

    const toEmail = process.env.CONTACT_TO_EMAIL || "corporate@stareng.co.in";
    const fromEmail = process.env.ZOHO_EMAIL; // ✅ must exist
    const fromName = process.env.CONTACT_FROM_NAME || "STAR ENGINEERING";

    const finalSubject =
      subject && String(subject).trim()
        ? String(subject).trim()
        : "STAR Engineering – Requirement Enquiry";

    // ✅ 1) Mail to corporate (premium template)
    await smtp.sendMail({
      from: `"${fromName}" <${fromEmail}>`,
      to: toEmail,
      subject: finalSubject,
      html: contactInquiryEmailHTML({
        name, company, phone, email, city,
        material, details, preferred,
        subject: finalSubject,
        page,
      }),
      replyTo: email ? String(email).trim() : undefined,
    });

    // ✅ 2) Acknowledgement to customer (if email provided) — premium template
    if (email && String(email).trim()) {
      await smtp.sendMail({
        from: `"${fromName}" <${fromEmail}>`,
        to: String(email).trim(),
        subject: "We received your requirement – STAR Engineering",
        html: contactCustomerAckEmailHTML({
          name,
          subject: finalSubject,
        }),
      });
    }

    return res.json({ ok: true });
  } catch (e) {
    console.error("CONTACT ERROR:", e);
    return res.status(500).json({ message: "Email service failed", details: String(e.message || e) });
  }
});
// ✅ Captcha endpoint (server generates & validates)
app.get("/admin/captcha", (req, res) => {
  const a = randInt(2, 9);
  const b = randInt(1, 9);
  const op = Math.random() > 0.5 ? "+" : "-";
  const answer = op === "+" ? a + b : a - b;

  const captchaId = makeId();
  captchaStore.set(captchaId, { answer: String(answer), exp: now() + 2 * 60 * 1000 }); // 2 min

  res.json({ captchaId, question: `${a} ${op} ${b} = ?` });
});



// ✅ Step1: verify captcha + admin creds -> send tempToken
app.post("/admin/login-step1", async (req, res) => {
  try {
    const { email, password, captchaId, captchaAnswer } = req.body || {};

    if (!email || !password || !captchaId || !captchaAnswer) {
      return res.status(400).json({ message: "Missing fields" });
    }

    const cap = captchaStore.get(captchaId);
    if (!cap || cap.exp < now()) {
      return res.status(400).json({ message: "Captcha expired. Refresh." });
    }
    captchaStore.delete(captchaId);

    if (String(captchaAnswer).trim() !== String(cap.answer).trim()) {
      return res.status(401).json({ message: "Captcha incorrect" });
    }

    if (String(email).trim().toLowerCase() !== String(ADMIN_EMAIL).trim().toLowerCase()) {
      return res.status(401).json({ message: "Invalid Admin ID" });
    }

    if (String(password) !== String(ADMIN_PASSWORD)) {
      return res.status(401).json({ message: "Invalid Password" });
    }

    // ✅ Generate OTP (6 digits)
    const otp = String(randInt(100000, 999999));
    const tempToken = makeId();

    tempStore.set(tempToken, {
      otp,
      exp: now() + 3 * 60 * 1000, // 3 min
      tries: 0,
    });

    // For now show OTP in server console (later email/SMS)
    // ✅ Send OTP via EmailJS
await sendOtpEmail({
  to_email: ADMIN_EMAIL,
  to_name: "Corporate Admin",
  otp,
  expiry_minutes: 3,
});

    res.json({ tempToken, requires2FA: true });
  } catch (e) {
    console.error("STEP1 ERROR:", e?.response?.data || e?.message || e);
    return res.status(500).json({
      message: "Server error",
      details: e?.response?.data || e?.message || String(e),
       });
  }
});

// ✅ Step2: verify OTP -> issue JWT
app.post("/admin/login-step2", async (req, res) => {
  try {
    const { tempToken, otp } = req.body || {};
    if (!tempToken || !otp) return res.status(400).json({ message: "Missing fields" });

    const rec = tempStore.get(tempToken);
    if (!rec || rec.exp < now()) {
      return res.status(401).json({ message: "OTP expired. Login again." });
    }

    rec.tries += 1;
    if (rec.tries > 5) {
      tempStore.delete(tempToken);
      return res.status(429).json({ message: "Too many attempts. Login again." });
    }

    if (String(otp).trim() !== String(rec.otp)) {
      return res.status(401).json({ message: "Invalid OTP" });
    }

    tempStore.delete(tempToken);

    const token = jwt.sign(
      { role: "ADMIN", email: ADMIN_EMAIL },
      JWT_SECRET,
      { expiresIn: "12h" }
    );

    res.json({ token });
  } catch (e) {
    res.status(500).json({ message: "Server error" });
  }
});

/* =========================
   CREATE ADMIN IF NOT EXISTS
========================= */
async function ensureAdmin() {
  const email = "corporate@stareng.co.in";
  const password = "@N$@R1_@y@n.";

  const hash = await bcrypt.hash(password, 10);

  const existing = await prisma.user.findFirst({ where: { role: "ADMIN" } });

  if (!existing) {
    await prisma.user.create({
      data: { role: "ADMIN", name: "Admin", email, passwordHash: hash },
    });
    console.log("✅ Admin created:", email);
  } else {
    await prisma.user.update({
      where: { id: existing.id },
      data: { email, passwordHash: hash },
    });
    console.log("✅ Admin updated:", email);
  }
}
ensureAdmin();

/* =========================
   AUTH
========================= */

// ✅ ADMIN LOGIN (email + password)
app.post("/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await prisma.user.findFirst({
      where: {
        email: String(email).toLowerCase().trim(),
        role: "ADMIN",
      },
      select: { id: true, name: true, email: true, passwordHash: true, role: true },
    });

    if (!user) {
      return res.status(401).json({ message: "Admin email is not registered" });
    }

    const ok = await bcrypt.compare(String(password), user.passwordHash || "");
    if (!ok) {
      return res.status(401).json({ message: "Wrong password" });
    }

    const token = jwt.sign({ id: user.id, role: "ADMIN" }, JWT_SECRET, { expiresIn: "7d" });

    return res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    console.error("ADMIN LOGIN ERROR:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

// ✅ Admin Login (alternate route)
app.post("/admin-auth/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await prisma.user.findFirst({
      where: { email: String(email).toLowerCase().trim(), role: "ADMIN" },
      select: { id: true, name: true, email: true, passwordHash: true },
    });

    if (!user) return res.status(401).json({ message: "Admin not found" });

    const ok = await bcrypt.compare(String(password), user.passwordHash || "");
    if (!ok) return res.status(401).json({ message: "Wrong password" });

    const token = jwt.sign({ id: user.id, role: "ADMIN" }, JWT_SECRET, { expiresIn: "7d" });

    return res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email, role: "ADMIN" },
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: "Server error" });
  }
});

/* =========================
   CUSTOMER PORTAL AUTH + MIDDLEWARE
========================= */

function requireCustomer(req, res, next) {
  try {
    const auth = req.headers.authorization || "";
    const headerToken = auth.startsWith("Bearer ") ? auth.slice(7) : null;
    const queryToken = req.query && req.query.token ? String(req.query.token) : null;

    const token = headerToken || queryToken;
    if (!token) return res.status(401).json({ message: "Unauthorized" });

    const payload = jwt.verify(token, JWT_SECRET);
    if (!payload || payload.role !== "CUSTOMER") {
      return res.status(401).json({ message: "Unauthorized" });
    }

    req.customerId = payload.id;
    next();
  } catch {
    return res.status(401).json({ message: "Unauthorized" });
  }
}

function requireAdminOrSameCustomer(req, res, next) {
  try {
    const auth = req.headers.authorization || "";
    const headerToken = auth.startsWith("Bearer ") ? auth.slice(7) : null;
    const queryToken = req.query?.token ? String(req.query.token) : null;

    const token = headerToken || queryToken;
    if (!token) return res.status(401).json({ message: "Unauthorized" });

    const payload = jwt.verify(token, JWT_SECRET);
    req.auth = payload;

    const partyId = Number(req.params.partyId);
    if (!partyId) return res.status(400).json({ message: "Invalid partyId" });

    if (payload.role === "ADMIN") return next();
    if (payload.role === "CUSTOMER" && payload.id === partyId) return next();

    return res.status(403).json({ message: "Forbidden" });
  } catch {
    return res.status(401).json({ message: "Unauthorized" });
  }
}
// ✅ Customer Login
app.post("/customer-auth/login", async (req, res) => {
    console.log("CUSTOMER LOGIN BODY:", req.body);
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password required" });
    }

const user = await prisma.user.findFirst({
  where: { email: String(email).toLowerCase().trim(), role: "CUSTOMER" },
});

    if (!user) return res.status(401).json({ message: "Invalid credentials" });

    const ok = await bcrypt.compare(String(password), user.passwordHash);
    if (!ok) return res.status(401).json({ message: "Invalid credentials" });

    const token = jwt.sign({ id: user.id, role: "CUSTOMER" }, JWT_SECRET, { expiresIn: "7d" });

    res.json({
      token,
      user: { id: user.id, name: user.name || "Customer", email: user.email },
    });
  } catch (e) {
    return res.status(500).json({ message: e.message || "Login failed" });
  }
});

// ✅ Customer profile
app.get("/customer-auth/me", requireCustomer, async (req, res) => {
  const me = await prisma.user.findUnique({
    where: { id: req.customerId },
    select: { id: true, name: true, email: true },
  });
  res.json({ user: me });
});

/* =========================
   USERS (CUSTOMERS)
========================= */
/* =========================
   CUSTOMERS (NO OPENING BALANCE) + WELCOME EMAIL
========================= */

// ✅ List customers (for admin screen + dropdown)
app.get("/customers", async (req, res) => {
  try {
    const customers = await prisma.user.findMany({
      where: { role: "CUSTOMER" },
      orderBy: { name: "asc" },
      select: { id: true, name: true, email: true },
    });
    res.json(customers);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Customers fetch failed", details: String(e.message || e) });
  }
});

// ✅ Create customer + send welcome email (email + password + login button)
app.post("/customers", async (req, res) => {
  try {
    const { name, email, password, address, state, gstin } = req.body || {};

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, Email, Password required" });
    }

    const hash = await bcrypt.hash(String(password), 10);

    const created = await prisma.user.create({
data: {
  role: "CUSTOMER",
  name: String(name).trim(),
  email: String(email).toLowerCase().trim(),
  passwordHash: hash,
},
      select: { id: true, name: true, email: true },
    });

    // ✅ Send email (best effort)
    try {
      await smtp.sendMail({
        from: process.env.ZOHO_EMAIL,
        to: created.email,
        subject: "Welcome to STAR Engineering – Your Portal Login",
        html: welcomeEmailHTML({ name: created.name, email: created.email, password }),
      });
    } catch (mailErr) {
      console.error("WELCOME EMAIL FAILED:", mailErr);
    }

    res.json({ ok: true, customer: created });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Create failed", details: String(e.message || e) });
  }
});

// ✅ Update customer (password optional reset)
app.put("/customers/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { name, email, password, address, state, gstin } = req.body || {};

    const data = {};
if (name != null) data.name = String(name).trim();
if (email != null) data.email = String(email).toLowerCase().trim();
if (password) data.passwordHash = await bcrypt.hash(String(password), 10);

    if (password) {
      data.passwordHash = await bcrypt.hash(String(password), 10);
    }

    const updated = await prisma.user.update({
      where: { id },
      data,
      select: { id: true, name: true, email: true },
    });

    res.json({ ok: true, customer: updated });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Update failed", details: String(e.message || e) });
  }
});

// ✅ Delete customer (block if transactions exist)
app.delete("/customers/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);

    const txnCount = await prisma.transaction.count({ where: { partyId: id } });
    if (txnCount > 0) {
      return res.status(400).json({
        message: "Cannot delete customer with transactions",
      });
    }

    await prisma.user.delete({ where: { id } });
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Delete failed", details: String(e.message || e) });
  }
});
app.put("/users/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const body = req.body || {};

    const data = {};
    if (body.name != null) data.name = String(body.name);
    if (body.email !== undefined) data.email = body.email ? String(body.email) : null;

    if (body.openingAmount != null) data.openingAmount = Number(body.openingAmount) || 0;
    if (body.openingType != null) data.openingType = body.openingType === "CR" ? "CR" : "DR";

    if (body.password) data.passwordHash = await bcrypt.hash(String(body.password), 10);

    const updated = await prisma.user.update({ where: { id }, data });
    res.json(updated);
  } catch (e) {
    console.error(e);
    res.status(400).json({ error: "Update failed", details: String(e.message || e) });
  }
});

app.get("/users", async (req, res) => {
  const users = await prisma.user.findMany({ where: { role: "CUSTOMER" } });
  res.json(users);
});

app.delete("/users/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);

    const txnCount = await prisma.transaction.count({ where: { partyId: id } });
    if (txnCount > 0) {
      return res.status(400).json({
        error: "Cannot delete customer with transactions",
        tip: "Delete transactions first, or keep customer inactive (future feature).",
      });
    }

    await prisma.user.delete({ where: { id } });
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(400).json({ error: "Delete failed", details: String(e.message || e) });
  }
});

// ✅ Scan Transaction PDF -> extract type, party, date, voucherNo, amount
// Uses multer memory storage for scan only (doesn't save to disk)

function norm(s) {
  return String(s || "").replace(/\s+/g, " ").trim();
}

function parseDateLoose(s) {
  // handles: 2-Feb-26, 2-May-25, 02-02-2026 etc.
  const str = norm(s);

  // dd-MMM-yy
  const m1 = str.match(/\b(\d{1,2})-([A-Za-z]{3})-(\d{2,4})\b/);
  if (m1) {
    const dd = Number(m1[1]);
    const mon = m1[2].toLowerCase();
    const yy = Number(m1[3].length === 2 ? "20" + m1[3] : m1[3]);
    const map = {
      jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
      jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
    };
    const mm = map[mon.slice(0, 3)];
    if (mm >= 0) return new Date(yy, mm, dd);
  }

  // dd-mm-yyyy
  const m2 = str.match(/\b(\d{1,2})-(\d{1,2})-(\d{4})\b/);
  if (m2) return new Date(Number(m2[3]), Number(m2[2]) - 1, Number(m2[1]));

  return null;
}

function parseMoneyLoose(text) {
  // picks last big amount like 64,900.00 or 30,000.00
  const t = String(text || "");
  const matches = t.match(/\b\d{1,3}(?:,\d{3})*(?:\.\d{2})\b/g);
  if (!matches || !matches.length) return 0;
  const last = matches[matches.length - 1];
  return Number(last.replace(/,/g, "")) || 0;
}

function detectTypeFromText(t) {
  const x = t.toLowerCase();
  if (x.includes("tax invoice")) return "SALE";
  if (x.includes("receipt voucher")) return "RECEIPT";
  if (x.includes("payment voucher")) return "PAYMENT";
  if (x.includes("debit note")) return "PURCHASE_RETURN";
  if (x.includes("credit note")) return "SALES_RETURN";
  if (x.includes("purchase")) return "PURCHASE"; // fallback
  return "";
}

function drcrForType(type) {
  const map = {
    SALE: "DR",
    PURCHASE: "CR",
    PAYMENT: "DR",
    RECEIPT: "CR",
    SALES_RETURN: "CR",
    PURCHASE_RETURN: "DR",
  };
  return map[type] || "";
}

function extractFromPdfText(text) {
  const raw = String(text || "");
  const type = detectTypeFromText(raw);

  // Voucher no patterns
  // Invoice No. STAR0006  (from your sample invoice) :contentReference[oaicite:0]{index=0}
    // ✅ Date (works for: Dated : 2-May-25)
  const datedStr =
    raw.match(/\bDated\b\s*:?\s*([0-9]{1,2}-[A-Za-z]{3}-[0-9]{2,4})/i)?.[1] ||
    raw.match(/\bDate\b\s*:?\s*([0-9]{1,2}-[A-Za-z]{3}-[0-9]{2,4})/i)?.[1] ||
    "";

  const dateObj = parseDateLoose(datedStr);

  // ✅ Voucher No (Receipt/Payment me "No. : 1" split hota hai)
  let voucherNo = "";

  if (type === "RECEIPT" || type === "PAYMENT") {
    // Receipt Voucher ... No. : 1
    voucherNo =
      raw.match(/\b(?:Receipt|Payment)\s+Voucher\b[\s\S]{0,120}?\bNo\.\s*:?\s*([0-9A-Za-z\/-]+)/i)?.[1] ||
      raw.match(/\bNo\.\s*:?\s*([0-9A-Za-z\/-]+)/i)?.[1] ||
      "";
  } else {
    // Invoice / Notes etc.
    voucherNo =
      raw.match(/\bInvoice\s*No\.\s*([0-9A-Za-z\/-]+)/i)?.[1] ||
      raw.match(/\bCredit\s*Note\s*No\.\s*([0-9A-Za-z\/-]+)/i)?.[1] ||
      raw.match(/\bDebit\s*Note\s*No\.\s*([0-9A-Za-z\/-]+)/i)?.[1] ||
      raw.match(/\bNo\.\s*:?\s*([0-9A-Za-z\/-]+)/i)?.[1] ||
      "";
  }

  voucherNo = norm(voucherNo);

  // Party extraction (best-effort)
  // Receipt voucher has "Account : Azad Fabrication" :contentReference[oaicite:3]{index=3}
  // Invoice has Buyer (Bill to) MAGMA STEEL :contentReference[oaicite:4]{index=4}
  let partyName =
    (raw.match(/Account\s*:\s*\n?\s*([A-Za-z0-9 &().,-]{3,})/i)?.[1]) ||
    (raw.match(/Buyer\s*\(Bill to\)\s*\n?\s*([A-Za-z0-9 &().,-]{3,})/i)?.[1]) ||
    "";

  partyName = norm(partyName);

  // Amount
  // Receipt amount 30,000.00 :contentReference[oaicite:5]{index=5}
  // Invoice total 64,900.00 :contentReference[oaicite:6]{index=6}
  const amount = parseMoneyLoose(raw);

  return {
    type,
    partyName,
    voucherNo,
    date: dateObj ? dateObj.toISOString().slice(0, 10) : "",
    amount,
    drcr: drcrForType(type),
    narration: "",
  };
}

// ✅ Scan PDF -> extract basic fields (autofill)

const uploadDisk = multer({ dest: UPLOAD_DIR });
// ✅ Scan Transaction PDF -> extract type, party, date, voucherNo, amount (LOCATION/HEADING BASED)
const uploadMem = multer({ storage: multer.memoryStorage() });

function cleanLines(text) {
  const raw = String(text || "").replace(/\r/g, "\n");
  return raw
    .split("\n")
    .map((l) => l.replace(/[ \t]+/g, " ").trim())
    .filter(Boolean);
}

function findAfterLabel(lines, labelRegex, stopRegex) {
  for (let i = 0; i < lines.length; i++) {
    const line = norm(lines[i]);

    if (labelRegex.test(line)) {
      // same line case: "Label : value"
      const same = line.match(/:\s*(.+)$/);
      if (same?.[1]) {
        const v = norm(same[1]);
        if (v && !(stopRegex && stopRegex.test(v))) return v;
      }

      // next lines (best-effort)
      for (let j = i + 1; j < Math.min(i + 10, lines.length); j++) {
        const v = norm(lines[j]);
        if (!v || v === ":" || v === "-") continue;
        if (stopRegex && stopRegex.test(v)) break;

        // skip obvious meta headers
        if (
          /^(GSTIN|GSTIN\/UIN|State Name|Contact|E-Mail|Email|Through|Mode\/Terms|Destination|Materials|Sl|No\.|Rate|Amount|HSN|Bank)/i.test(
            v
          )
        )
          continue;

        return v;
      }
    }
  }
  return "";
}

function parseDateLooseAny(str) {
  const s = String(str || "");

  // 2-Feb-26 or 2-May-25 or 1-May-25
  let m = s.match(/\b(\d{1,2})-([A-Za-z]{3})-(\d{2,4})\b/);
  if (m) {
    const dd = m[1].padStart(2, "0");
    const mon = m[2].toLowerCase();
    const yy = m[3].length === 2 ? "20" + m[3] : m[3];
    const map = { jan:"01", feb:"02", mar:"03", apr:"04", may:"05", jun:"06", jul:"07", aug:"08", sep:"09", oct:"10", nov:"11", dec:"12" };
    const mm = map[mon.slice(0, 3)];
    if (mm) return `${yy}-${mm}-${dd}`;
  }

  // 02-02-2026 / 2-5-2025
  m = s.match(/\b(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})\b/);
  if (m) {
    const dd = m[1].padStart(2, "0");
    const mm = m[2].padStart(2, "0");
    const yy = m[3].length === 2 ? "20" + m[3] : m[3];
    return `${yy}-${mm}-${dd}`;
  }

  return "";
}

function moneyToNumber(s) {
  const m = String(s || "").match(/(\d{1,3}(?:,\d{3})*(?:\.\d{2})|\d+(?:\.\d{2})?)/);
  if (!m) return 0;
  return Number(String(m[1]).replace(/,/g, "")) || 0;
}

function pickTotalAmount(lines) {
  // best: line containing Total ... ī 64,900.00 OR Total ī 20,000.00
  for (const l of lines) {
    if (/^Total\b/i.test(l) || /\bTotal\b/i.test(l)) {
      if (/[₹ī]\s*\d/.test(l) || /\d{1,3}(?:,\d{3})*(?:\.\d{2})/.test(l)) {
        const all = l.match(/\d{1,3}(?:,\d{3})*(?:\.\d{2})|\d+(?:\.\d{2})/g);
        if (all && all.length) return moneyToNumber(all[all.length - 1]);
      }
    }
  }

  // second: any line starting with ī (your PDFs show ī 30,000.00)
  for (let i = lines.length - 1; i >= 0; i--) {
    const l = lines[i];
    if (/^[₹ī]\s*\d/.test(l)) return moneyToNumber(l);
  }

  // fallback: last monetary value in whole doc (still better than first)
  const joined = lines.join(" ");
  const matches = joined.match(/\d{1,3}(?:,\d{3})*(?:\.\d{2})|\d+(?:\.\d{2})/g);
  if (!matches || !matches.length) return 0;
  return moneyToNumber(matches[matches.length - 1]);
}

function detectDocType(lines, compactLower) {
  // HEADINGS-based detect (most reliable)
  const head = (lines.slice(0, 15).join(" ") + " " + compactLower).toLowerCase();

  if (head.includes("tax invoice")) return "SALE";                       // :contentReference[oaicite:1]{index=1}
  if (head.includes("receipt voucher")) return "RECEIPT";                 // :contentReference[oaicite:2]{index=2}
  if (head.includes("payment advice")) return "PAYMENT";                  // :contentReference[oaicite:3]{index=3}
  if (head.includes("supplier invoice record copy")) return "PURCHASE";   // :contentReference[oaicite:4]{index=4}
  if (head.includes("purchase return") || head.includes("debit note")) return "PURCHASE_RETURN"; // :contentReference[oaicite:5]{index=5}
  if (head.includes("sales return") || head.includes("credit note")) return "SALES_RETURN";     // :contentReference[oaicite:6]{index=6}

  // fallback keywords
  if (head.includes("credit note")) return "SALES_RETURN";
  if (head.includes("debit note")) return "PURCHASE_RETURN";
  if (head.includes("receipt")) return "RECEIPT";
  if (head.includes("payment")) return "PAYMENT";
  if (head.includes("purchase")) return "PURCHASE";
  if (head.includes("invoice")) return "SALE";

  return "SALE";
}
function paymentCodeFromFilename(originalName) {
  const fname = String(originalName || "").trim();
  if (!fname) return "";

  // remove path + extension
  const base = fname.split(/[\\/]/).pop().replace(/\.pdf$/i, "");

  // Payment_2  / Payment-PMT092 / Payment PMT092 / PAYMENT_PMT092_anything
  const m =
    base.match(/^payment[_\-\s]*([A-Za-z0-9]+)\b/i) ||      // Payment_2 / Payment_PMT092
    base.match(/\bpayment[_\-\s]+([A-Za-z0-9]+)\b/i);       // fallback

  if (!m) return "";
  return String(m[1] || "").trim().toUpperCase();
}
function pickVoucherNo(type, lines, compact, originalName) {
  const t = compact;

  if (type === "SALE") {
    return (
      t.match(/\bInvoice No\.\s*([A-Z0-9\-\/]+)/i)?.[1] ||
      t.match(/\bInvoice No\s*([A-Z0-9\-\/]+)/i)?.[1] ||
      ""
    );
  }

  if (type === "RECEIPT") {
    for (let i = 0; i < lines.length; i++) {
      if (/^No\.\s*:?\s*$/i.test(lines[i]) || /^No\.$/i.test(lines[i])) {
        for (let j = i + 1; j < Math.min(i + 8, lines.length); j++) {
          const v = norm(lines[j]);
          if (!v || v === ":" || /^Dated$/i.test(v)) continue;
          const m = v.match(/\b(\d{1,10})\b/);
          if (m?.[1]) return m[1];
        }
      }
    }
    return t.match(/\bNo\.\s*:\s*(\d{1,10})\b/i)?.[1] || "";
  }

  if (type === "PAYMENT") {
  // ✅ 1) FIRST PRIORITY: filename Payment_2.pdf -> 2
  const fname = String(originalName || "");
  const mFile = fname.match(/payment[_\-\s]+([A-Za-z0-9]+)(?=\.pdf$|$)/i);
  if (mFile?.[1]) return norm(mFile[1]);

  // ✅ 2) SECOND PRIORITY: PDF text (only if filename didn't contain code)
  const fromText =
    t.match(/\bAdvice\s*No\.?\s*:?\s*([A-Z0-9\-\/]+)/i)?.[1] ||
    "";

  if (fromText) return norm(fromText);

  return "";
}

  if (type === "PURCHASE") {
    return (
      t.match(/\bSupplier Invoice No\.\s*&\s*Date\.\s*([A-Z0-9\-\/]+)\b/i)?.[1] ||
      t.match(/\bSupplier Invoice No\.\s*([A-Z0-9\-\/]+)\b/i)?.[1] ||
      t.match(/\bInvoice No\.\s*([A-Z0-9\-\/]+)\b/i)?.[1] ||
      ""
    );
  }

  if (type === "PURCHASE_RETURN") {
    return t.match(/\bDebit Note No\.\s*([A-Z0-9\-\/]+)\b/i)?.[1] || "";
  }

  if (type === "SALES_RETURN") {
    return t.match(/\bCredit Note No\.\s*([A-Z0-9\-\/]+)\b/i)?.[1] || "";
  }

  return "";
}

function pickDate(type, lines, compact, originalName) {
    // ✅ Receipt: "Dated : 2-May-25" (same line)
  const mSame = compact.match(/\bDated\s*:\s*([0-9]{1,2}-[A-Za-z]{3}-[0-9]{2,4})\b/i);
  if (mSame?.[1]) {
    const iso = parseDateLooseAny(mSame[1]);
    if (iso) return iso;
  }
  // Prefer explicit "Date :" for Payment Advice, otherwise "Dated"
  let d = "";
if (type === "PAYMENT") {
  // Payment Advice me usually "Date : dd-mm-yyyy" / or Dated
  const mPay =
    compact.match(/\bDate\s*:\s*([0-9]{1,2}[\/\-\.][0-9]{1,2}[\/\-\.][0-9]{2,4})/i)?.[1] ||
    compact.match(/\bDated\s*:\s*([0-9]{1,2}-[A-Za-z]{3}-[0-9]{2,4})\b/i)?.[1] ||
    "";

  return mPay ? (parseDateLooseAny(mPay) || "") : "";
}

  // Dated ... (works for Sale/Purchase/Notes/Receipt) :contentReference[oaicite:13]{index=13} :contentReference[oaicite:14]{index=14} :contentReference[oaicite:15]{index=15} :contentReference[oaicite:16]{index=16} :contentReference[oaicite:17]{index=17}
  const m = compact.match(/\bDated\s*:?\s*([0-9]{1,2}-[A-Za-z]{3}-[0-9]{2,4}|[0-9]{1,2}[\/\-\.][0-9]{1,2}[\/\-\.][0-9]{2,4})/i);
  if (m?.[1]) return parseDateLooseAny(m[1]) || "";

  // Receipt Voucher: "... Dated : 2-May-25" sometimes in one line
  const m2 = compact.match(/\bDated\s*:\s*([0-9]{1,2}-[A-Za-z]{3}-[0-9]{2,4})/i);
  if (m2?.[1]) return parseDateLooseAny(m2[1]) || "";

  return "";
}

function stripTrailingAmount(s) {
  return String(s || "")
    .replace(/\s+\d{1,3}(?:,\d{3})*(?:\.\d{2})?\s*$/g, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function pickParty(type, lines, compact) {
  // ✅ RECEIPT: "Account : <Party>" (often amount also in same line)
  if (type === "RECEIPT") {
    const mSame = compact.match(/\bAccount\s*:\s*([A-Za-z0-9 &().,-]{3,})/i);
    if (mSame?.[1]) return stripTrailingAmount(norm(mSame[1]));

    const nextLine = findAfterLabel(lines, /^Account\s*:\s*$/i) || findAfterLabel(lines, /^Account\b/i);
    if (nextLine) return stripTrailingAmount(norm(nextLine));

    return "";
  }
  // ✅ PAYMENT: "Payment Advice M/s. <Party>" or Account:
  if (type === "PAYMENT") {
    const m = compact.match(/\bPayment Advice\s+M\/s\.\s*([A-Za-z0-9 &().,-]{3,})/i);
    if (m?.[1]) return stripTrailingAmount(norm(m[1]));

    const mSame = compact.match(/\bAccount\s*:\s*([A-Za-z0-9 &().,-]{3,})/i);
    if (mSame?.[1]) return stripTrailingAmount(norm(mSame[1]));

    const nextLine = findAfterLabel(lines, /^Account\s*:\s*$/i) || findAfterLabel(lines, /^Account\b/i);
    if (nextLine) return stripTrailingAmount(norm(nextLine));

    return "";
  }

  // ✅ SALE: Buyer (Bill to)
  if (type === "SALE") {
    return stripTrailingAmount(findAfterLabel(lines, /^Buyer\s*\(Bill to\)/i) || "");
  }

  // ✅ PURCHASE: Supplier (Bill from)
  if (type === "PURCHASE") {
    return stripTrailingAmount(findAfterLabel(lines, /^Supplier\s*\(Bill from\)/i) || "");
  }

  // ✅ Credit/Debit Note => Buyer (Bill to)
  if (type === "PURCHASE_RETURN" || type === "SALES_RETURN") {
    return stripTrailingAmount(findAfterLabel(lines, /^Buyer\s*\(Bill to\)/i) || "");
  }

  // fallback
  const mAny = compact.match(/\bAccount\s*:\s*([A-Za-z0-9 &().,-]{3,})/i);
  if (mAny?.[1]) return stripTrailingAmount(norm(mAny[1]));

  return "";
}

function extractFromPdfSmart(parsedText, originalName) {
  const lines = cleanLines(parsedText);
  const compact = norm(lines.join(" "));
  const compactLower = compact.toLowerCase();

  const type = detectDocType(lines, compactLower);
  const partyName = pickParty(type, lines, compact);
  const voucherNo = pickVoucherNo(type, lines, compact, originalName);
const date = pickDate(type, lines, compact, originalName);
  const amount = pickTotalAmount(lines);

  return {
    type,
    partyName,
    voucherNo,
    date,
    amount: Number(amount || 0),
    drcr: drcrForType(type),
    narration: "",
  };
}

app.post("/transactions/scan", uploadMem.single("pdf"), async (req, res) => {
  try {
    if (!pdfParse) return res.status(500).json({ message: "pdf-parse not installed" });
    if (!req.file?.buffer) return res.status(400).json({ message: "PDF missing" });

    const parsed = await pdfParse(req.file.buffer);

    // ✅ keep original text (with newlines) for better patterns like "No. : 1" and "Dated : 2-May-25"
const rawText = String(parsed?.text || "");
const ex = extractFromPdfSmart(rawText, req.file?.originalname || "");
// ✅ force ISO date for <input type="date">
const isoDate = ex?.date ? parseDateLooseAny(ex.date) || ex.date : "";
    if (!ex?.type) {
      return res.status(400).json({
        message: "Scan failed: could not detect voucher type",
        rawTextPreview: rawText.slice(0, 500),
      });
    }

    return res.json({
      ok: true,
      extracted: {
        type: ex.type,                 // RECEIPT etc.
        partyName: ex.partyName || "", // ✅ for frontend auto select
        date: isoDate || "",
        voucherNo: ex.voucherNo || "", // ✅ "1"
        amount: ex.amount ? String(ex.amount) : "",
        drcr: ex.drcr || drcrForType(ex.type),
        narration: ex.narration || "",
        rawTextPreview: rawText.slice(0, 400),
      },
    });
  } catch (e) {
    console.error("SCAN ERROR:", e);
    res.status(500).json({ message: e.message || "Scan failed" });
  }
});
/* =========================
   TRANSACTIONS + PDFs
========================= */


// list (admin side)
app.get("/transactions", async (req, res) => {
  try {
    const { partyId, from, to, q } = req.query;

    const where = {};
    if (partyId) where.partyId = Number(partyId);
    if (from && to) where.date = { gte: new Date(from), lte: new Date(to) };
    if (q) {
      where.OR = [
        { voucherNo: { contains: String(q) } },
        { narration: { contains: String(q) } },
      ];
    }

    const txns = await prisma.transaction.findMany({
      where,
      orderBy: { date: "desc" },
      include: { pdfs: true },
    });

    res.json(txns);
  } catch (e) {
    console.error(e);
    res.status(400).json({ error: "List failed", details: String(e.message || e) });
  }
});

// create txn (+ pdfs)
app.post("/transactions", uploadDisk.array("pdfs"), async (req, res) => {
  const { type, voucherNo, date, amount, drcr, narration, partyId } = req.body;

  const txn = await prisma.transaction.create({
    data: {
      type,
      voucherNo,
      date: new Date(date),
      amount: Number(amount),
      drcr,
      narration,
      partyId: Number(partyId),
      createdById: 1,
    },
  });

  if (req.files?.length) {
    for (const file of req.files) {
      await prisma.transactionPDF.create({
        data: {
          transactionId: txn.id,
          filePath: file.filename,
          originalName: file.originalname,
          mimeType: file.mimetype,
          size: file.size,
        },
      });
    }
  }

  res.json(txn);
});

// update txn
app.put("/transactions/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const body = req.body || {};

    const updated = await prisma.transaction.update({
      where: { id },
      data: {
        type: body.type,
        voucherNo: body.voucherNo,
        date: new Date(body.date),
        amount: Number(body.amount),
        drcr: body.drcr,
        narration: body.narration || null,
        partyId: Number(body.partyId),
      },
    });

    res.json(updated);
  } catch (e) {
    console.error(e);
    res.status(400).json({ error: "Update failed", details: String(e.message || e) });
  }
});

// delete txn (+ delete pdf records + files)
app.delete("/transactions/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);

    const pdfs = await prisma.transactionPDF.findMany({ where: { transactionId: id } });
    for (const p of pdfs) {
      const fpath = path.join(UPLOAD_DIR, p.filePath);
      if (fs.existsSync(fpath)) fs.unlinkSync(fpath);
    }
    await prisma.transactionPDF.deleteMany({ where: { transactionId: id } });

    await prisma.transaction.delete({ where: { id } });

    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(400).json({ error: "Delete failed", details: String(e.message || e) });
  }
});

// add pdfs to existing txn
app.post("/transactions/:id/pdfs", uploadDisk.array("pdfs"), async (req, res) => {
  try {
    const id = Number(req.params.id);

    const txn = await prisma.transaction.findUnique({ where: { id } });
    if (!txn) return res.status(404).json({ error: "Transaction not found" });

    const created = [];
    if (req.files?.length) {
      for (const file of req.files) {
        const p = await prisma.transactionPDF.create({
          data: {
            transactionId: id,
            filePath: file.filename,
            originalName: file.originalname,
            mimeType: file.mimetype,
            size: file.size,
          },
        });
        created.push(p);
      }
    }

    const pdfs = await prisma.transactionPDF.findMany({ where: { transactionId: id } });
    res.json({ ok: true, added: created.length, pdfs });
  } catch (e) {
    console.error(e);
    res.status(400).json({ error: "PDF add failed", details: String(e.message || e) });
  }
});

// remove pdf from txn
app.delete("/transactions/:id/pdfs/:pdfId", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const pdfId = Number(req.params.pdfId);

    const pdf = await prisma.transactionPDF.findFirst({
      where: { id: pdfId, transactionId: id },
    });
    if (!pdf) return res.status(404).json({ error: "PDF not found" });

    const fpath = path.join(UPLOAD_DIR, pdf.filePath);
    if (fs.existsSync(fpath)) fs.unlinkSync(fpath);

    await prisma.transactionPDF.delete({ where: { id: pdfId } });

    const pdfs = await prisma.transactionPDF.findMany({ where: { transactionId: id } });
    res.json({ ok: true, pdfs });
  } catch (e) {
    console.error(e);
    res.status(400).json({ error: "PDF delete failed", details: String(e.message || e) });
  }
});

/* =========================
   SECURE PDF ROUTE (CUSTOMER ONLY)
========================= */
app.get("/pdfs/:pdfId", async (req, res) => {
  try {
    const pdfId = Number(req.params.pdfId);

    // ✅ allow both ADMIN and CUSTOMER via Bearer token (or ?token=)
    const auth = req.headers.authorization || "";
    const headerToken = auth.startsWith("Bearer ") ? auth.slice(7) : null;
    const queryToken = req.query?.token ? String(req.query.token) : null;
    const token = headerToken || queryToken;

    if (!token) return res.status(401).send("Unauthorized");

    const payload = jwt.verify(token, JWT_SECRET);

    const pdf = await prisma.transactionPDF.findUnique({
      where: { id: pdfId },
      include: { transaction: true },
    });

    if (!pdf) return res.status(404).send("Not found");

    // ✅ CUSTOMER can only view own party PDFs
    if (payload.role === "CUSTOMER") {
      if (!pdf.transaction || pdf.transaction.partyId !== payload.id) {
        return res.status(403).send("Forbidden");
      }
    }

    // ✅ ADMIN can view all (no extra check)
    if (payload.role !== "ADMIN" && payload.role !== "CUSTOMER") {
      return res.status(403).send("Forbidden");
    }

    const filePath = path.join(UPLOAD_DIR, pdf.filePath);
    if (!fs.existsSync(filePath)) return res.status(404).send("File missing");

    res.setHeader("Content-Type", pdf.mimeType || "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `inline; filename="${String(pdf.originalName || "document.pdf").replace(/"/g, "")}"`
    );

    res.sendFile(filePath);
  } catch (e) {
    console.error(e);
    return res.status(500).send("Failed");
  }
});

/* =========================
   LEDGER HELPERS
========================= */
function signedAmount(txn) {
  return txn.drcr === "DR" ? Number(txn.amount) : -Number(txn.amount);
}

// STRICT To/By rule (your rule)
function particulars(txn) {
  const isDr = txn.drcr === "DR";
  const prefix = isDr ? "To" : "By";

  if (txn.type === "JOURNAL") {
    return `${prefix} ${txn.narration || "Journal"}`;
  }

  const map = {
    SALE: "Sales",
    SALES_RETURN: "Sales Return",
    PURCHASE: "Purchase",
    PURCHASE_RETURN: "Purchase Return",
    PAYMENT: "Payment",
    RECEIPT: "Receipt",
  };

  return `${prefix} ${map[txn.type] || txn.type}`;
}

function voucherTypeLabel(type) {
  const map = {
    SALE: "Sale",
    SALES_RETURN: "Sales Return",
    PURCHASE: "Purchase",
    PURCHASE_RETURN: "Purchase Return",
    PAYMENT: "Payment",
    RECEIPT: "Receipt",
    JOURNAL: "Journal",
  };
  return map[type] || String(type || "");
}

function fmtDate(d) {
  const dt = new Date(d);
  const dd = String(dt.getDate()).padStart(2, "0");
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const mmm = months[dt.getMonth()];
  const yy = dt.getFullYear();
  return `${dd}-${mmm}-${yy}`;
}

function money(n) {
  const v = Number(n || 0);
  return v.toLocaleString("en-IN", {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  });
}

function balText(v) {
  const n = Number(v || 0);
  if (n > 0) return `${money(n)} Dr`;
  if (n < 0) return `${money(Math.abs(n))} Cr`;
  return "";
}

/* =========================
   LEDGER (JSON)
========================= */
app.get("/ledger/:partyId", requireAdminOrSameCustomer, async (req, res) => {
  const { partyId } = req.params;
  const { from, to } = req.query;

  if (!from || !to) return res.status(400).json({ error: "from and to required" });

  const fromDate = new Date(from);
  const toDate = new Date(to);

  const party = await prisma.user.findUnique({ where: { id: Number(partyId) } });
  if (!party) return res.status(404).json({ error: "Not found" });

  const beforeTxns = await prisma.transaction.findMany({
    where: { partyId: Number(partyId), date: { lt: fromDate } },
    orderBy: { date: "asc" },
  });

  let opening =
    party.openingType === "DR"
      ? Number(party.openingAmount || 0)
      : -Number(party.openingAmount || 0);

  for (const txn of beforeTxns) opening += signedAmount(txn);

  const txns = await prisma.transaction.findMany({
    where: { partyId: Number(partyId), date: { gte: fromDate, lte: toDate } },
    orderBy: { date: "asc" },
    include: { pdfs: true },
  });

  let running = opening;

  const rows = txns.map((txn) => {
    running += signedAmount(txn);
    return {
      date: txn.date,
      voucherNo: txn.voucherNo,
      voucherType: voucherTypeLabel(txn.type),
      particulars: particulars(txn),
      dr: txn.drcr === "DR" ? txn.amount : 0,
      cr: txn.drcr === "CR" ? txn.amount : 0,
      runningBalance: running,
      runningBalanceText: balText(running),
      pdfs: (txn.pdfs || []).map((p) => ({
        name: p.originalName,
        url: `/pdfs/${p.id}`,
      })),
    };
  });

  res.json({
    opening,
    openingText: balText(opening),
    closing: running,
    closingText: balText(running),
    rows,
  });
});

/* =========================
   LEDGER (PDF)
========================= */
app.get("/ledger/:partyId/pdf", requireAdminOrSameCustomer, async (req, res) => {
  try {
    const { partyId } = req.params;
    const { from, to } = req.query;

    if (!from || !to) {
      return res.status(400).json({ error: "from and to required (YYYY-MM-DD)" });
    }

    const fromDate = new Date(from);
    const toDate = new Date(to);

    const party = await prisma.user.findUnique({ where: { id: Number(partyId) } });
    if (!party) return res.status(404).json({ error: "Party not found" });

    const beforeTxns = await prisma.transaction.findMany({
      where: { partyId: Number(partyId), date: { lt: fromDate } },
      orderBy: { date: "asc" },
    });

    let opening =
      party.openingType === "DR"
        ? Number(party.openingAmount || 0)
        : -Number(party.openingAmount || 0);

    for (const t of beforeTxns) opening += signedAmount(t);

    const txns = await prisma.transaction.findMany({
      where: { partyId: Number(partyId), date: { gte: fromDate, lte: toDate } },
      orderBy: { date: "asc" },
    });

    const rows = txns.map((t) => ({
      date: fmtDate(t.date),
      particulars: particulars(t),
      vchType: voucherTypeLabel(t.type),
      vchNo: t.voucherNo || "",
      dr: t.drcr === "DR" ? Number(t.amount) : 0,
      cr: t.drcr === "CR" ? Number(t.amount) : 0,
    }));

    let totalDr = opening > 0 ? opening : 0;
    let totalCr = opening < 0 ? Math.abs(opening) : 0;

    for (const r of rows) {
      totalDr += Number(r.dr || 0);
      totalCr += Number(r.cr || 0);
    }

    const diff = Math.abs(totalDr - totalCr);
    const drGreater = totalDr > totalCr;
    const crGreater = totalCr > totalDr;
    const grandTotal = Math.max(totalDr, totalCr);

    const filename = `Ledger_${String(party.name || "Party").replace(/[^\w]+/g, "_")}_${from}_to_${to}.pdf`;
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="${filename}"`);
    res.setHeader("X-Content-Type-Options", "nosniff");

    const doc = new PDFDocument({ size: "A4", margin: 36 });
    doc.pipe(res);

    const pageW = doc.page.width;
    const left = doc.page.margins.left;
    const right = doc.page.margins.right;
    const top = doc.page.margins.top;
    const bottom = doc.page.margins.bottom;
    const usableW = pageW - left - right;

    const col = { date: 72, particulars: 0, vchType: 78, vchNo: 78, debit: 78, credit: 78 };
    col.particulars = usableW - (col.date + col.vchType + col.vchNo + col.debit + col.credit);
    if (col.particulars < 160) {
      col.vchType = 70; col.vchNo = 70; col.debit = 74; col.credit = 74;
      col.particulars = usableW - (col.date + col.vchType + col.vchNo + col.debit + col.credit);
    }

    const X = {
      date: left,
      particulars: left + col.date,
      vchType: left + col.date + col.particulars,
      vchNo: left + col.date + col.particulars + col.vchType,
      debit: left + col.date + col.particulars + col.vchType + col.vchNo,
      credit: left + col.date + col.particulars + col.vchType + col.vchNo + col.debit,
    };

    function hr(y, thickness = 0.7) {
      doc.save();
      doc.lineWidth(thickness);
      doc.moveTo(left, y).lineTo(left + usableW, y).stroke();
      doc.restore();
    }

    function money2(n) {
      const v = Number(n || 0);
      if (!v) return "";
      return v.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }

    function drawHeader() {
      const titleY = top;
      const gradient = doc.linearGradient(0, titleY, pageW, titleY);
      gradient.stop(0, "#ff2d55");
      gradient.stop(0.5, "#7c3aed");
      gradient.stop(1, "#2563eb");

      doc.font("Helvetica-Bold").fontSize(18).fill(gradient).text("STAR ENGINEERING", 0, titleY, { align: "center" });
      doc.moveDown(0.5);

      doc.fillColor("#111827").font("Helvetica").fontSize(9);
      doc.text("H.N. 303, Sangam C.H.S., Indra Nagar,", { align: "center" });
      doc.text("Pathan Wadi, R.S. Marg, Malad (E), Mumbai - 400097.", { align: "center" });
      doc.text("Contact : +91-9702485922  |  E-Mail : corporate@stareng.co.in", { align: "center" });
      doc.text("www.stareng.co.in", { align: "center" });

      doc.moveDown(0.8);

      doc.fillColor("#0f172a").font("Helvetica-Bold").fontSize(12).text(String(party.name || ""), { align: "center" });
      doc.font("Helvetica").fontSize(10).text("Ledger Account", { align: "center" });
      doc.font("Helvetica").fontSize(9).fillColor("#334155").text(
        `Period: ${fmtDate(fromDate)} to ${fmtDate(toDate)}`,
        { align: "center" }
      );

      doc.moveDown(0.8);
      doc.fillColor("#111827");
    }

    function drawTableHeader(y) {
      doc.font("Helvetica-Bold").fontSize(9).fillColor("#111827");
      hr(y, 0.7); y += 3;

      doc.text("DATE", X.date, y, { width: col.date });
      doc.text("PARTICULARS", X.particulars, y, { width: col.particulars });
      doc.text("VCH NO.", X.vchNo, y, { width: col.vchNo });
      doc.text("DEBIT", X.debit, y, { width: col.debit, align: "right" });
      doc.text("CREDIT", X.credit, y, { width: col.credit, align: "right" });

      y += 10;
      hr(y, 0.7); y += 3;

      doc.font("Helvetica").fontSize(9);
      return y;
    }

    function rowHeight(particularsText) {
      const hPart = doc.heightOfString(particularsText || "", { width: col.particulars, align: "left" });
      return Math.max(13, Math.ceil(hPart)) + 0.5;
    }

    function drawRow(y, r, opts = {}) {
      const bold = !!opts.bold;
      const totalsLine = opts.totalsLine;
      const h = rowHeight(r.particulars || " ");

      doc.font(bold ? "Helvetica-Bold" : "Helvetica").fontSize(9).fillColor("#111827");
      doc.text(r.date || "", X.date, y, { width: col.date });
      doc.text(r.particulars || "", X.particulars, y, { width: col.particulars });
      doc.text(r.vchNo || "", X.vchNo, y, { width: col.vchNo });
      doc.text(money2(r.dr), X.debit, y, { width: col.debit, align: "right" });
      doc.text(money2(r.cr), X.credit, y, { width: col.credit, align: "right" });

      if (totalsLine) {
        const lineY = totalsLine === "above" ? (y - 2) : (y + h - 2);
        doc.save();
        doc.lineWidth(0.6);
        doc.moveTo(X.debit + 6, lineY).lineTo(X.debit + col.debit - 2, lineY).stroke();
        doc.moveTo(X.credit + 6, lineY).lineTo(X.credit + col.credit - 2, lineY).stroke();
        doc.restore();
      }

      return y + h;
    }

function drawFooter(pageNo) {
  const footerText =
    "This is a system generated ledger statement. As per Rule 46 of the Central Goods and Services Tax Rules, 2017 read with Section 16 of the Information Technology Act, 2000, no physical signature is required on a digitally issued document."

  doc.save();
  doc.font("Helvetica").fontSize(7).fillColor("#475569");

  // ✅ wrap allowed + height calculate so it never spills to next page
  const footerH = doc.heightOfString(footerText, { width: usableW - 60, align: "center" });
  const footerY = doc.page.height - doc.page.margins.bottom - footerH - 6;

  doc.text(footerText, left, footerY, { width: usableW - 60, align: "center" });

  doc.fillColor("#94a3b8");
  doc.text(`Page ${pageNo}`, left, footerY, { width: usableW, align: "right" });

  doc.restore();
  doc.fillColor("#111827");
}

    function bottomLimit() {
      return doc.page.height - bottom - 32;
    }

    let pageNo = 1;
    drawHeader();
    let y = doc.y;
    y = drawTableHeader(y);

    const openingRow = {
      date: fmtDate(fromDate),
      particulars: opening >= 0 ? "To Opening Balance" : "By Opening Balance",
      vchType: "",
      vchNo: "",
      dr: opening > 0 ? opening : 0,
      cr: opening < 0 ? Math.abs(opening) : 0,
    };

    if (y + rowHeight(openingRow.particulars) > bottomLimit()) {
      drawFooter(pageNo); doc.addPage(); pageNo++; drawHeader(); y = drawTableHeader(doc.y);
    }
    y = drawRow(y, openingRow, { bold: true });

    for (const r of rows) {
      if (y + rowHeight(r.particulars) > bottomLimit()) {
        drawFooter(pageNo); doc.addPage(); pageNo++; drawHeader(); y = drawTableHeader(doc.y);
      }
      y = drawRow(y, r);
    }

    const subTotalRow = { date: "", particulars: "", vchType: "", vchNo: "", dr: totalDr, cr: totalCr };
    if (y + rowHeight(" ") > bottomLimit()) {
      drawFooter(pageNo); doc.addPage(); pageNo++; drawHeader(); y = drawTableHeader(doc.y);
    }
    y = drawRow(y, subTotalRow, { bold: true, totalsLine: "above" });

    if (diff > 0) {
      const closingRow = {
        date: "",
        particulars: drGreater ? "By Closing Balance" : "To Closing Balance",
        vchType: "",
        vchNo: "",
        dr: crGreater ? diff : 0,
        cr: drGreater ? diff : 0,
      };

      if (y + rowHeight(closingRow.particulars) > bottomLimit()) {
        drawFooter(pageNo); doc.addPage(); pageNo++; drawHeader(); y = drawTableHeader(doc.y);
      }
      y = drawRow(y, closingRow, { bold: true, totalsLine: "below" });
    }

    const grandRow = { date: "", particulars: "", vchType: "", vchNo: "", dr: grandTotal, cr: grandTotal };
    if (y + rowHeight(" ") > bottomLimit()) {
      drawFooter(pageNo); doc.addPage(); pageNo++; drawHeader(); y = drawTableHeader(doc.y);
    }
    y = drawRow(y, grandRow, { bold: true, totalsLine: "below" });

    drawFooter(pageNo);
    doc.end();
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "PDF export failed", details: String(e.message || e) });
  }
});

/* =========================
   CUSTOMER PORTAL DASHBOARD
========================= */
app.get("/customer-portal/dashboard", requireCustomer, async (req, res) => {
  const partyId = req.customerId;

  const txns = await prisma.transaction.findMany({
    where: { partyId },
    orderBy: { date: "asc" },
  });

  let totalDebit = 0, totalCredit = 0, balance = 0;

  const salesMonth = new Map();
  const purchaseMonth = new Map();

  let SALE = 0, RECEIPT = 0, SALES_RETURN = 0, PURCHASE = 0, PAYMENT = 0, PURCHASE_RETURN = 0, JOURNAL_DR = 0, JOURNAL_CR = 0;

  function monthKey(d) {
    const dt = new Date(d);
    if (Number.isNaN(dt.getTime())) return "NA";
    return dt.toISOString().slice(0, 7);
  }

  function bump(map, key, field, amt) {
    const prev = map.get(key) || {
      month: key,
      SALE: 0, RECEIPT: 0, SALES_RETURN: 0,
      PURCHASE: 0, PAYMENT: 0, PURCHASE_RETURN: 0,
      JOURNAL: 0,
    };
    prev[field] = (prev[field] || 0) + amt;
    map.set(key, prev);
  }

  for (const t of txns) {
    const amt = Math.abs(Number(t.amount || 0));
    const isDr = t.drcr === "DR";

    const d = isDr ? amt : 0;
    const c = !isDr ? amt : 0;

    totalDebit += d;
    totalCredit += c;

    balance += isDr ? amt : -amt;

    const m = monthKey(t.date);

    if (t.type === "SALE") SALE += amt;
    if (t.type === "RECEIPT") RECEIPT += amt;
    if (t.type === "SALES_RETURN") SALES_RETURN += amt;

    if (t.type === "PURCHASE") PURCHASE += amt;
    if (t.type === "PAYMENT") PAYMENT += amt;
    if (t.type === "PURCHASE_RETURN") PURCHASE_RETURN += amt;

    if (t.type === "JOURNAL") {
      if (isDr) JOURNAL_DR += amt;
      else JOURNAL_CR += amt;
    }

    if (["SALE", "RECEIPT", "SALES_RETURN", "JOURNAL"].includes(t.type)) {
      bump(salesMonth, m, t.type, amt);
    }
    if (["PURCHASE", "PAYMENT", "PURCHASE_RETURN", "JOURNAL"].includes(t.type)) {
      bump(purchaseMonth, m, t.type, amt);
    }
  }

  const salesNet = SALE - RECEIPT - SALES_RETURN - JOURNAL_CR;
  const salesTotal = SALE + JOURNAL_DR;
  const salesOutstanding = Math.max(salesNet, 0);
  const salesSettled = Math.max(salesTotal - salesOutstanding, 0);

  const purchaseNet = PURCHASE - PAYMENT - PURCHASE_RETURN - JOURNAL_DR;
  const purchaseTotal = PURCHASE + JOURNAL_CR;
  const purchaseOutstanding = Math.max(purchaseNet, 0);
  const purchaseSettled = Math.max(purchaseTotal - purchaseOutstanding, 0);

  const salesTrend = Array.from(salesMonth.values()).sort((a, b) => a.month.localeCompare(b.month));
  const purchaseTrend = Array.from(purchaseMonth.values()).sort((a, b) => a.month.localeCompare(b.month));

  res.json({
    summary: {
      outstanding: balance,
      totalDebit,
      totalCredit,
      txnCount: txns.length,
    },
    charts: {
      salesTrend,
      purchaseTrend,
      salesPie: { SALE, RECEIPT, SALES_RETURN, JOURNAL_CR, net: salesNet, total: salesTotal, outstanding: salesOutstanding, settled: salesSettled },
      purchasePie: { PURCHASE, PAYMENT, PURCHASE_RETURN, JOURNAL_DR, net: purchaseNet, total: purchaseTotal, outstanding: purchaseOutstanding, settled: purchaseSettled },
    },
  });
});

/* =========================
   CUSTOMER PORTAL TRANSACTIONS
========================= */
app.get("/customer-portal/transactions", requireCustomer, async (req, res) => {
  try {
    const partyId = req.customerId;
    const { from, to } = req.query;

    if (!from || !to) {
      return res.status(400).json({ message: "from and to required (YYYY-MM-DD)" });
    }

    const fromDate = new Date(String(from));
    const toDate = new Date(String(to));

    const party = await prisma.user.findUnique({ where: { id: partyId } });
    if (!party) return res.status(404).json({ message: "Customer not found" });

    let opening =
      party.openingType === "DR"
        ? Number(party.openingAmount || 0)
        : -Number(party.openingAmount || 0);

    const beforeTxns = await prisma.transaction.findMany({
      where: { partyId, date: { lt: fromDate } },
      orderBy: { date: "asc" },
    });

    for (const t of beforeTxns) {
      const amt = Number(t.amount || 0);
      opening += t.drcr === "DR" ? amt : -amt;
    }

    const items = await prisma.transaction.findMany({
      where: { partyId, date: { gte: fromDate, lte: toDate } },
      orderBy: { date: "asc" },
      include: { pdfs: true },
    });

    let running = opening;

    const mapped = items.map((t) => {
      const amt = Number(t.amount || 0);
      running += t.drcr === "DR" ? amt : -amt;

      return {
        id: t.id,
        date: t.date ? t.date.toISOString().slice(0, 10) : "",
        voucherNo: t.voucherNo,
        voucherType: t.type,
        narration: t.narration || "",
        debit: t.drcr === "DR" ? amt : 0,
        credit: t.drcr === "CR" ? amt : 0,
        runningBalance: running,
        pdfs: (t.pdfs || []).map((p) => ({
          id: p.id,
          name: p.originalName,
          url: `/pdfs/${p.id}`,
        })),
      };
    });

    res.json({
      opening,
      closing: running,
      items: mapped,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Failed", details: String(e.message || e) });
  }
});

// ✅ Export Ledger PDF (customer)
app.get("/customer-portal/export-ledger-pdf", requireCustomer, async (req, res) => {
  const partyId = req.customerId;
  const { from, to } = req.query;

  const toDate = to ? String(to) : new Date().toISOString().slice(0, 10);
  const fromDate = from ? String(from) : new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);

  const auth = req.headers.authorization || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : (req.query?.token ? String(req.query.token) : "");

  res.redirect(
    `/ledger/${partyId}/pdf?from=${encodeURIComponent(fromDate)}&to=${encodeURIComponent(toDate)}&token=${encodeURIComponent(token)}`
  );
});

/* =========================
   ROOT
========================= */
app.get("/", (req, res) => {
  res.send("STAR ENGINEERING API RUNNING 🚀");
});

app.listen(PORT, () => {
  console.log("Server running on port:", PORT);
});