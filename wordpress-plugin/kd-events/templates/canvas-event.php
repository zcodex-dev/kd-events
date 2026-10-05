<?php
/**
 * Template for Full-Page Canvas Event Showcase
 */
if (!defined('ABSPATH')) {
    exit;
}

$postId = get_the_ID();
$eventId = get_post_meta($postId, '_kd_event_id', true);
$event = !empty($eventId) ? KD_Event_API::get_event_by_id_or_slug($eventId) : null;
?>
<!DOCTYPE html>
<html <?php language_attributes(); ?> style="background-color: #101010; color-scheme: dark;">
<head>
    <meta charset="<?php bloginfo('charset'); ?>">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?php echo esc_html($event['title'] ?? get_the_title()); ?> — Kompong Dewa Resort</title>
    <?php wp_head(); ?>
    <style>
        html, body {
            margin: 0 !important;
            padding: 0 !important;
            background-color: #101010 !important;
            color: #f3f3f3 !important;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif !important;
            overflow-x: hidden;
            width: 100%;
        }
        #wpadminbar {
            opacity: 0.85;
            transition: opacity 0.2s;
        }
        #wpadminbar:hover {
            opacity: 1;
        }
    </style>
</head>
<body <?php body_class('kd-canvas-body'); ?>>
<?php wp_body_open(); ?>

<?php
if ($event) {
    echo KD_Event_Renderer::render($event, 'canvas');
} else {
    echo '<div style="max-width: 800px; margin: 100px auto; padding: 40px; text-align: center; color: #fff; background: #181818; border: 1px solid rgba(255,255,255,0.1); border-radius: 16px;">
        <h2 style="color: #c3943a; margin-top: 0;">Event Not Found</h2>
        <p style="color: #999;">Please select a valid event in the Page settings in WordPress Admin.</p>
    </div>';
}
?>

<?php wp_footer(); ?>
</body>
</html>
