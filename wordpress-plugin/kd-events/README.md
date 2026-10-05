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
3. On the right sidebar (or below the editor), look for the **KD Event Showcase Settings** box:
   - Check **"Display Event Showcase on this page"**.
   - Select the event from the dropdown list.
   - Select **Full Page Canvas** (Recommended for standalone luxury presentation).
4. Click **Publish**. Everything is placed and styled automatically!
