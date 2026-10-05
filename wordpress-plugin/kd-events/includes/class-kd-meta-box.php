<?php
if (!defined('ABSPATH')) {
    exit;
}

class KD_Event_Meta_Box {
    private static $instance = null;

    public static function instance() {
        if (is_null(self::$instance)) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    private function __construct() {
        add_action('add_meta_boxes', [$this, 'add_meta_boxes']);
        add_action('save_post', [$this, 'save_meta_box']);
        add_filter('template_include', [$this, 'handle_template_redirect']);
        add_filter('the_content', [$this, 'filter_content']);
    }

    public function add_meta_boxes() {
        add_meta_box(
            'kd_event_showcase_meta',
            'KD Event Showcase Settings',
            [$this, 'render_meta_box'],
            ['page', 'post'],
            'side',
            'high'
        );
    }

    public function render_meta_box($post) {
        wp_nonce_field('kd_event_meta_action', 'kd_event_meta_nonce');

        $enabled = get_post_meta($post->ID, '_kd_event_enabled', true) === '1';
        $selectedId = get_post_meta($post->ID, '_kd_event_id', true);
        $layoutMode = get_post_meta($post->ID, '_kd_event_layout_mode', true) ?: 'canvas';

        $events = KD_Event_API::fetch_events();
        ?>
        <div style="font-family: inherit; font-size: 13px; line-height: 1.5;">
            <p>
                <label style="font-weight: 600; display: flex; align-items: center; gap: 8px;">
                    <input type="checkbox" name="kd_event_enabled" value="1" <?php checked($enabled, true); ?> />
                    <span>Display Event Showcase on this page</span>
                </label>
            </p>

            <div id="kd-event-selector-wrap" style="<?php echo $enabled ? '' : 'display:none;'; ?> margin-top: 12px; border-top: 1px solid #ddd; pt-2;">
                <p>
                    <label style="font-weight: 600; display: block; margin-bottom: 4px;">Select Event:</label>
                    <select name="kd_event_id" style="width: 100%; max-width: 100%;">
                        <option value="">-- Choose an Event --</option>
                        <?php if (!empty($events)): ?>
                            <?php foreach ($events as $event): ?>
                                <option value="<?php echo esc_attr($event['id']); ?>" <?php selected($selectedId, $event['id']); ?>>
                                    <?php echo esc_html($event['title']); ?> (<?php echo esc_html($event['status'] ?? 'ACTIVE'); ?>)
                                </option>
                            <?php endforeach; ?>
                        <?php else: ?>
                            <option value="" disabled>No events found. Check API connection.</option>
                        <?php endif; ?>
                    </select>
                </p>

                <p>
                    <label style="font-weight: 600; display: block; margin-bottom: 4px;">Display Mode:</label>
                    <select name="kd_event_layout_mode" style="width: 100%;">
                        <option value="canvas" <?php selected($layoutMode, 'canvas'); ?>>Full Page Canvas (Clean Luxury Dark)</option>
                        <option value="content" <?php selected($layoutMode, 'content'); ?>>Within Theme Content</option>
                    </select>
                    <span style="display: block; color: #666; font-size: 11px; margin-top: 4px;">
                        Full Page Canvas provides the authentic standalone resort experience without theme styling conflicts.
                    </span>
                </p>
            </div>
        </div>

        <script>
            (function() {
                var chk = document.querySelector('input[name="kd_event_enabled"]');
                var wrap = document.getElementById('kd-event-selector-wrap');
                if (chk && wrap) {
                    chk.addEventListener('change', function() {
                        wrap.style.display = this.checked ? 'block' : 'none';
                    });
                }
            })();
        </script>
        <?php
    }

    public function save_meta_box($postId) {
        if (!isset($_POST['kd_event_meta_nonce']) || !wp_verify_nonce($_POST['kd_event_meta_nonce'], 'kd_event_meta_action')) {
            return;
        }

        if (defined('DOING_AUTOSAVE') && DOING_AUTOSAVE) {
            return;
        }

        if (!current_user_can('edit_post', $postId)) {
            return;
        }

        $enabled = !empty($_POST['kd_event_enabled']) ? '1' : '0';
        update_post_meta($postId, '_kd_event_enabled', $enabled);

        if (isset($_POST['kd_event_id'])) {
            update_post_meta($postId, '_kd_event_id', sanitize_text_field($_POST['kd_event_id']));
        }

        if (isset($_POST['kd_event_layout_mode'])) {
            update_post_meta($postId, '_kd_event_layout_mode', sanitize_text_field($_POST['kd_event_layout_mode']));
        }
    }

    public function handle_template_redirect($template) {
        if (!is_singular()) {
            return $template;
        }

        $postId = get_the_ID();
        $enabled = get_post_meta($postId, '_kd_event_enabled', true) === '1';
        $layoutMode = get_post_meta($postId, '_kd_event_layout_mode', true) ?: 'canvas';

        if ($enabled && $layoutMode === 'canvas') {
            $canvasTemplate = KD_EVENTS_DIR . 'templates/canvas-event.php';
            if (file_exists($canvasTemplate)) {
                return $canvasTemplate;
            }
        }

        return $template;
    }

    public function filter_content($content) {
        if (!is_singular() || !in_the_loop() || !is_main_query()) {
            return $content;
        }

        $postId = get_the_ID();
        $enabled = get_post_meta($postId, '_kd_event_enabled', true) === '1';
        $layoutMode = get_post_meta($postId, '_kd_event_layout_mode', true) ?: 'canvas';

        if ($enabled && $layoutMode === 'content') {
            $eventId = get_post_meta($postId, '_kd_event_id', true);
            if (!empty($eventId)) {
                $event = KD_Event_API::get_event_by_id_or_slug($eventId);
                if ($event) {
                    return KD_Event_Renderer::render($event, 'content');
                }
            }
        }

        return $content;
    }
}
