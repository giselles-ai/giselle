# Email Templates

Email templates for Giselle using [React Email](https://react.email/).

## Development

Start the email preview server:

```bash
pnpm -F studio.giselles.ai email:dev
```

This opens a local preview server at `http://localhost:3333` where you can view and test email templates.

## Static Assets

- Store shared images in `apps/studio.giselles.ai/public/emails`. These files are served from `/emails/*` in production emails.
- The `emails/static` directory is a symlink to the public assets, so the React Email preview (`pnpm email:dev`) can continue to serve `/static/*` without duplicating files.
- Use `getEmailAssetUrl("<filename>")` (re-exported via `emails/components`) to reference any asset. The helper automatically switches between `/static` for preview and `/emails` for production, so **do not** hardcode `baseUrl` yourself.
- `EmailHeader` and `EmailFooter` already include the Giselle logo, footer logo, and social icons using `getEmailAssetUrl`. Just render them without props—no need to pass URLs or hosts.

## Creating Templates

Add new email templates in this directory. Example:

```tsx
import { Html, Head, Body, Container, Text } from '@react-email/components';

export const MyEmail = ({ name }: { name: string }) => {
  return (
    <Html>
      <Head />
      <Body>
        <Container>
          <Text>Hello {name}!</Text>
        </Container>
      </Body>
    </Html>
  );
};

export default MyEmail;
```

## Exporting Templates

Export templates as static HTML:

```bash
pnpm -F studio.giselles.ai email:export
```

Output will be in the `out/` directory.

## Marketing Emails

Marketing emails are stored in the `marketing/` directory. These templates are used for promotional and marketing campaigns.

### 📘 Giselle Email Style Guide v1

#### 🌐 Overview

Giselle marketing emails are designed with the purpose of:

**"Brand experience as an extension of product experience"**

All emails belong to one of these three categories:

- **Onboarding / Lifecycle** – Guide new users
- **Product Updates / Campaigns** – New features, events, community
- **Reactivation / Special** – Re-engagement, appreciation, celebrations

#### 🎨 Visual System

| Element | Recommended Style | Notes |
|---------|------------------|-------|
| Background | `#0B0F1A` (dark) + white container | For positive experiences like Onboarding, Campaigns |
| Spacing | 32px top/bottom / 24px inner padding | Always maintain breathing room |
| Logo | Giselle logo at top center | Size 32–40px |
| Title (H1) | `font-size: 24px; font-weight: 600;` | Main message |
| Subtitle | `font-size: 16px; color: var(--color-text-muted)` | Explanatory text |
| CTA Button | `background: var(--color-accent-blue)` | `border-radius: 8px; padding: 14px 28px;` |
| Body Text | `font-size: 15px; line-height: 1.6;` | Inter, sans-serif |
| Footer | `font-size: 13px; color: #9CA3AF;` | Support links, copyright, etc. |

#### ✉️ Folder Structure

```
marketing/
 ├─ onboarding/
 │   ├─ 01-welcome
 │   ├─ 02-first-workspace
 │   └─ 03-reminder
 │
 ├─ product-updates/
 │   ├─ new-feature-release
 │   ├─ release-notes-digest
 │   └─ changelog-announcement
 │
 ├─ campaigns/
 │   ├─ webinar-invitation
 │   ├─ ambassador-invite
 │   └─ feedback-survey
 │
 ├─ reactivation/
 │   ├─ long-time-no-see
 │   └─ incomplete-signup
 │
 └─ special/
     ├─ year-in-review
     ├─ milestone-celebration
     └─ thank-you-for-building
```

#### 🧭 Messaging Guidelines

| Category | Tone | Dark Background | CTA Examples | Purpose |
|----------|------|----------------|--------------|---------|
| Onboarding | Friendly × Guided | ✅ Yes | Get Started / Explore Docs | Guide first-time experience |
| Product Updates | Professional × Confident | ⚪ Yes | View Updates / Try It | Feature introduction, announcements |
| Campaigns | Bright × Community | ✅ Yes | Join Event / Learn More | Encourage participation, engagement |
| Reactivation | Warm × Personal | ⚪ Short | Return to Giselle | Promote return, reuse |
| Special | Reflective × Thankful | ✅ Yes | View Story / Celebrate | Share appreciation, milestones |

#### 🪄 Example Templates

**🩵 Onboarding → 01-welcome**

- **Subject**: Welcome to Giselle — your AI workspace starts here 🪶
- **Header**: Welcome to Giselle. / Your journey to build AI agents begins here.
- **Body**: Hi {{firstName}}, We're thrilled to have you on board. Start by creating your first workspace — it only takes a few minutes.
- **CTA**: [Create your workspace]

**💎 Product Updates → new-feature-release**

- **Subject**: Giselle now supports Gemini 2.5 Flash 🚀
- **Header**: New in Giselle. / Smarter, faster, and more connected than ever.
- **Body**: You can now integrate Gemini 2.5 Flash directly into your agent flows. Build multi-model orchestration with ease — no extra setup required.
- **CTA**: [View Update]

**🌷 Campaigns → ambassador-invite**

- **Subject**: Join the Giselle Ambassador Program 🪶
- **Header**: Let's grow together. / Become a Giselle Ambassador.
- **Body**: We're inviting creators and developers to join our early ambassador program. Share your workflows, build templates, and shape the next generation of AI builders.
- **CTA**: [Apply Now]

**⚡ Reactivation → long-time-no-see**

- **Subject**: We've missed you at Giselle 💫
- **Header**: It's been a while. / Your agents are waiting for you.
- **Body**: A lot has changed since your last visit — new models, new features, and faster deployments. Come see what's new and continue building.
- **CTA**: [Return to Giselle]

**🎉 Special → year-in-review**

- **Subject**: Your 2025 journey with Giselle ✨
- **Header**: A year of creation. / Thank you for building with us.
- **Body**: This year, thousands of agents were created in Giselle — and you were part of it. Here's a look back at your milestones and what's coming next.
- **CTA**: [View Your 2025 Highlights]

#### 🔐 Footer Guideline

Common footer (insert in all marketing emails - same structure as transactional emails):

**Structure:**
1. Footer logo (`letter_footer-logo.png`) with reduced opacity (0.3)
2. Links: Product / Blog / Documentation (horizontal, separated by " / ")
3. Social media icons (GitHub, LinkedIn, Facebook, X, Instagram, YouTube)
4. Copyright: `© {current year} Giselle`
5. Explanation text: "You received this email because you signed up for Giselle—a platform for building AI agents."

**Links:**
- Product: `https://giselles.ai`
- Blog: `https://giselles.ai/blog`
- Documentation: `https://docs.giselles.ai/en/guides/introduction`

**Social Media Links:**
- GitHub: `https://github.com/giselles-ai/giselle`
- LinkedIn: `https://www.linkedin.com/showcase/giselles-ai/`
- Facebook: `https://www.facebook.com/GiselleAI/`
- X: `https://x.com/Giselles_AI`
- Instagram: `https://www.instagram.com/giselle_de_ai`
- YouTube: `https://www.youtube.com/@Giselle_AI`

#### 📏 Content Tips

- Convey only one purpose (no multiple CTAs)
- Complete within one screen (approximately 400–500px)
- Use 1–2 emojis maximum
- Make it clear what the user should do next
- Use experiential tone: Unify with action verbs like "Build," "Explore," "Collaborate," "Orchestrate"

#### 🪶 End Note

> "Every email from Giselle should feel like a calm, confident nudge — not a shout."

### Creating Marketing Email Templates

1. Create a new template file in `apps/studio.giselles.ai/emails/marketing/`
2. Follow the same structure as other email templates (header, footer, etc.)
3. Export the component as default

Example:

```tsx
import {
  Body,
  Container,
  Font,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";

interface NewsletterEmailProps {
  userName?: string;
  unsubscribeUrl?: string;
}

// Set NEXT_PUBLIC_SITE_URL to the URL of your self-hosted instance.
const baseUrl =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.NODE_ENV === "development" ? "http://localhost:3333" : undefined);

if (!baseUrl) {
  throw new Error("Set NEXT_PUBLIC_SITE_URL to the URL of your self-hosted instance.");
}

export const NewsletterEmail = ({
  userName = "there",
  unsubscribeUrl,
}: NewsletterEmailProps) => {
  return (
    <Html>
      <Head>
        {/* Font components */}
      </Head>
      <Preview>Newsletter preview text</Preview>
      <Body style={main}>
        {/* Email content */}
      </Body>
    </Html>
  );
};

export default NewsletterEmail;
```

### Using Marketing Email Templates

To use a marketing email template:

1. Import the template component
2. Render it to HTML using React Email's `render` function
3. Send the HTML via your email service

```tsx
import { render } from "@react-email/render";
import { NewsletterEmail } from "./emails/marketing/newsletter";

const html = render(
  <NewsletterEmail
    userName="John Doe"
    unsubscribeUrl="https://giselles.ai/unsubscribe"
  />
);

// Send email using your email service
await sendEmail("Newsletter Subject", html, recipients);
```

### Best Practices

- Always include an unsubscribe link in marketing emails
- Use clear and engaging subject lines
- Test templates across different email clients
- Keep content concise and focused
- Include a clear call-to-action (CTA)

## Resources

- [React Email Documentation](https://react.email/docs/introduction)
- [React Email Components](https://react.email/docs/components/html)
