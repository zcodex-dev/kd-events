<?php
/**
 * Template for Full-Page Canvas Membership Enrollment
 */
if (!defined('ABSPATH')) {
    exit;
}

$postId = get_the_ID();
$customBg = get_post_meta($postId, '_kd_enrollment_bg', true);
?>
<!DOCTYPE html>
<html <?php language_attributes(); ?> style="background-color: #F4F4F5;">
<head>
    <meta charset="<?php bloginfo('charset'); ?>">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Membership Enrollment — Kompong Dewa Resort</title>
    <?php wp_head(); ?>
    <style>
        html, body {
            margin: 0 !important;
            padding: 0 !important;
            background-color: #F4F4F5 !important;
            color: #171717 !important;
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
<body <?php body_class('kd-canvas-body kd-enrollment-canvas-body'); ?>>
<?php wp_body_open(); ?>

<?php
echo KD_Event_Renderer::render_enrollment('canvas', $customBg);
?>

<?php wp_footer(); ?>
</body>
</html>
