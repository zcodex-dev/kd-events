<?php
/**
 * Plugin Name: KD Events
 * Plugin URI: https://kompongdewa.win
 * Description: Premium luxury dark-themed event showcase. Place full event reading pages onto any WordPress page with live countdown, multi-language flag dropdown, and prize pool showcase without iframes.
 * Version: 1.3.9
 * Author: Kompong Dewa Integrated Resort
 * Author URI: https://kompongdewa.win
 * Text Domain: kd-events
 */

if (!defined('ABSPATH')) {
    exit;
}

define('KD_EVENTS_VERSION', '1.3.9');
define('KD_EVENTS_DIR', plugin_dir_path(__FILE__));
define('KD_EVENTS_URL', plugin_dir_url(__FILE__));

// Require Core Classes
require_once KD_EVENTS_DIR . 'includes/class-kd-api.php';
require_once KD_EVENTS_DIR . 'includes/class-kd-renderer.php';
require_once KD_EVENTS_DIR . 'includes/class-kd-meta-box.php';
require_once KD_EVENTS_DIR . 'includes/class-kd-shortcode.php';
require_once KD_EVENTS_DIR . 'includes/class-kd-settings.php';

final class KD_Event_Showcase {
    private static $instance = null;

    public static function instance() {
        if (is_null(self::$instance)) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    private function __construct() {
        add_action('init', [$this, 'init']);
        add_action('wp_enqueue_scripts', [$this, 'enqueue_assets']);
        add_action('wp_ajax_kd_register_event', [$this, 'handle_registration']);
        add_action('wp_ajax_nopriv_kd_register_event', [$this, 'handle_registration']);
    }

    public function init() {
        KD_Event_API::instance();
        KD_Event_Meta_Box::instance();
        KD_Event_Shortcode::instance();
        KD_Event_Settings::instance();

        // Automatically remove old stuck or broken kd-event-showcase folder
        if (is_admin() && current_user_can('activate_plugins')) {
            $stuckDir = WP_PLUGIN_DIR . '/kd-event-showcase';
            if (is_dir($stuckDir)) {
                require_once ABSPATH . 'wp-admin/includes/file.php';
                WP_Filesystem();
                global $wp_filesystem;
                if ($wp_filesystem) {
                    $wp_filesystem->delete($stuckDir, true);
                }
            }
        }
    }

    public function enqueue_assets() {
        $cssFile = KD_EVENTS_DIR . 'assets/css/kd-events.css';
        $jsFile = KD_EVENTS_DIR . 'assets/js/kd-events.js';
        $cssVer = file_exists($cssFile) ? filemtime($cssFile) : KD_EVENTS_VERSION;
        $jsVer = file_exists($jsFile) ? filemtime($jsFile) : KD_EVENTS_VERSION;

        wp_register_style(
            'kd-event-showcase',
            KD_EVENTS_URL . 'assets/css/kd-events.css',
            [],
            $cssVer
        );

        wp_register_script(
            'kd-event-showcase',
            KD_EVENTS_URL . 'assets/js/kd-events.js',
            [],
            $jsVer,
            true
        );

        wp_localize_script('kd-event-showcase', 'kdEventsConfig', [
            'ajaxUrl' => admin_url('admin-ajax.php'),
            'nonce' => wp_create_nonce('kd_events_nonce'),
        ]);
    }

    public function handle_registration() {
        if (!check_ajax_referer('kd_events_nonce', 'nonce', false)) {
            wp_send_json_error(['message' => 'Security check failed or session expired. Please refresh the page and try again.']);
        }

        $name = sanitize_text_field($_POST['name'] ?? '');
        $contact = sanitize_text_field($_POST['contact'] ?? '');
        $nationality = sanitize_text_field($_POST['nationality'] ?? '');
        $isNonMemberTab = sanitize_text_field($_POST['isNonMemberTab'] ?? 'true');
        $wantsMembership = sanitize_text_field($_POST['wantsMembership'] ?? 'false');
        $memberId = sanitize_text_field($_POST['memberId'] ?? '');
        $eventId = sanitize_text_field($_POST['eventId'] ?? '');
        $eventTitle = sanitize_text_field($_POST['eventTitle'] ?? '');

        if (empty($name)) {
            wp_send_json_error(['message' => 'Please enter your full name.']);
        }

        if (empty($contact)) {
            wp_send_json_error(['message' => 'Please enter your contact information (phone number or email).']);
        }

        $postData = [
            'name' => $name,
            'contact' => $contact,
            'phoneNumber' => $contact,
            'nationality' => $nationality,
            'isNonMemberTab' => $isNonMemberTab,
            'wantsMembership' => $wantsMembership,
            'memberId' => $memberId,
            'eventId' => $eventId,
            'eventTitle' => $eventTitle,
        ];

        $result = KD_Event_API::submit_registration($postData);

        if (!empty($result['success'])) {
            wp_send_json_success([
                'message' => !empty($result['message']) ? $result['message'] : 'Registration successful!',
                'name' => $name,
                'contact' => $contact,
                'eventTitle' => $eventTitle,
            ]);
        } else {
            wp_send_json_error([
                'message' => !empty($result['error']) ? $result['error'] : 'Registration could not be completed. Please try again.',
            ]);
        }
    }
}

function kd_event_showcase() {
    return KD_Event_Showcase::instance();
}

kd_event_showcase();
