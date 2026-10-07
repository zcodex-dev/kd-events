<?php
if (!defined('ABSPATH')) {
    exit;
}

class KD_Event_Renderer {
    public static function get_media_url($url) {
        if (empty($url)) return '';
        $trimmed = trim($url);
        if (preg_match('/^https?:\/\//i', $trimmed)) {
            return $trimmed;
        }
        $baseHost = class_exists('KD_Event_API') ? KD_Event_API::get_api_host() : 'https://kompongdewa.win';
        if (strpos($trimmed, '/') === 0) {
            return $baseHost . $trimmed;
        }
        return $trimmed;
    }

    public static function normalize_html_urls($html) {
        if (empty($html)) return '';
        $baseHost = class_exists('KD_Event_API') ? KD_Event_API::get_api_host() : 'https://kompongdewa.win';

        // Convert relative src="..." or href="..." starting with / (excluding protocol-relative //)
        $html = preg_replace_callback('/\b(src|href)=(["\'])(\/(?!\/)[^"\']*)\2/i', function ($m) use ($baseHost) {
            return $m[1] . '=' . $m[2] . $baseHost . $m[3] . $m[2];
        }, $html);

        // Convert relative srcset="..."
        $html = preg_replace_callback('/\bsrcset=(["\'])(.*?)\1/i', function ($m) use ($baseHost) {
            $quote = $m[1];
            $sources = explode(',', $m[2]);
            $updated = array_map(function ($src) use ($baseHost) {
                $src = trim($src);
                if (strpos($src, '/') === 0 && strpos($src, '//') !== 0) {
                    return $baseHost . $src;
                }
                return $src;
            }, $sources);
            return 'srcset=' . $quote . implode(', ', $updated) . $quote;
        }, $html);

        return $html;
    }

    public static function is_video($url) {
        if (empty($url)) return false;
        $decoded = strtolower(urldecode($url));
        return strpos($decoded, '.mp4') !== false
            || strpos($decoded, '.webm') !== false
            || strpos($decoded, '.mov') !== false
            || strpos($decoded, '.m4v') !== false
            || strpos($decoded, '.ogg') !== false;
    }

    public static function wrap_tables($html) {
        if (empty($html)) return '';
        // Wrap table without closing tag on <table so attributes are preserved inside tag
        $html = preg_replace('/<table/i', '<div class="event-table-wrap not-prose"><table', $html);
        $html = preg_replace('/<\/table>/i', '</table></div>', $html);
        return $html;
    }

