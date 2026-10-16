<?php
/**
 * KD Events Auto-Updater
 * Integrates WordPress core plugin update API with GitHub & remote repository releases.
 */

if (!defined('ABSPATH')) {
    exit;
}

class KD_Event_Updater {
    private static $instance = null;

    const PRIMARY_MANIFEST_URL  = 'https://raw.githubusercontent.com/zcodex-dev/kd-events/main/wordpress-plugin/version.json';
    const FALLBACK_MANIFEST_URL = 'https://kompongdewa.win/api/plugin-version';
    const STATIC_MANIFEST_URL   = 'https://kompongdewa.win/version.json';
    const TRANSIENT_KEY         = 'kd_events_remote_version_info';
    const CACHE_TTL             = 21600; // 6 hours cache

    private $plugin_file;
    private $plugin_basename;
    private $plugin_slug = 'kd-events';

    public static function instance() {
        if (is_null(self::$instance)) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    private function __construct() {
        $this->plugin_file     = KD_EVENTS_DIR . 'kd-events.php';
        $this->plugin_basename = plugin_basename($this->plugin_file);

        // Core WordPress update hooks
        add_filter('pre_set_site_transient_update_plugins', [$this, 'filter_update_plugins']);
        add_filter('plugins_api', [$this, 'filter_plugins_api'], 20, 3);
        add_filter('upgrader_post_install', [$this, 'filter_post_install'], 10, 3);

        // UI & Action hooks
        add_filter('plugin_row_meta', [$this, 'filter_plugin_row_meta'], 10, 2);
        add_filter('plugin_action_links_' . $this->plugin_basename, [$this, 'filter_action_links']);
        add_action('admin_init', [$this, 'handle_manual_check']);
        add_action('admin_notices', [$this, 'render_admin_notices']);
        add_action('admin_post_kd_check_update_now', [$this, 'handle_post_check_update']);
    }

    /**
     * Retrieve remote version manifest with multi-source failover and caching.
     *
     * @param bool $force Bypass transient cache if true.
     * @return object|false
     */
    public function get_remote_version_info($force = false) {
        if (!$force) {
            $cached = get_site_transient(self::TRANSIENT_KEY);
            if ($cached && is_object($cached) && !empty($cached->version)) {
                return $cached;
            }
        }

        $endpoints = [
            self::PRIMARY_MANIFEST_URL . '?t=' . time(),
            self::FALLBACK_MANIFEST_URL,
            self::STATIC_MANIFEST_URL . '?t=' . time(),
        ];

        $remote_data = false;

        foreach ($endpoints as $url) {
            $response = wp_remote_get($url, [
                'timeout'    => 10,
                'sslverify'  => true,
                'headers'    => [
                    'Accept'     => 'application/json',
                    'User-Agent' => 'WordPress/' . get_bloginfo('version') . '; ' . home_url(),
                ],
            ]);

            if (is_wp_error($response)) {
                continue;
            }

            $code = wp_remote_retrieve_response_code($response);
            if ($code !== 200) {
                continue;
            }

            $body = wp_remote_retrieve_body($response);
            if (empty($body)) {
                continue;
            }

            $json = json_decode($body);
            if ($json && is_object($json) && !empty($json->version)) {
                $remote_data = $json;
                break;
            }
        }

        if ($remote_data) {
            $remote_data->last_checked_time = current_time('mysql');
            set_site_transient(self::TRANSIENT_KEY, $remote_data, self::CACHE_TTL);
            return $remote_data;
        }

        return false;
    }

    /**
     * Inject update payload into WordPress update_plugins transient.
     *
     * @param object $transient
     * @return object
     */
    public function filter_update_plugins($transient) {
        if (!is_object($transient)) {
            $transient = new stdClass();
        }

        $remote = $this->get_remote_version_info();
        if (!$remote || empty($remote->version)) {
            return $transient;
        }

        $current_version = defined('KD_EVENTS_VERSION') ? KD_EVENTS_VERSION : '1.0.0';

        if (version_compare($remote->version, $current_version, '>')) {
            $item = new stdClass();
            $item->id           = $this->plugin_basename;
            $item->slug         = $this->plugin_slug;
            $item->plugin       = $this->plugin_basename;
            $item->new_version  = $remote->version;
            $item->url          = $remote->author_homepage ?? 'https://kompongdewa.win';
            $item->package      = $remote->download_url ?? 'https://kompongdewa.win/kd-events.zip';
            $item->tested       = $remote->tested ?? '';
            $item->requires     = $remote->requires ?? '';
            $item->requires_php = $remote->requires_php ?? '7.4';

            if (!empty($remote->icons)) {
                $item->icons = (array) $remote->icons;
            } else {
                $item->icons = [
                    'default' => 'https://kompongdewa.win/kd-logo.png',
                ];
            }

            if (!empty($remote->banners)) {
                $item->banners = (array) $remote->banners;
            }

            $transient->response[$this->plugin_basename] = $item;

            if (isset($transient->no_update[$this->plugin_basename])) {
                unset($transient->no_update[$this->plugin_basename]);
            }
        } else {
            $no_update = new stdClass();
            $no_update->id           = $this->plugin_basename;
            $no_update->slug         = $this->plugin_slug;
            $no_update->plugin       = $this->plugin_basename;
            $no_update->new_version  = $current_version;
            $no_update->url          = $remote->author_homepage ?? 'https://kompongdewa.win';
            $no_update->package      = '';
            $no_update->tested       = $remote->tested ?? '';
            $no_update->requires     = $remote->requires ?? '';
            $no_update->requires_php = $remote->requires_php ?? '7.4';

            $transient->no_update[$this->plugin_basename] = $no_update;

            if (isset($transient->response[$this->plugin_basename])) {
                unset($transient->response[$this->plugin_basename]);
            }
        }

        return $transient;
    }

    /**
     * Provide rich metadata for the WordPress "View version details" modal popup.
     *
     * @param false|object|array $result
     * @param string $action
     * @param object $args
     * @return object
     */
    public function filter_plugins_api($result, $action, $args) {
        if ($action !== 'plugin_information' || empty($args->slug) || $args->slug !== $this->plugin_slug) {
            return $result;
        }

        $remote = $this->get_remote_version_info();
        if (!$remote) {
            return $result;
        }

        $res = new stdClass();
        $res->name           = !empty($remote->name) ? $remote->name : 'KD Events';
        $res->slug           = $this->plugin_slug;
        $res->version        = $remote->version;
        $res->author         = '<a href="' . esc_url($remote->author_homepage ?? 'https://kompongdewa.win') . '">' . esc_html($remote->author ?? 'Kompong Dewa Integrated Resort') . '</a>';
        $res->author_profile = $remote->author_homepage ?? 'https://kompongdewa.win';
        $res->homepage       = $remote->author_homepage ?? 'https://kompongdewa.win';
        $res->requires       = $remote->requires ?? '5.6';
        $res->tested         = $remote->tested ?? '6.7';
        $res->requires_php   = $remote->requires_php ?? '7.4';
        $res->downloaded     = 2500;
        $res->last_updated   = $remote->last_updated ?? date('Y-m-d H:i:s');
        $res->download_link  = $remote->download_url ?? 'https://kompongdewa.win/kd-events.zip';

        // Sections (Description, Installation, Changelog)
        if (!empty($remote->sections)) {
            $res->sections = (array) $remote->sections;
        } else {
            $res->sections = [
                'description'  => 'Premium luxury resort showcase and membership enrollment for Kompong Dewa Resort.',
                'installation' => 'Install and update directly through the WordPress admin panel.',
                'changelog'    => 'Automatic GitHub updates enabled.',
            ];
        }

        // Banners
        if (!empty($remote->banners)) {
            $res->banners = (array) $remote->banners;
        }

        return $res;
    }

    /**
     * Guarantee the plugin directory name stays normalized to 'kd-events' after update extraction.
     *
     * @param bool|WP_Error $true
     * @param array $hook_extra
     * @param array $result
     * @return array
     */
    public function filter_post_install($true, $hook_extra, $result) {
        if (!isset($hook_extra['plugin']) || $hook_extra['plugin'] !== $this->plugin_basename) {
            return $result;
        }

        global $wp_filesystem;
        $proper_destination = WP_PLUGIN_DIR . '/' . $this->plugin_slug;

        // If WordPress unzipped into a folder with a suffix (e.g. kd-events-main or kd-events-1.5.0)
        if (isset($result['destination']) && $result['destination'] !== $proper_destination) {
            if ($wp_filesystem->exists($proper_destination)) {
                $wp_filesystem->delete($proper_destination, true);
            }
            $wp_filesystem->move($result['destination'], $proper_destination);
            $result['destination'] = $proper_destination;
        }

        // Re-activate plugin if it was active before update
        if (!is_plugin_active($this->plugin_basename)) {
            activate_plugin($this->plugin_basename);
        }

        // Clear update transients so WordPress immediately knows the plugin is up to date
        delete_site_transient(self::TRANSIENT_KEY);
        delete_site_transient('update_plugins');

        return $result;
    }

    /**
     * Add "Settings" and "Check for updates" links on the main Plugins table row.
     */
    public function filter_action_links($actions) {
        $check_url = wp_nonce_url(admin_url('plugins.php?kd_action=check_update'), 'kd_check_update_nonce');
        $custom_actions = [
            'settings' => '<a href="' . esc_url(admin_url('options-general.php?page=kd-event-showcase')) . '">' . __('Settings', 'kd-events') . '</a>',
            'check_update' => '<a href="' . esc_url($check_url) . '" style="color:#2271b1;font-weight:600;">' . __('Check for updates', 'kd-events') . '</a>',
        ];
        return array_merge($custom_actions, $actions);
    }

    /**
     * Add GitHub repository and update channel info to the plugin row meta.
     */
    public function filter_plugin_row_meta($links, $file) {
        if ($file === $this->plugin_basename) {
            $links[] = '<a href="https://github.com/zcodex-dev/kd-events" target="_blank" rel="noopener noreferrer"><span class="dashicons dashicons-external" style="font-size:14px;vertical-align:text-bottom;"></span> GitHub Repo</a>';
        }
        return $links;
    }

    /**
     * Handle manual update check from GET request.
     */
    public function handle_manual_check() {
        if (!isset($_GET['kd_action']) || $_GET['kd_action'] !== 'check_update') {
            return;
        }

        if (!current_user_can('update_plugins')) {
            wp_die(__('You do not have permission to check for plugin updates.', 'kd-events'));
        }

        check_admin_referer('kd_check_update_nonce');

        $this->flush_and_recheck();

        $remote = $this->get_remote_version_info();
        $remote_ver = $remote && !empty($remote->version) ? $remote->version : 'unknown';

        wp_safe_redirect(add_query_arg([
            'kd_update_checked' => '1',
            'latest_ver'        => urlencode($remote_ver),
        ], admin_url('plugins.php')));
        exit;
    }

    /**
     * Handle manual update check from POST on Settings screen.
     */
    public function handle_post_check_update() {
        if (!current_user_can('update_plugins')) {
            wp_die(__('Unauthorized', 'kd-events'));
        }

        check_admin_referer('kd_check_update_settings_nonce');

        $this->flush_and_recheck();

        $remote = $this->get_remote_version_info();
        $remote_ver = $remote && !empty($remote->version) ? $remote->version : 'unknown';

        wp_safe_redirect(add_query_arg([
            'page'              => 'kd-event-showcase',
            'kd_update_checked' => '1',
            'latest_ver'        => urlencode($remote_ver),
        ], admin_url('options-general.php')));
        exit;
    }

    /**
     * Purge transients and force WordPress to re-evaluate plugin updates.
     */
    public function flush_and_recheck() {
        delete_site_transient(self::TRANSIENT_KEY);
        delete_site_transient('update_plugins');

        // Fetch fresh metadata
        $this->get_remote_version_info(true);

        // Signal WordPress core to check plugin updates
        if (function_exists('wp_update_plugins')) {
            wp_update_plugins();
        }
    }

    /**
     * Render dismissible notice after an update check is run.
     */
    public function render_admin_notices() {
        if (!isset($_GET['kd_update_checked'])) {
            return;
        }

        $latest_ver = isset($_GET['latest_ver']) ? sanitize_text_field($_GET['latest_ver']) : '';
        $current_ver = defined('KD_EVENTS_VERSION') ? KD_EVENTS_VERSION : '1.0.0';

        $has_update = !empty($latest_ver) && $latest_ver !== 'unknown' && version_compare($latest_ver, $current_ver, '>');
        ?>
        <div class="notice <?php echo $has_update ? 'notice-warning' : 'notice-success'; ?> is-dismissible" style="padding: 12px 14px;">
            <p style="margin: 0; font-size: 13px;">
                <strong>KD Events Auto-Update:</strong>
                Check completed successfully. Installed version: <code><?php echo esc_html($current_ver); ?></code>.
                Latest available version on GitHub / Server: <code><?php echo esc_html($latest_ver); ?></code>.
                <?php if ($has_update): ?>
                    <span style="display:inline-block; margin-left: 8px; font-weight: 700; color: #b45309;">
                        &rarr; A new version is available! Click &quot;Update Now&quot; in the plugin list to install.
                    </span>
                <?php else: ?>
                    <span style="display:inline-block; margin-left: 8px; color: #15803d; font-weight: 600;">
                        &check; Plugin is up to date!
                    </span>
                <?php endif; ?>
            </p>
        </div>
        <?php
    }
}
