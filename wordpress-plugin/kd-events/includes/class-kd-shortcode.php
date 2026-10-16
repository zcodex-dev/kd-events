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
        add_shortcode('kd_enrollment', [$this, 'render_enrollment_shortcode']);
    }

    public function render_shortcode($atts) {
        $atts = shortcode_atts([
            'id' => '',
            'slug' => '',
            'layout' => 'content',
            'bg' => '',
            'lang' => 'en',
        ], $atts, 'kd_event');

        if ($atts['layout'] === 'enrollment') {
            return KD_Event_Renderer::render_enrollment('content', $atts['bg'], $atts['lang']);
        }

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

    public function render_enrollment_shortcode($atts) {
        $atts = shortcode_atts([
            'layout' => 'content',
            'bg' => '',
            'lang' => 'en',
        ], $atts, 'kd_enrollment');

        return KD_Event_Renderer::render_enrollment($atts['layout'], $atts['bg'], $atts['lang']);
    }
}