    public static function parse_prize_pool($html) {
        if (empty($html)) return ['prizeData' => null, 'remainingHtml' => ''];

        $cleanHtml = str_ireplace('&nbsp;', ' ', $html);

        // Check for prize indicators across EN, ID, ZH
        $hasPrize = (bool) preg_match('/(TOTAL\s+GUARANTEED\s+PRIZE|TOTAL\s+HADIAH|保证奖金|CHAMPION|JUARA\s*\d+|第\s*\d+\s*名|\d+\s*(?:st|nd|rd|th)?\s*Prize)/i', $cleanHtml);
        if (!$hasPrize) {
            return ['prizeData' => null, 'remainingHtml' => $html];
        }

        // 1. Section Title
        $sectionTitle = '';
        if (preg_match('/(Prize\s+Structure|Tournament\s+Structure|Struktur\s+Hadiah|赛事结构\s*\/\s*奖金结构|奖金结构|赛事结构)/i', $cleanHtml, $tm)) {
            $sectionTitle = trim(preg_replace('/\s+/', ' ', $tm[1]));
        }

        // 2. Total Guaranteed
        $totalGuaranteed = '';
        if (preg_match('/((?:TOTAL\s+)?GUARANTEED\s+(?:PRIZE|TO\s+WIN\s+BIG)[^<\n\r]*|TOTAL\s+HADIAH\s+SEBESAR[^<\n\r]*|保证奖金总额为[^<\n\r]*)/i', $cleanHtml, $gm)) {
            $totalGuaranteed = trim(preg_replace('/\s+/', ' ', strip_tags($gm[1])));
        } elseif (preg_match('/TOTAL\s+GUARANTEED\s+PRIZE\s*(?:OF)?\s*([A-Z0-9\$,\.\s]+?)(?:<\/|<br|\n|$)/i', $cleanHtml, $gm)) {
            $totalGuaranteed = 'TOTAL GUARANTEED PRIZE OF ' . trim(strip_tags($gm[1]));
        }

        // 3. Extract prize items strictly from Prize Section
        $prizeSectionRegex = '/(?:Prize\s+Structure|Struktur\s+Hadiah|赛事结构\s*\/\s*奖金结构|奖金结构|TOTAL\s+GUARANTEED)[\s\S]*?(?=(?:Tournament\s+Structure|Struktur\s+Turnamen|赛事结构|Betting\s+Limits|Rules|Terms|Syarat|<table)|$)/i';
        $targetHtml = preg_match($prizeSectionRegex, $html, $sm) ? $sm[0] : $html;

        $prizes = [];
        $prizeRegex = '/(CHAMPION|WINNER|RUNNER[\s-]*UP|JUARA\s*\d+|第\s*\d+\s*名(?:奖金)?|\d+\s*(?:st|nd|rd|th)\s*(?:Prize|Place)?|\d+\s*(?:Prize|Place))\s*[:：\-–]\s*((?:USD|\$)?\s*[0-9,]+(?:\.[0-9]{2})?(?!\s*(?:AM|PM|am|pm))\b)/i';

        $blocks = preg_split('/<\/li>|<\/tr>|<\/p>|<br\s*\/?>/i', $targetHtml);
        foreach ($blocks as $block) {
            $text = trim(preg_replace('/\s+/', ' ', strip_tags(str_ireplace('&nbsp;', ' ', $block))));
            if (empty($text)) continue;

            if (preg_match($prizeRegex, $text, $m)) {
                $rawRank = trim(preg_replace('/\s+/', ' ', $m[1]));
                $rawAmount = trim(str_replace(' ', '', $m[2]));
                if (strpos($rawAmount, '$') !== 0 && stripos($rawAmount, 'USD') !== 0 && is_numeric(substr($rawAmount, 0, 1))) {
                    $rawAmount = '$' . $rawAmount;
                }

                $placeNumber = 99;
                if (preg_match('/CHAMPION|WINNER|JUARA\s*1|第\s*1\s*名|1st/i', $rawRank)) {
                    $placeNumber = 1;
                } elseif (preg_match('/2nd|RUNNER[\s-]*UP|JUARA\s*2|第\s*2\s*名/i', $rawRank)) {
                    $placeNumber = 2;
                } elseif (preg_match('/3rd|JUARA\s*3|第\s*3\s*名/i', $rawRank)) {
                    $placeNumber = 3;
                } elseif (preg_match('/\d+/', $rawRank, $nm)) {
                    $placeNumber = (int) $nm[0];
                }

                $prizes[] = [
                    'rank' => $rawRank,
                    'amount' => $rawAmount,
                    'placeNumber' => $placeNumber,
                ];
            }
        }

        if (empty($prizes)) {
            return ['prizeData' => null, 'remainingHtml' => $html];
        }

        // 4. Cleanly remove the extracted prize block from remaining html without breaking HTML tags
        $remainingHtml = $html;
        $patterns = [
            // English patterns
            '/<p[^>]*>[\s\S]*?(?:Prize|Tournament)\s+Structure[\s\S]*?<\/p>\s*(?=<p[^>]*>[\s\S]*?TOTAL\s+GUARANTEED)/i',
            '/<p[^>]*>[\s\S]*?TOTAL\s+GUARANTEED[\s\S]*?<\/p>/i',
            '/<ul[^>]*>[\s\S]*?CHAMPION[\s\S]*?<\/ul>/i',
            '/<p[^>]*>[\s\S]*?(?:CHAMPION|2nd\s*Prize|3rd\s*Prize|\d+th\s*Prize)[\s\S]*?<\/p>/i',
            '/<p[^>]*>[\s\S]*?Full\s+payout\s+ladder[\s\S]*?<\/p>/i',
            '/Full\s+payout\s+ladder[\s\S]*?rewards\.?/i',
            // Indonesian patterns
            '/<p[^>]*>[\s\S]*?Struktur\s+Hadiah[\s\S]*?<\/p>\s*(?=<p[^>]*>[\s\S]*?TOTAL\s+HADIAH)/i',
            '/<p[^>]*>[\s\S]*?TOTAL\s+HADIAH[\s\S]*?<\/p>/i',
            '/<ul[^>]*>[\s\S]*?Juara\s*1[\s\S]*?<\/ul>/i',
            '/<p[^>]*>[\s\S]*?Juara\s*\d+[\s\S]*?<\/p>/i',
            '/<p[^>]*>[\s\S]*?Rincian\s+pembayaran\s+hadiah[\s\S]*?<\/p>/i',
            '/Rincian\s+pembayaran\s+hadiah[\s\S]*?total\s+hadiah\.?/i',
            // Chinese patterns
            '/<p[^>]*>[\s\S]*?赛事结构\s*\/\s*奖金结构[\s\S]*?<\/p>/i',
            '/<p[^>]*>[\s\S]*?保证奖金总额[\s\S]*?<\/p>/i',
            '/<ul[^>]*>[\s\S]*?第1名奖金[\s\S]*?<\/ul>/i',
            '/<p[^>]*>[\s\S]*?第\s*\d+\s*名[\s\S]*?<\/p>/i',
            '/<p[^>]*>[\s\S]*?完整奖金分配表[\s\S]*?<\/p>/i',
            '/完整奖金分配表[\s\S]*?越丰厚[。.]?/i',
        ];
        $remainingHtml = preg_replace($patterns, '', $remainingHtml);

        return [
            'prizeData' => [
                'sectionTitle' => $sectionTitle ?: 'Prize Structure',
                'totalGuaranteed' => $totalGuaranteed ?: 'Guaranteed Cash Prizes',
                'prizes' => $prizes,
            ],
            'remainingHtml' => $remainingHtml,
        ];
    }

