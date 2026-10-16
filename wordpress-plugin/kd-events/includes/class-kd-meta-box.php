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
        $featureType = get_post_meta($post->ID, '_kd_feature_type', true) ?: 'event';
        $selectedId = get_post_meta($post->ID, '_kd_event_id', true);
        $layoutMode = get_post_meta($post->ID, '_kd_event_layout_mode', true) ?: 'canvas';
        $enrollmentBg = get_post_meta($post->ID, '_kd_enrollment_bg', true);

        $events = KD_Event_API::fetch_events();
        ?>
        <div style="font-family: inherit; font-size: 13px; line-height: 1.5;">
            <p>
                <label style="font-weight: 600; display: flex; align-items: center; gap: 8px;">
                    <input type="checkbox" name="kd_event_enabled" value="1" <?php checked($enabled, true); ?> />
                    <span>Display Kompong Dewa Showcase on this page</span>
                </label>
            </p>

            <div id="kd-event-selector-wrap" style="<?php echo $enabled ? '' : 'display:none;'; ?> margin-top: 12px; border-top: 1px solid #ddd; padding-top: 8px;">
                <p>
                    <label style="font-weight: 600; display: block; margin-bottom: 4px;">Feature to Display:</label>
                    <select name="kd_feature_type" id="kd_feature_type" style="width: 100%;">
                        <option value="event" <?php selected($featureType, 'event'); ?>>Event Showcase</option>
                        <option value="enrollment" <?php selected($featureType, 'enrollment'); ?>>Membership Enrollment</option>
                    </select>
                </p>

                <div id="kd-event-specific-fields" style="<?php echo $featureType === 'enrollment' ? 'display:none;' : ''; ?>">
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
                </div>

                <div id="kd-enrollment-specific-fields" style="<?php echo $featureType === 'enrollment' ? '' : 'display:none;'; ?>">
                    <p>
                        <label style="font-weight: 600; display: block; margin-bottom: 4px;">Banner Image URL (Optional):</label>
                        <input
                            type="url"
                            name="kd_enrollment_bg"
                            value="<?php echo esc_attr($enrollmentBg); ?>"
                            placeholder="https://i.imgur.com/ETXgnCg.jpeg"
                            style="width: 100%;"
                        />
                        <span style="display: block; color: #666; font-size: 11px; margin-top: 4px;">
                            Leave blank to use the default resort banner image.
                        </span>
                    </p>
                </div>

                <p>
                    <label style="font-weight: 600; display: block; margin-bottom: 4px;">Display Mode:</label>
                    <select name="kd_event_layout_mode" style="width: 100%;">
                        <option value="canvas" <?php selected($layoutMode, 'canvas'); ?>>Full Page Canvas (Authentic Resort Experience)</option>
                        <option value="content" <?php selected($layoutMode, 'content'); ?>>Within Theme Content</option>
                    </select>
                    <span style="display: block; color: #666; font-size: 11px; margin-top: 4px;">
                        Full Page Canvas provides the authentic standalone resort view without theme styling conflicts.
                    </span>
                </p>
            </div>
        </div>

        <script>
            (function() {
                var chk = document.querySelector('input[name="kd_event_enabled"]');
                var wrap = document.getElementById('kd-event-selector-wrap');
                var featSelect = document.getElementById('kd_feature_type');
                var evFields = document.getElementById('kd-event-specific-fields');
                var enFields = document.getElementById('kd-enrollment-specific-fields');

                if (chk && wrap) {
                    chk.addEventListener('change', function() {
                        wrap.style.display = this.checked ? 'block' : 'none';
                    });
                }

                if (featSelect && evFields && enFields) {
                    featSelect.addEventListener('change', function() {
                        if (this.value === 'enrollment') {
                            evFields.style.display = 'none';
                            enFields.style.display = 'block';
                        } else {
                            evFields.style.display = 'block';
                            enFields.style.display = 'none';
                        }
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

        if (isset($_POST['kd_feature_type'])) {
            update_post_meta($postId, '_kd_feature_type', sanitize_text_field($_POST['kd_feature_type']));
        }

        if (isset($_POST['kd_event_id'])) {
            update_post_meta($postId, '_kd_event_id', sanitize_text_field($_POST['kd_event_id']));
        }

        if (isset($_POST['kd_enrollment_bg'])) {
            update_post_meta($postId, '_kd_enrollment_bg', esc_url_raw($_POST['kd_enrollment_bg']));
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
        $featureType = get_post_meta($postId, '_kd_feature_type', true) ?: 'event';
        $layoutMode = get_post_meta($postId, '_kd_event_layout_mode', true) ?: 'canvas';

        if ($enabled && $layoutMode === 'canvas') {
            if ($featureType === 'enrollment') {
                $canvasEnrollTemplate = KD_EVENTS_DIR . 'templates/canvas-enrollment.php';
                if (file_exists($canvasEnrollTemplate)) {
                    return $canvasEnrollTemplate;
                }
            } else {
                $canvasTemplate = KD_EVENTS_DIR . 'templates/canvas-event.php';
                if (file_exists($canvasTemplate)) {
                    return $canvasTemplate;
                }
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
        $featureType = get_post_meta($postId, '_kd_feature_type', true) ?: 'event';
        $layoutMode = get_post_meta($postId, '_kd_event_layout_mode', true) ?: 'canvas';

        if ($enabled && $layoutMode === 'content') {
            if ($featureType === 'enrollment') {
                $customBg = get_post_meta($postId, '_kd_enrollment_bg', true);
                return KD_Event_Renderer::render_enrollment('content', $customBg);
            }

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
