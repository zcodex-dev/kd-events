# KD Events — WordPress Plugin

A native, high-performance WordPress plugin that embeds full luxury dark-themed event pages directly into any WordPress site without clunky iframes.

## Key Features

1. **Native Page Integration (No IFrames)**:
   - When creating or editing any WordPress Page, simply check **"Display Event Showcase on this page"** and select the event from the dropdown.
   - Choose between **Full Page Canvas** (renders an edge-to-edge luxury dark canvas with header and logo) or **Within Theme Content**.

2. **Flag Dropdown Language Switcher**:
   - Matches the luxury dark design with flag icons:
     - 🇺🇸 **English** (`https://flagcdn.com/w40/us.png`)
     - 🇮🇩 **Bahasa** (`https://flagcdn.com/w40/id.png`)
     - 🇨🇳 **Chinese** (`https://flagcdn.com/w40/cn.png`)
   - Dynamically defaults to the event's configured `Reading Page Default Language`.
   - Switches language instantly on the page without reloading.

3. **Live Countdown Timer**:
   - Accurately counts down (Days, Hours, Minutes, Seconds) to the event start time.

4. **Hero Media & Responsive Tables**:
   - Supports auto-playing muted MP4 videos or crisp event cover images with soft background blending.
   - Clean, touch-scrollable tournament structure and schedule tables.

5. **Shortcode & Block Support**:
   - Use `[kd_event id="<EVENT_ID>"]` or `[kd_event slug="baccarat-masters"]` in any page, post, or builder (Elementor, Divi, Gutenberg).

6. **Authentic Membership Enrollment UI**:
   - Supports embedding the full Membership Enrollment form with real-time OCR ID/passport validation, flag-based phone input, nationality selector, and multi-language support.
   - Use shortcode `[kd_enrollment]` or `[kd_enrollment layout="canvas"]`.
   - In Page Settings, select **Feature to Display &rarr; Membership Enrollment**.

---

## How to Install

1. Use the pre-packaged `kd-events.zip`.
2. In your WordPress admin panel, go to **Plugins -> Add New -> Upload Plugin**.
3. Choose `kd-events.zip` and click **Install Now**, then **Activate** (or **Replace active with uploaded** if updating).
4. (Optional) Go to **Settings -> KD Events** to verify the API endpoint (`https://kompongdewa.win/api/events`) and test connection.

---

## How to Create an Event Page

1. In WordPress Admin, navigate to **Pages -> Add New**.
2. Give your page a title (e.g. *Baccarat Masters*).
3. On the right sidebar, look for the **KD Event Showcase Settings** box:
   - Check **"Display Kompong Dewa Showcase on this page"**.
   - Feature to Display: **Event Showcase**.
   - Select the event from the dropdown list.
   - Select **Full Page Canvas** (Recommended for standalone luxury presentation).
4. Click **Publish**. Everything is placed and styled automatically!

---

## How to Create a Membership Enrollment Page

1. In WordPress Admin, navigate to **Pages -> Add New**.
2. Give your page a title (e.g. *Membership Enrollment*).
3. In the **KD Event Showcase Settings** box:
   - Check **"Display Kompong Dewa Showcase on this page"**.
   - Feature to Display: **Membership Enrollment**.
   - Select **Full Page Canvas** (or Within Theme Content).
   - (Optional) Provide a custom banner image URL.
4. Click **Publish** (or use shortcode `[kd_enrollment]` on any existing page).

---

## Automatic Updates via GitHub

This plugin includes native integration with WordPress core update APIs and GitHub:
- When a new release or update is committed to the GitHub repository (`https://github.com/zcodex-dev/kd-events`), WordPress will automatically display an update notice on **Plugins &rarr; Installed Plugins** (`There is a new version of KD Events available... Update now`).
- Clicking **Update Now** automatically downloads and upgrades the plugin in-place without manual file re-upload.
- To check for updates immediately at any time:
  - Go to **Plugins &rarr; Installed Plugins** and click **Check for updates** under KD Events, OR
  - Go to **Settings &rarr; KD Events** and click **Check for Updates on GitHub Now**.