    public static function render($event, $layoutMode = 'canvas') {
        if (empty($event) || !is_array($event)) {
            return '<div class="kd-error-notice">Event not found.</div>';
        }

        wp_enqueue_style('kd-event-showcase');
        wp_enqueue_script('kd-event-showcase');

        // Resolve default language
        $defaultLang = !empty($event['defaultLang']) && in_array($event['defaultLang'], ['en', 'id', 'zh'], true)
            ? $event['defaultLang']
            : 'en';

        // Normalize relative URLs in HTML descriptions (e.g. /api/raw?key=...) to absolute host URLs
        $descEn = self::normalize_html_urls($event['description'] ?? '');
        $descId = self::normalize_html_urls(!empty($event['descriptionId']) ? $event['descriptionId'] : ($event['description'] ?? ''));
        $descZh = self::normalize_html_urls(!empty($event['descriptionZh']) ? $event['descriptionZh'] : ($event['description'] ?? ''));

        // Parse Prize Pool & Remaining HTML per language
        $parsedEn = self::parse_prize_pool($descEn);
        $parsedId = self::parse_prize_pool($descId);
        $parsedZh = self::parse_prize_pool($descZh);

        // Prepare translation payload for dynamic client-side language switching
        $translations = [
            'en' => [
                'title' => $event['title'] ?? '',
                'date' => $event['date'] ?? '',
                'location' => $event['location'] ?? '',
                'concept' => $event['concept'] ?? '',
                'description' => self::wrap_tables($parsedEn['remainingHtml']),
            ],
            'id' => [
                'title' => !empty($event['titleId']) ? $event['titleId'] : ($event['title'] ?? ''),
                'date' => !empty($event['dateId']) ? $event['dateId'] : ($event['date'] ?? ''),
                'location' => !empty($event['locationId']) ? $event['locationId'] : ($event['location'] ?? ''),
                'concept' => !empty($event['conceptId']) ? $event['conceptId'] : ($event['concept'] ?? ''),
                'description' => self::wrap_tables($parsedId['remainingHtml']),
            ],
            'zh' => [
                'title' => !empty($event['titleZh']) ? $event['titleZh'] : ($event['title'] ?? ''),
                'date' => !empty($event['dateZh']) ? $event['dateZh'] : ($event['date'] ?? ''),
                'location' => !empty($event['locationZh']) ? $event['locationZh'] : ($event['location'] ?? ''),
                'concept' => !empty($event['conceptZh']) ? $event['conceptZh'] : ($event['concept'] ?? ''),
                'description' => self::wrap_tables($parsedZh['remainingHtml']),
            ],
        ];

        // Active fields for initial server render
        $activeTitle = $translations[$defaultLang]['title'];
        $activeDate = $translations[$defaultLang]['date'];
        $activeLocation = $translations[$defaultLang]['location'];
        $activeConcept = $translations[$defaultLang]['concept'];
        $remainingHtml = $translations[$defaultLang]['description'];
        $prizeData = $defaultLang === 'id' ? $parsedId['prizeData'] : ($defaultLang === 'zh' ? $parsedZh['prizeData'] : $parsedEn['prizeData']);

        // Media resolution with full video URL decoding
        $images = !empty($event['images']) && is_array($event['images']) ? $event['images'] : (!empty($event['imageUrl']) ? [$event['imageUrl']] : []);
        $primaryMedia = !empty($images[0]) ? $images[0] : '';
        $mediaSrc = self::get_media_url($primaryMedia);
        $isVideo = self::is_video($mediaSrc);

        $flags = [
            'en' => ['label' => 'English', 'flag' => 'https://flagcdn.com/w40/us.png'],
            'id' => ['label' => 'Bahasa', 'flag' => 'https://flagcdn.com/w40/id.png'],
            'zh' => ['label' => 'Chinese', 'flag' => 'https://flagcdn.com/w40/cn.png'],
        ];

        $initialFlag = $flags[$defaultLang]['flag'];
        $initialLabel = $flags[$defaultLang]['label'];

        $isUpcoming = !empty($event['status']) && stripos($event['status'], 'UPCOMING') !== false;
        $startAt = !empty($event['startAt']) ? esc_attr($event['startAt']) : '';
        $endAt = !empty($event['endAt']) ? esc_attr($event['endAt']) : '';

        // Trophies URLs: 1st Gold, 2nd Silver (3.svg), 3rd Bronze (2.svg)
        $trophy1 = KD_EVENTS_URL . 'assets/trophy/1st.svg';
        $trophy2 = KD_EVENTS_URL . 'assets/trophy/3.svg';
        $trophy3 = KD_EVENTS_URL . 'assets/trophy/2.svg';

        ob_start();
        ?>
        <div
            class="kd-showcase-container <?php echo $layoutMode === 'canvas' ? 'kd-mode-canvas' : 'kd-mode-content'; ?>"
            data-kd-event-id="<?php echo esc_attr($event['id']); ?>"
            data-default-lang="<?php echo esc_attr($defaultLang); ?>"
            data-translations="<?php echo esc_attr(wp_json_encode($translations)); ?>"
        >
            <!-- Top Utility Bar: Breadcrumb Navigation & Flag Language Switcher -->
            <div class="kd-utility-bar">
                <a href="<?php echo esc_url(home_url('/events')); ?>" class="kd-breadcrumb-link">
                    <svg class="kd-breadcrumb-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <line x1="19" y1="12" x2="5" y2="12"></line>
                        <polyline points="12 19 5 12 12 5"></polyline>
                    </svg>
                    <span>Back to All Events</span>
                </a>

                <!-- Flag Language Dropdown (Free Placement in Utility Bar) -->
                <div class="kd-lang-dropdown-wrapper">
                    <button
                        type="button"
                        class="kd-lang-trigger"
                        aria-expanded="false"
                        aria-haspopup="listbox"
                    >
                        <img src="<?php echo esc_url($initialFlag); ?>" alt="<?php echo esc_attr($initialLabel); ?>" class="kd-lang-flag-current" />
                        <span class="kd-lang-label-current"><?php echo esc_html($initialLabel); ?></span>
                        <svg class="kd-chevron-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <polyline points="6 9 12 15 18 9"></polyline>
                        </svg>
                    </button>

                    <div class="kd-lang-menu" role="listbox">
                        <?php foreach ($flags as $code => $info): ?>
                            <button
                                type="button"
                                class="kd-lang-option <?php echo $code === $defaultLang ? 'kd-active' : ''; ?>"
                                data-lang-code="<?php echo esc_attr($code); ?>"
                                role="option"
                                aria-selected="<?php echo $code === $defaultLang ? 'true' : 'false'; ?>"
                            >
                                <div class="kd-lang-opt-left">
                                    <img src="<?php echo esc_url($info['flag']); ?>" alt="<?php echo esc_attr($info['label']); ?>" class="kd-lang-opt-flag" />
                                    <span><?php echo esc_html($info['label']); ?></span>
                                </div>
                                <span class="kd-lang-dot"></span>
                            </button>
                        <?php endforeach; ?>
                    </div>
                </div>
            </div>

            <!-- Hero Media Banner with Deep Luxury Blends -->
            <div class="kd-hero-section">
                <div class="kd-hero-media-wrap">
                    <?php if ($isVideo): ?>
                        <video
                            src="<?php echo esc_url($mediaSrc); ?>"
                            autoplay
                            loop
                            muted
                            playsinline
                            preload="auto"
                            class="kd-hero-media kd-hero-video"
                        ></video>
                    <?php else: ?>
                        <img
                            src="<?php echo esc_url(!empty($mediaSrc) ? $mediaSrc : 'https://kompongdewa.win/kd-picture.webp'); ?>"
                            alt="<?php echo esc_attr($activeTitle); ?>"
                            class="kd-hero-media kd-hero-img"
                        />
                    <?php endif; ?>
 
                    <!-- Mobile subtle blend & Desktop deep gradients -->
                    <div class="kd-hero-fade-bottom-mobile"></div>
                    <div class="kd-hero-fade-bottom-desktop"></div>
                    <div class="kd-hero-fade-left"></div>
                    <div class="kd-hero-fade-right"></div>
                    <div class="kd-hero-fade-top"></div>
                </div>
            </div>

            <!-- Content Container -->
            <div class="kd-content-body">
                <!-- Title & Countdown Bar -->
                <div class="kd-title-bar">
                    <div class="kd-title-meta">
                        <h1 class="kd-event-title"><?php echo esc_html($activeTitle); ?></h1>

                        <div class="kd-meta-chips">
                            <?php if (!empty($activeDate)): ?>
                                <div class="kd-chip kd-chip-date">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                                        <line x1="16" y1="2" x2="16" y2="6"></line>
                                        <line x1="8" y1="2" x2="8" y2="6"></line>
                                        <line x1="3" y1="10" x2="21" y2="10"></line>
                                    </svg>
                                    <span class="kd-date-val"><?php echo esc_html($activeDate); ?></span>
                                </div>
                            <?php endif; ?>

                            <?php if (!empty($activeLocation)): ?>
                                <div class="kd-chip kd-chip-location">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                                        <circle cx="12" cy="10" r="3"></circle>
                                    </svg>
                                    <span class="kd-location-val"><?php echo esc_html($activeLocation); ?></span>
                                </div>
                            <?php endif; ?>
                        </div>
                    </div>

                    <?php if ($isUpcoming): ?>
                        <div
                            class="kd-countdown-box"
                            data-start-at="<?php echo $startAt; ?>"
                            data-end-at="<?php echo $endAt; ?>"
                            data-date-str="<?php echo esc_attr($activeDate); ?>"
                        >
                            <p class="kd-countdown-label">Starts in</p>
                            <div class="kd-countdown-grid">
                                <div class="kd-time-unit">
                                    <span class="kd-unit-val kd-days">00</span>
                                    <span class="kd-unit-name">Days</span>
                                </div>
                                <div class="kd-time-unit">
                                    <span class="kd-unit-val kd-hours">00</span>
                                    <span class="kd-unit-name">Hours</span>
                                </div>
                                <div class="kd-time-unit">
                                    <span class="kd-unit-val kd-minutes">00</span>
                                    <span class="kd-unit-name">Min</span>
                                </div>
                                <div class="kd-time-unit">
                                    <span class="kd-unit-val kd-seconds">00</span>
                                    <span class="kd-unit-name">Sec</span>
                                </div>
                            </div>
                        </div>
                    <?php endif; ?>
                </div>

                <!-- Event Concept / Highlight Card -->
                <?php if (!empty($activeConcept)): ?>
                    <div class="kd-concept-card">
                        <span class="kd-concept-badge">Event Concept</span>
                        <p class="kd-concept-val"><?php echo esc_html($activeConcept); ?></p>
                    </div>
                <?php endif; ?>

                <!-- Dedicated Prize Pool Showcase (Champion Podium & Ladder) -->
                <?php if (!empty($prizeData) && !empty($prizeData['prizes'])): ?>
                    <?php
                    $prizes = $prizeData['prizes'];
                    $champion = null;
                    $second = null;
                    $third = null;
                    $others = [];

                    foreach ($prizes as $p) {
                        if ($p['placeNumber'] === 1 && !$champion) {
                            $champion = $p;
                        } elseif ($p['placeNumber'] === 2 && !$second) {
                            $second = $p;
                        } elseif ($p['placeNumber'] === 3 && !$third) {
                            $third = $p;
                        } else {
                            $others[] = $p;
                        }
                    }
                    ?>
                    <div class="kd-prize-showcase">
                        <div class="kd-prize-header">
                            <?php if (!empty($prizeData['sectionTitle'])): ?>
                                <p class="kd-prize-section-title"><?php echo esc_html($prizeData['sectionTitle']); ?></p>
                            <?php endif; ?>
                            <h3 class="kd-prize-guaranteed"><?php echo esc_html($prizeData['totalGuaranteed']); ?></h3>
                        </div>

                        <div class="kd-prize-body">
                            <!-- 3-Column Podium Tier -->
                            <div class="kd-podium-grid">
                                <!-- 2nd Place -->
                                <?php if ($second): ?>
                                    <div class="kd-podium-card kd-podium-2nd">
                                        <div class="kd-trophy-wrap">
                                            <img
                                                src="<?php echo esc_url($trophy2); ?>"
                                                alt="<?php echo esc_attr($second['rank']); ?>"
                                                class="kd-trophy-img"
                                                width="64"
                                                height="64"
                                            />
                                            <div class="kd-trophy-sweep-mask" style="-webkit-mask-image: url('<?php echo esc_url($trophy2); ?>'); mask-image: url('<?php echo esc_url($trophy2); ?>');">
                                                <div class="kd-trophy-sweep-bar" style="animation-delay: 0s;"></div>
                                            </div>
                                        </div>
                                        <div class="kd-podium-rank"><?php echo esc_html($second['rank']); ?></div>
                                        <div class="kd-podium-amount"><?php echo esc_html($second['amount']); ?></div>
                                    </div>
                                <?php endif; ?>

                                <!-- 1st Place Champion (Golden Animated Border Wrapper, Strictly NO Glow) -->
                                <?php if ($champion): ?>
                                    <div class="kd-podium-1st-wrap animate-gold-border">
                                        <!-- Stepped bracket connector left to 2nd Prize -->
                                        <div class="kd-bracket-step kd-bracket-step-left">
                                            <svg viewBox="0 0 100 100" fill="none" preserveAspectRatio="none">
                                                <path d="M 103 10 H 50 V 90 H -3" stroke="#c3943a" stroke-width="1.5" vector-effect="non-scaling-stroke" stroke-linecap="round" stroke-linejoin="round" class="kd-draw-path" />
                                            </svg>
                                        </div>
                                        <!-- Stepped bracket connector right to 3rd Prize -->
                                        <div class="kd-bracket-step kd-bracket-step-right">
                                            <svg viewBox="0 0 100 100" fill="none" preserveAspectRatio="none">
                                                <path d="M -3 10 H 50 V 90 H 103" stroke="#c3943a" stroke-width="1.5" vector-effect="non-scaling-stroke" stroke-linecap="round" stroke-linejoin="round" class="kd-draw-path" />
                                            </svg>
                                        </div>

                                        <div class="kd-podium-card kd-podium-1st">
                                            <div class="kd-trophy-wrap">
                                                <img
                                                    src="<?php echo esc_url($trophy1); ?>"
                                                    alt="<?php echo esc_attr($champion['rank']); ?>"
                                                    class="kd-trophy-img kd-trophy-1st"
                                                    width="90"
                                                    height="90"
                                                />
                                                <div class="kd-trophy-sweep-mask" style="-webkit-mask-image: url('<?php echo esc_url($trophy1); ?>'); mask-image: url('<?php echo esc_url($trophy1); ?>');">
                                                    <div class="kd-trophy-sweep-bar" style="animation-delay: 0.25s;"></div>
                                                </div>
                                            </div>
                                            <div class="kd-podium-rank kd-rank-1st"><?php echo esc_html($champion['rank']); ?></div>
                                            <div class="kd-podium-amount kd-amount-1st animate-gold-shine"><?php echo esc_html($champion['amount']); ?></div>
                                        </div>
                                    </div>
                                <?php endif; ?>

                                <!-- 3rd Place -->
                                <?php if ($third): ?>
                                    <div class="kd-podium-card kd-podium-3rd">
                                        <div class="kd-trophy-wrap">
                                            <img
                                                src="<?php echo esc_url($trophy3); ?>"
                                                alt="<?php echo esc_attr($third['rank']); ?>"
                                                class="kd-trophy-img"
                                                width="64"
                                                height="64"
                                            />
                                            <div class="kd-trophy-sweep-mask" style="-webkit-mask-image: url('<?php echo esc_url($trophy3); ?>'); mask-image: url('<?php echo esc_url($trophy3); ?>');">
                                                <div class="kd-trophy-sweep-bar" style="animation-delay: 0.5s;"></div>
                                            </div>
                                        </div>
                                        <div class="kd-podium-rank"><?php echo esc_html($third['rank']); ?></div>
                                        <div class="kd-podium-amount"><?php echo esc_html($third['amount']); ?></div>
                                    </div>
                                <?php endif; ?>
                            </div>

                            <!-- Tournament Tree Bracket Connector into 4th-8th Ladder -->
                            <?php if (!empty($others)): ?>
                                <?php
                                $othersCount = count($others);
                                $colCenters = [];
                                for ($i = 0; $i < $othersCount; $i++) {
                                    $colCenters[] = (($i + 0.5) / $othersCount) * 1000;
                                }
                                $minX = !empty($colCenters) ? $colCenters[0] : 100;
                                $maxX = !empty($colCenters) ? $colCenters[$othersCount - 1] : 900;
                                $centerX = 500;
                                $leftBarLength = max(10, round($centerX - $minX));
                                $rightBarLength = max(10, round($maxX - $centerX));
                                ?>
                                <div class="kd-bracket-tree">
                                    <svg viewBox="0 0 1000 64" preserveAspectRatio="none" fill="none">
                                        <!-- Center stem down to y=32 -->
                                        <line class="kd-tree-stem" x1="500" y1="-4" x2="500" y2="32" stroke="#c3943a" stroke-width="1.5" vector-effect="non-scaling-stroke" stroke-linecap="round" stroke-dasharray="36" stroke-dashoffset="36" />
                                        <!-- Left horizontal bar -->
                                        <line class="kd-tree-bar-left" x1="500" y1="32" x2="<?php echo $minX; ?>" y2="32" stroke="#c3943a" stroke-width="1.5" vector-effect="non-scaling-stroke" stroke-linecap="round" stroke-dasharray="<?php echo $leftBarLength; ?>" stroke-dashoffset="<?php echo $leftBarLength; ?>" />
                                        <!-- Right horizontal bar -->
                                        <line class="kd-tree-bar-right" x1="500" y1="32" x2="<?php echo $maxX; ?>" y2="32" stroke="#c3943a" stroke-width="1.5" vector-effect="non-scaling-stroke" stroke-linecap="round" stroke-dasharray="<?php echo $rightBarLength; ?>" stroke-dashoffset="<?php echo $rightBarLength; ?>" />
                                        <!-- Drop stems to each card -->
                                        <?php foreach ($colCenters as $idx => $x): ?>
                                            <line class="kd-tree-drop" x1="<?php echo $x; ?>" y1="32" x2="<?php echo $x; ?>" y2="68" stroke="#c3943a" stroke-width="1.5" vector-effect="non-scaling-stroke" stroke-linecap="round" stroke-dasharray="36" stroke-dashoffset="36" />
                                        <?php endforeach; ?>
                                        <!-- Center junction dot -->
                                        <circle class="kd-tree-dot kd-tree-dot-center" cx="500" cy="32" r="2.5" fill="#e5ac53" />
                                        <!-- Column junction dots -->
                                        <?php foreach ($colCenters as $idx => $x):
                                            $distFromCenter = abs($x - 500);
                                            $dotDelay = 1950 + round(($distFromCenter / 400) * 380);
                                        ?>
                                            <circle class="kd-tree-dot" style="--kd-dot-delay: <?php echo $dotDelay; ?>ms;" cx="<?php echo $x; ?>" cy="32" r="2.5" fill="#e5ac53" />
                                        <?php endforeach; ?>
                                    </svg>
                                </div>

                                <!-- 4th-8th Ladder Grid -->
                                <div class="kd-ladder-grid">
                                    <?php foreach ($others as $idx => $item):
                                        $cardDelay = 650 + $idx * 120;
                                    ?>
                                        <div class="kd-ladder-card" style="transition-delay: <?php echo $cardDelay; ?>ms;">
                                            <span class="kd-ladder-rank"><?php echo esc_html($item['rank']); ?></span>
                                            <span class="kd-ladder-amount"><?php echo esc_html($item['amount']); ?></span>
                                        </div>
                                    <?php endforeach; ?>
                                </div>
                            <?php endif; ?>
                        </div>
                    </div>
                <?php endif; ?>

                <!-- Event Description & Tournament Tables -->
                <?php if (!empty($remainingHtml)): ?>
                    <div class="kd-rich-description">
                        <?php echo $remainingHtml; ?>
                    </div>
                <?php endif; ?>

                <!-- Event Gallery -->
                <?php if (count($images) > 1): ?>
                    <div class="kd-gallery-section">
                        <h3 class="kd-section-heading">Event Gallery</h3>
                        <div class="kd-gallery-grid">
                            <?php foreach ($images as $img): ?>
                                <div class="kd-gallery-item">
                                    <img src="<?php echo esc_url(self::get_media_url($img)); ?>" alt="Gallery item" loading="lazy" />
                                </div>
                            <?php endforeach; ?>
                        </div>
                    </div>
                <?php endif; ?>

                <!-- Register CTA Banner -->
                <div class="kd-cta-card">
                    <div class="kd-cta-left">
                        <h3 class="kd-cta-title">Ready to Participate?</h3>
                        <p class="kd-cta-desc">Registration is open for active members. Non-members can pre-register online or visit the VIP services desk on arrival.</p>
                    </div>
                    <?php
                    $eventId = !empty($event['id']) ? $event['id'] : '';
                    ?>
                    <button
                        type="button"
                        class="kd-cta-button kd-open-register-modal"
                        data-event-id="<?php echo esc_attr($eventId); ?>"
                        data-event-title="<?php echo esc_attr($activeTitle); ?>"
                    >
                        <span>Register Now</span>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                            <polyline points="15 3 21 3 21 9"></polyline>
                            <line x1="10" y1="14" x2="21" y2="3"></line>
                        </svg>
                    </button>
                </div>
            </div>

            <!-- Original Design Registration Lightbox Modal -->
            <div class="kd-modal-backdrop" aria-hidden="true" role="dialog" aria-modal="true">
                <div class="kd-orig-modal-dialog">
                    <!-- Modal Header -->
                    <div class="kd-orig-modal-header">
                        <div class="kd-orig-title-group">
                            <h2 class="kd-orig-modal-title">Event Registration</h2>
                            <div class="kd-orig-event-subtitle"><?php echo esc_html($activeTitle); ?></div>
                        </div>
                        <button type="button" class="kd-orig-modal-close" aria-label="Close modal">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                        </button>
                    </div>

                    <!-- Modal Body / Form -->
                    <div class="kd-orig-modal-body">
                        <form class="kd-orig-form">
                            <input type="hidden" name="eventId" value="<?php echo esc_attr($eventId); ?>" />
                            <input type="hidden" name="eventTitle" value="<?php echo esc_attr($activeTitle); ?>" />
                            <input type="hidden" name="contact" class="kd-orig-final-contact" value="" />
                            <input type="hidden" name="isNonMemberTab" class="kd-orig-is-non-member" value="true" />

                            <div class="kd-orig-alert-error" style="display: none;"></div>

                            <!-- Full Name -->
                            <div class="kd-orig-field">
                                <label class="kd-orig-label" for="kd_orig_name">
                                    Full Name <span class="kd-orig-req">*</span>
                                </label>
                                <input
                                    type="text"
                                    id="kd_orig_name"
                                    name="name"
                                    class="kd-orig-input"
                                    placeholder="Enter your full name"
                                    required
                                />
                            </div>

                            <!-- Phone / Email Switcher & Input -->
                            <div class="kd-orig-field">
                                <div class="kd-orig-contact-header">
                                    <label class="kd-orig-label kd-orig-contact-label" for="kd_orig_phone">
                                        Phone Number <span class="kd-orig-req">*</span>
                                    </label>
                                    <div class="kd-orig-toggle-pill">
                                        <button type="button" class="kd-orig-pill-btn kd-active" data-mode="phone">
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                                            </svg>
                                            <span>Phone</span>
                                        </button>
                                        <button type="button" class="kd-orig-pill-btn" data-mode="email">
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                                <rect width="20" height="16" x="2" y="4" rx="2"></rect>
                                                <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path>
                                            </svg>
                                            <span>Email</span>
                                        </button>
                                    </div>
                                </div>

                                <!-- Phone Mode Input -->
                                <div class="kd-orig-phone-container">
                                    <div class="kd-orig-country-trigger-wrap">
                                        <button type="button" class="kd-orig-country-trigger" aria-label="Select Country Code">
                                            <img
                                                src="https://flagcdn.com/w40/kh.png"
                                                alt="Cambodia"
                                                class="kd-orig-flag-img"
                                            />
                                            <span class="kd-orig-dial-code">+855</span>
                                            <svg class="kd-orig-chevron" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                                <polyline points="6 9 12 15 18 9"></polyline>
                                            </svg>
                                        </button>

                                        <!-- Country Popover -->
                                        <div class="kd-orig-country-popover" style="display: none;">
                                            <div class="kd-orig-popover-search">
                                                <svg class="kd-orig-search-icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                                    <circle cx="11" cy="11" r="8"></circle>
                                                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                                                </svg>
                                                <input type="text" class="kd-orig-search-input" placeholder="Search country or code..." />
                                            </div>
                                            <div class="kd-orig-country-list"></div>
                                        </div>
                                    </div>

                                    <input
                                        type="tel"
                                        id="kd_orig_phone"
                                        class="kd-orig-number-input"
                                        placeholder="812 3456 7890"
                                    />
                                </div>

                                <!-- Email Mode Input (Hidden initially) -->
                                <div class="kd-orig-email-container" style="display: none;">
                                    <input
                                        type="email"
                                        id="kd_orig_email"
                                        class="kd-orig-input"
                                        placeholder="Enter your email address"
                                    />
                                    <div class="kd-orig-field" style="margin-top: 0.75rem;">
                                        <label class="kd-orig-label" for="kd_orig_nationality">
                                            Nationality <span class="kd-orig-req">*</span>
                                        </label>
                                        <select id="kd_orig_nationality" name="nationality" class="kd-orig-select">
                                            <option value="">Select nationality...</option>
                                            <option value="Cambodia">Cambodia</option>
                                            <option value="China">China</option>
                                            <option value="Indonesia">Indonesia</option>
                                            <option value="Malaysia">Malaysia</option>
                                            <option value="Singapore">Singapore</option>
                                            <option value="Thailand">Thailand</option>
                                            <option value="Vietnam">Vietnam</option>
                                            <option value="Taiwan">Taiwan</option>
                                            <option value="South Korea">South Korea</option>
                                            <option value="Other">Other / International</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <!-- Membership Status -->
                            <div class="kd-orig-field">
                                <label class="kd-orig-label">Membership Status</label>
                                <div class="kd-orig-status-group">
                                    <!-- Member Checkbox -->
                                    <div class="kd-orig-check-row">
                                        <label class="kd-orig-checkbox-label">
                                            <input
                                                type="checkbox"
                                                class="kd-orig-status-checkbox"
                                                data-val="member"
                                                id="kd_orig_status_member"
                                            />
                                            <span class="kd-orig-custom-box"></span>
                                            <span class="kd-orig-check-text">Member</span>
                                        </label>
                                    </div>

                                    <!-- Member ID field (shown if Member selected) -->
                                    <div class="kd-orig-memberid-box" style="display: none;">
                                        <input
                                            type="text"
                                            name="memberId"
                                            id="kd_orig_member_id"
                                            class="kd-orig-input kd-orig-input-sm"
                                            placeholder="Enter Member ID (e.g. KD-8888)"
                                        />
                                    </div>

                                    <!-- Non-Member Checkbox -->
                                    <div class="kd-orig-check-row">
                                        <label class="kd-orig-checkbox-label">
                                            <input
                                                type="checkbox"
                                                class="kd-orig-status-checkbox"
                                                data-val="non-member"
                                                id="kd_orig_status_nonmember"
                                                checked
                                            />
                                            <span class="kd-orig-custom-box"></span>
                                            <span class="kd-orig-check-text">Non-Member</span>
                                        </label>
                                    </div>

                                    <!-- Membership Opt-in (shown if Non-Member selected) -->
                                    <div class="kd-orig-optin-box">
                                        <label class="kd-orig-subcheckbox-label">
                                            <input
                                                type="checkbox"
                                                name="wantsMembership"
                                                value="true"
                                                class="kd-orig-subcheckbox"
                                                checked
                                            />
                                            <span class="kd-orig-custom-box kd-orig-custom-box-sm"></span>
                                            <span class="kd-orig-subcheck-text">Apply for Kompong Dewa integrated resort membership</span>
                                        </label>
                                    </div>
                                </div>
                            </div>

                            <!-- Submit Registration Button -->
                            <div class="kd-orig-submit-wrap">
                                <button type="submit" class="kd-orig-submit-btn">
                                    <span class="kd-orig-submit-text">Submit Registration</span>
                                    <svg class="kd-orig-send-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                        <line x1="22" y1="2" x2="11" y2="13"></line>
                                        <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                                    </svg>
                                    <div class="kd-orig-spinner" style="display: none;"></div>
                                </button>
                            </div>
                        </form>

                        <!-- Success Screen -->
                        <div class="kd-orig-success" style="display: none;">
                            <div class="kd-orig-success-icon-wrap">
                                <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                                    <polyline points="22 4 12 14.01 9 11.01"></polyline>
                                </svg>
                            </div>
                            <h3 class="kd-orig-success-title">Registration Received!</h3>
                            <p class="kd-orig-success-desc">Thank you for registering. Your request has been recorded successfully.</p>

                            <div class="kd-orig-success-card">
                                <div class="kd-orig-summary-row">
                                    <span class="kd-orig-summary-key">Guest Name</span>
                                    <span class="kd-orig-summary-val kd-res-name">-</span>
                                </div>
                                <div class="kd-orig-summary-row">
                                    <span class="kd-orig-summary-key">Contact</span>
                                    <span class="kd-orig-summary-val kd-res-contact">-</span>
                                </div>
                                <div class="kd-orig-summary-row">
                                    <span class="kd-orig-summary-key">Event</span>
                                    <span class="kd-orig-summary-val kd-res-event"><?php echo esc_html($activeTitle); ?></span>
                                </div>
                                <div class="kd-orig-summary-row">
                                    <span class="kd-orig-summary-key">Status</span>
                                    <span class="kd-orig-summary-badge">Confirmed / VIP Desk</span>
                                </div>
                            </div>

                            <button type="button" class="kd-orig-done-btn">
                                <span>Done</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <?php
        return ob_get_clean();
    }
}
