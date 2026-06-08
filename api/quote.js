const { Resend } = require("resend");

// Where quote requests are delivered.
const TO_EMAIL = "matthew@gordonlandscaping.ca";
// Must be an address on a domain verified in your Resend account.
const FROM_EMAIL = "Gordon Landscaping <quotes@gordonlandscaping.ca>";

const MAX_TOTAL_BYTES = 4 * 1024 * 1024; // stay under Vercel's ~4.5MB request cap

function escapeHtml(value) {
  return String(value == null ? "" : value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function row(label, value) {
  if (!value) return "";
  return `<tr>
    <td style="padding:6px 12px;font-weight:600;color:#0f172a;vertical-align:top;white-space:nowrap;">${escapeHtml(label)}</td>
    <td style="padding:6px 12px;color:#334155;">${escapeHtml(value).replace(/\n/g, "<br/>")}</td>
  </tr>`;
}

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!process.env.RESEND_API_KEY) {
    return res
      .status(500)
      .json({ error: "Email is not configured. Missing RESEND_API_KEY." });
  }

  let body = req.body;
  if (typeof body === "string") {
    try {
      body = JSON.parse(body);
    } catch (e) {
      return res.status(400).json({ error: "Invalid request body." });
    }
  }
  body = body || {};

  const {
    name,
    phone,
    email,
    service,
    location,
    size,
    timeline,
    details,
    photos,
    // honeypot: real users leave this empty
    company,
  } = body;

  // Silently accept bot submissions without sending anything.
  if (company) {
    return res.status(200).json({ ok: true });
  }

  if (!name || !phone || !email || !service) {
    return res
      .status(400)
      .json({ error: "Please fill in name, phone, email, and service." });
  }

  // Build photo attachments from base64 data URLs sent by the browser.
  const attachments = [];
  let totalBytes = 0;
  if (Array.isArray(photos)) {
    for (let i = 0; i < photos.length; i++) {
      const item = photos[i];
      if (!item || typeof item.data !== "string") continue;
      const base64 = item.data.includes(",")
        ? item.data.slice(item.data.indexOf(",") + 1)
        : item.data;
      const buffer = Buffer.from(base64, "base64");
      totalBytes += buffer.length;
      if (totalBytes > MAX_TOTAL_BYTES) {
        return res.status(413).json({
          error: "Photos are too large. Please remove a photo and try again.",
        });
      }
      attachments.push({
        filename: item.name || `photo-${i + 1}.jpg`,
        content: buffer,
      });
    }
  }

  const html = `
    <div style="font-family:Arial,Helvetica,sans-serif;max-width:640px;margin:0 auto;">
      <h2 style="color:#0f172a;margin:0 0 4px;">New quote request</h2>
      <p style="color:#64748b;margin:0 0 16px;font-size:14px;">From the gordonlandscaping.ca website</p>
      <table style="border-collapse:collapse;width:100%;font-size:14px;">
        ${row("Name", name)}
        ${row("Phone", phone)}
        ${row("Email", email)}
        ${row("Service", service)}
        ${row("Address / Area", location)}
        ${row("Approx. size", size)}
        ${row("Timeline", timeline)}
        ${row("Details", details)}
        ${row("Photos", attachments.length ? `${attachments.length} attached` : "")}
      </table>
    </div>`;

  const text = [
    "New quote request from gordonlandscaping.ca",
    "",
    `Name: ${name}`,
    `Phone: ${phone}`,
    `Email: ${email}`,
    `Service: ${service}`,
    location ? `Address / Area: ${location}` : null,
    size ? `Approx. size: ${size}` : null,
    timeline ? `Timeline: ${timeline}` : null,
    details ? `Details: ${details}` : null,
    attachments.length ? `Photos: ${attachments.length} attached` : null,
  ]
    .filter(Boolean)
    .join("\n");

  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [TO_EMAIL],
      replyTo: email,
      subject: `Quote request: ${service} — ${name}`,
      html,
      text,
      attachments: attachments.length ? attachments : undefined,
    });

    if (error) {
      console.error("Resend error:", error);
      return res
        .status(502)
        .json({ error: "Could not send your request. Please try again or call us." });
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("Quote handler error:", err);
    return res
      .status(500)
      .json({ error: "Something went wrong. Please try again or call us." });
  }
};
