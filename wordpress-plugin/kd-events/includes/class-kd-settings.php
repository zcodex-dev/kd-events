<?php
if (!defined('ABSPATH')) {
    exit;
}

class KD_Event_Settings {
    private static $instance = null;

    public static function instance() {
        if (is_null(self::$instance)) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    private function __construct() {
        add_action('admin_menu', [$this, 'add_settings_page']);
        add_action('admin_init', [$this, 'register_settings']);
        add_action('admin_post_kd_flush_cache', [$this, 'handle_flush_cache']);
    }

    public function add_settings_page() {
        add_options_page(
            'KD Event Showcase Settings',
            'KD Events',
            'manage_options',
            'kd-event-showcase',
            [$this, 'render_settings_page']
        );
    }

    public function register_settings() {
        register_setting('kd_events_group', 'kd_events_api_url', [
            'type' => 'string',
            'sanitize_callback' => 'esc_url_raw',
            'default' => KD_Event_API::DEFAULT_API_URL,
        ]);

        register_setting('kd_events_group', 'kd_events_cache_duration', [
            'type' => 'integer',
            'sanitize_callback' => 'absint',
            'default' => 300,
        ]);
    }

    public function handle_flush_cache() {
        if (!current_user_can('manage_options')) {
            wp_die('Unauthorized');
        }

        check_admin_referer('kd_flush_cache_action', 'kd_flush_cache_nonce');
        KD_Event_API::flush_cache();
        KD_Event_API::fetch_events(true);

        wp_safe_redirect(add_query_arg(['page' => 'kd-event-showcase', 'cached_flushed' => '1'], admin_url('options-general.php')));
        exit;
    }

    public function render_settings_page() {
        if (!current_user_can('manage_options')) {
            return;
        }

        $apiUrl = KD_Event_API::get_api_url();
        $cacheDuration = KD_Event_API::get_cache_duration();
        $events = KD_Event_API::fetch_events();
        $isFlushed = isset($_GET['cached_flushed']);
        ?>
        <div class="wrap">
            <h1>KD Event Showcase Settings</h1>

            <?php if ($isFlushed): ?>
                <div class="notice notice-success is-dismissible">
                    <p><strong>Events cache cleared and refreshed successfully.</strong></p>
                </div>
            <?php endif; ?>

            <div style="background: #fff; padding: 20px; border-radius: 8px; border: 1px solid #ccd0d4; max-width: 800px; margin-top: 20px;">
                <form method="post" action="options.php">
                    <?php settings_fields('kd_events_group'); ?>

                    <table class="form-table" role="presentation">
                        <tr>
                            <th scope="row"><label for="kd_events_api_url">Events API Endpoint</label></th>
                            <td>
                                <input
                                    name="kd_events_api_url"
                                    type="url"
                                    id="kd_events_api_url"
                                    value="<?php echo esc_attr($apiUrl); ?>"
                                    class="regular-text"
                                    style="width: 100%; max-width: 500px;"
                                />
                                <p class="description">The URL returning the events JSON payload (Default: <code>https://kompongdewa.win/api/events</code>).</p>
                            </td>
                        </tr>
                        <tr>
                            <th scope="row"><label for="kd_events_cache_duration">Cache Expiration (Seconds)</label></th>
                            <td>
                                <input
                                    name="kd_events_cache_duration"
                                    type="number"
                                    id="kd_events_cache_duration"
                                    value="<?php echo esc_attr($cacheDuration); ?>"
                                    class="small-text"
                                    min="60"
                                    step="30"
                                />
                                <p class="description">How long to cache fetched events in WordPress transients (Default: 300 seconds / 5 mins).</p>
                            </td>
                        </tr>
                    </table>

                    <?php submit_button('Save Settings'); ?>
                </form>

                <hr style="margin: 25px 0;" />

                <h2>Cache Management &amp; Connection Status</h2>
                <p>Status:
                    <?php if (!empty($events)): ?>
                        <span style="display: inline-block; padding: 3px 8px; border-radius: 4px; background: #e7f5ea; color: #166534; font-weight: 600;">
                            Connected (<?php echo count($events); ?> active events synced)
                        </span>
                    <?php else: ?>
                        <span style="display: inline-block; padding: 3px 8px; border-radius: 4px; background: #fee2e2; color: #991b1b; font-weight: 600;">
                            No events returned. Check API URL.
                        </span>
                    <?php endif; ?>
                </p>

                <form method="post" action="<?php echo esc_url(admin_url('admin-post.php')); ?>">
                    <input type="hidden" name="action" value="kd_flush_cache" />
                    <?php wp_nonce_field('kd_flush_cache_action', 'kd_flush_cache_nonce'); ?>
                    <button type="submit" class="button button-secondary">
                        Force Refresh Events Cache Now
                    </button>
                </form>

                <?php if (!empty($events)): ?>
                    <h3 style="margin-top: 25px;">Available Events for Selection</h3>
                    <table class="widefat striped" style="margin-top: 10px;">
                        <thead>
                            <tr>
                                <th>Event Title</th>
                                <th>Category</th>
                                <th>Status</th>
                                <th>ID</th>
                                <th>Shortcode</th>
                            </tr>
                        </thead>
                        <tbody>
                            <?php foreach ($events as $e): ?>
                                <tr>
                                    <td><strong><?php echo esc_html($e['title']); ?></strong></td>
                                    <td><?php echo esc_html($e['tag'] ?? 'General'); ?></td>
                                    <td><code><?php echo esc_html($e['status'] ?? 'ACTIVE'); ?></code></td>
                                    <td><code><?php echo esc_html($e['id']); ?></code></td>
                                    <td><code>[kd_event id="<?php echo esc_attr($e['id']); ?>"]</code></td>
                                </tr>
                            <?php endforeach; ?>
                        </tbody>
                    </table>
                <?php endif; ?>
            </div>
        </div>
        <?php
    }
}
