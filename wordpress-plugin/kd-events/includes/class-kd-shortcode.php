<?php
if (!defined('ABSPATH')) {
    exit;
}

class KD_Event_Shortcode {
    private static $instance = null;

    public static function instance() {
        if (is_null(self::$instance)) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    private function __construct() {
        add_shortcode('kd_event', [$this, 'render_shortcode']);
    }

    public function render_shortcode($atts) {
        $atts = shortcode_atts([
            'id' => '',
            'slug' => '',
            'layout' => 'content',
        ], $atts, 'kd_event');

        $identifier = !empty($atts['id']) ? $atts['id'] : $atts['slug'];

        if (!empty($identifier)) {
            $event = KD_Event_API::get_event_by_id_or_slug($identifier);
        } else {
            // Default to first active event
            $events = KD_Event_API::fetch_events();
            $event = !empty($events[0]) ? $events[0] : null;
        }

        if (!$event) {
            return '<div class="kd-error-notice">Event not found.</div>';
        }

        return KD_Event_Renderer::render($event, $atts['layout']);
    }
}
