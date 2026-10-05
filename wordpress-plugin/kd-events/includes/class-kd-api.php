<?php
if (!defined('ABSPATH')) {
    exit;
}

class KD_Event_API {
    private static $instance = null;
    const TRANSIENT_KEY = 'kd_events_cache_list';
    const DEFAULT_API_URL = 'https://kompongdewa.win/api/events';

    public static function instance() {
        if (is_null(self::$instance)) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    public static function get_api_url() {
        $url = get_option('kd_events_api_url', self::DEFAULT_API_URL);
        return !empty($url) ? esc_url_raw($url) : self::DEFAULT_API_URL;
    }

    public static function get_cache_duration() {
        $duration = (int) get_option('kd_events_cache_duration', 300);
        return $duration > 0 ? $duration : 300;
    }

    public static function fetch_events($force_refresh = false) {
        if (!$force_refresh) {
            $cached = get_transient(self::TRANSIENT_KEY);
            if ($cached !== false && is_array($cached)) {
                return $cached;
            }
        }

        $apiUrl = self::get_api_url();
        $response = wp_remote_get($apiUrl, [
            'timeout' => 10,
            'headers' => [
                'Accept' => 'application/json',
                'User-Agent' => 'KD-WordPress-Showcase/' . KD_EVENTS_VERSION,
            ],
            'sslverify' => true,
        ]);

        if (is_wp_error($response)) {
            error_log('KD Events API Error: ' . $response->get_error_message());
            return [];
        }

        $statusCode = wp_remote_retrieve_response_code($response);
        if ($statusCode !== 200) {
            error_log('KD Events API Non-200 Status: ' . $statusCode);
            return [];
        }

        $body = wp_remote_retrieve_body($response);
        $json = json_decode($body, true);

        if (!empty($json['success']) && !empty($json['data']) && is_array($json['data'])) {
            $events = array_values(array_filter($json['data'], function ($item) {
                return !empty($item['id']) && (!isset($item['status']) || strtoupper($item['status']) !== 'HIDDEN');
            }));

            set_transient(self::TRANSIENT_KEY, $events, self::get_cache_duration());
            return $events;
        }

        return [];
    }

    public static function get_event_by_id_or_slug($identifier) {
        $events = self::fetch_events();
        if (empty($events)) {
            return null;
        }

        $slug = sanitize_title($identifier);

        foreach ($events as $event) {
            if ($event['id'] === $identifier) {
                return $event;
            }

            $eventSlug = sanitize_title(preg_replace('/^kompong\s+dewa\s+/i', '', $event['title']));
            if ($eventSlug === $slug) {
                return $event;
            }

            $fullSlug = sanitize_title($event['title']);
            if ($fullSlug === $slug) {
                return $event;
            }
        }

        return null;
    }

    public static function flush_cache() {
        return delete_transient(self::TRANSIENT_KEY);
    }

    public static function submit_registration($postData) {
        $apiUrl = str_replace('/api/events', '/api/register', self::get_api_url());
        if (strpos($apiUrl, '/api/register') === false) {
            $apiUrl = 'https://kompongdewa.win/api/register';
        }

        $response = wp_remote_post($apiUrl, [
            'timeout' => 15,
            'headers' => [
                'Accept' => 'application/json',
                'User-Agent' => 'KD-WordPress-Showcase/' . KD_EVENTS_VERSION,
            ],
            'body' => $postData,
            'sslverify' => true,
        ]);

        if (is_wp_error($response)) {
            return ['success' => false, 'error' => $response->get_error_message()];
        }

        $body = wp_remote_retrieve_body($response);
        $json = json_decode($body, true);

        if (empty($json) || !is_array($json)) {
            return ['success' => false, 'error' => 'Registration server did not return a valid response.'];
        }

        return $json;
    }
}
