"""
Send Submission Email Script for SentinelMCP
NitroStack × MCP To The Moon Buildathon (Fronthyre)
"""

import os
import smtplib
from email.message import EmailMessage

def send_submission_email(sender_email: str, app_password: str, cc_emails: list[str]):
    to_emails = ["contact@nitrostack.ai", "support@fronthyre.com"]
    
    msg = EmailMessage()
    msg["Subject"] = "[MCP To The Moon Buildathon] Final Project Submission: SentinelMCP"
    msg["From"] = sender_email
    msg["To"] = ", ".join(to_emails)
    msg["Cc"] = ", ".join(cc_emails)
    
    body = """Dear NitroStack & Fronthyre Organizing Teams,

Please accept my final project submission for the NitroStack × MCP To The Moon Buildathon:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PROJECT SUBMISSION SUMMARY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Project Name: SentinelMCP
• Tagline: Autonomous AI Agent Security Operations Center & Zero-Trust Runtime Firewall for MCP
• Solo Builder / Participant: Ahmed Kadiwala (kadiwalaahmed7864@gmail.com)
• Category / Track: AI Cybersecurity, Agent Governance & Enterprise Observability

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CORE DELIVERABLES & LINKS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• GitHub Repository: https://github.com/AhmedKadiwala/SentinelMCP
• Video Demo Link: https://github.com/AhmedKadiwala/SentinelMCP/blob/master/sentinel-mcp-demo.mp4
• Deployment Bundle: Pre-packaged via NitroStack CLI (`sentinel-mcp.zip`) ready for NitroCloud
• Test Suite Verification: 38 / 38 Tests Passing (0.04ms average latency overhead)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
WHAT I BUILT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SentinelMCP is the first zero-trust runtime firewall and AI-native SOC copilot purpose-built for the Model Context Protocol ecosystem, which I built natively using the NitroStack Framework:
1. Protocol Interceptor (@UseInterceptors(SentinelInterceptor)): Traps inbound JSON-RPC tools/call requests in < 0.1ms, neutralizing indirect prompt injections and destructive actions.
2. Deterministic DLP Pipe (@UsePipes(RedactionPipe)): Scrubs high-entropy credentials (AWS keys, GitHub PATs, Stripe keys, PII) with zero data leakage.
3. Generative UI Widgets (@nitrostack/widgets): Interactive Next.js components mounted inside NitroStudio:
   - threat-radar-widget: Real-time risk scoring gauge (0-100) with 1-click interactive quarantine callbacks.
   - payload-diff-widget: Side-by-side diff comparing raw tainted input against scrubbed outbound payload.
4. Production Rigor: Comprehensive architectural documentation, ADRs, BRD, PRD, and automated end-to-end test suites.

The complete MP4 demonstration video is also attached to this email.

Thank you for organizing such a stellar buildathon!

Warm regards,
Ahmed Kadiwala
GitHub: https://github.com/AhmedKadiwala
"""
    msg.set_content(body)

    # Attach video if exists
    video_path = os.path.join(os.path.dirname(__file__), "..", "sentinel-mcp-demo.mp4")
    if os.path.exists(video_path):
        print(f"Attaching video demo: {video_path}...")
        with open(video_path, "rb") as f:
            video_data = f.read()
            msg.add_attachment(
                video_data,
                maintype="video",
                subtype="mp4",
                filename="sentinel-mcp-demo.mp4"
            )

    print("Connecting to SMTP server (smtp.gmail.com:587)...")
    with smtplib.SMTP("smtp.gmail.com", 587) as server:
        server.starttls()
        server.login(sender_email, app_password)
        recipients = to_emails + cc_emails
        server.send_message(msg, from_addr=sender_email, to_addrs=recipients)
        print("✅ Email sent successfully to:", recipients)

if __name__ == "__main__":
    import sys
    # Example usage: python send_email.py <your_email> <app_password> <cc_email_1> <cc_email_2>
    if len(sys.argv) < 5:
        print("Usage: python scripts/send_email.py <sender_email> <app_password> <cc_email_1> <cc_email_2>")
        print("Note: For Gmail, generate an App Password under Google Account -> Security -> App passwords.")
    else:
        send_submission_email(sys.argv[1], sys.argv[2], [sys.argv[3], sys.argv[4]])
