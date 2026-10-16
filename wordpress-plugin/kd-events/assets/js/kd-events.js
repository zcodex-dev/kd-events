/**
 * KD Event Showcase JavaScript
 * Handles Flag Language Dropdown, Instant Multi-Language Switching, Mobile Navigation Drawer, and Live Countdown Timer
 */

(function () {
    'use strict';

    function initKDEventShowcase() {
        var containers = document.querySelectorAll('.kd-showcase-container');
        containers.forEach(function (container) {
            setupLanguageDropdown(container);
            setupCountdownTimer(container);
            setupPrizePoolAnimations(container);
            setupRegisterModal(container);
            setupFlyerLightbox(container);
        });

        setupEnrollmentForms();
    }

    function setupPrizePoolAnimations(container) {
        var showcase = container.querySelector('.kd-prize-showcase');
        if (!showcase) return;

        if (!('IntersectionObserver' in window)) {
            showcase.classList.add('kd-visible');
            return;
        }

        var observer = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    showcase.classList.add('kd-visible');
                    observer.disconnect();
                }
            });
        }, { threshold: 0.1 });

        observer.observe(showcase);
    }

    function setupLanguageDropdown(container) {
        var trigger = container.querySelector('.kd-lang-trigger');
        var menu = container.querySelector('.kd-lang-menu');
        var currentFlag = container.querySelector('.kd-lang-flag-current');
        var currentLabel = container.querySelector('.kd-lang-label-current');
        var options = container.querySelectorAll('.kd-lang-option');

        if (!trigger || !menu) return;

        // Parse translation payload
        var translations = {};
        try {
            var raw = container.getAttribute('data-translations');
            if (raw) {
                translations = JSON.parse(raw);
            }
        } catch (e) {
            console.error('KD Events: Could not parse translations payload', e);
        }

        function toggleMenu(open) {
            var isCurrentlyOpen = menu.classList.contains('kd-open');
            var shouldOpen = typeof open === 'boolean' ? open : !isCurrentlyOpen;

            if (shouldOpen) {
                menu.classList.add('kd-open');
                trigger.setAttribute('aria-expanded', 'true');
            } else {
                menu.classList.remove('kd-open');
                trigger.setAttribute('aria-expanded', 'false');
            }
        }

        trigger.addEventListener('click', function (e) {
            e.stopPropagation();
            toggleMenu();
        });

        // Close on click outside
        document.addEventListener('click', function (e) {
            if (!container.contains(e.target)) {
                toggleMenu(false);
            }
        });

        // Close on Escape key
        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape' || e.key === 'Esc') {
                toggleMenu(false);
            }
        });

        // Option click -> switch language immediately
        options.forEach(function (opt) {
            opt.addEventListener('click', function (e) {
                e.stopPropagation();
                var langCode = this.getAttribute('data-lang-code');
                var optFlag = this.querySelector('.kd-lang-opt-flag');
                var optText = this.querySelector('span');

                if (optFlag && currentFlag) {
                    currentFlag.src = optFlag.src;
                    currentFlag.alt = optFlag.alt;
                }
                if (optText && currentLabel) {
                    currentLabel.textContent = optText.textContent;
                }

                // Update active state in menu
                options.forEach(function (o) {
                    o.classList.remove('kd-active');
                    o.setAttribute('aria-selected', 'false');
                });
                this.classList.add('kd-active');
                this.setAttribute('aria-selected', 'true');

                toggleMenu(false);

                // Update text content across page
                if (translations && translations[langCode]) {
                    applyTranslation(container, translations[langCode]);
                }
            });
        });
    }

    function applyTranslation(container, data) {
        if (!data) return;

        var titleEl = container.querySelector('.kd-event-title');
        if (titleEl && data.title) {
            titleEl.textContent = data.title;
        }

        var dateEl = container.querySelector('.kd-date-val');
        if (dateEl && data.date) {
            dateEl.textContent = data.date;
        }

        var locationEl = container.querySelector('.kd-location-val');
        if (locationEl && data.location) {
            locationEl.textContent = data.location;
        }

        var conceptEl = container.querySelector('.kd-concept-val');
        if (conceptEl && data.concept) {
            conceptEl.textContent = data.concept;
        }

        var descEl = container.querySelector('.kd-rich-description');
        if (descEl && data.description) {
            descEl.innerHTML = data.description;
            setupFlyerLightbox(container);
        }

        var modalTitleEl = container.querySelector('.kd-modal-title');
        if (modalTitleEl && data.title) {
            modalTitleEl.textContent = data.title;
        }
    }

    var COUNTRIES = [
        { country: 'Cambodia', code: 'kh', dialCode: '+855', nationality: 'Cambodian' },
        { country: 'Indonesia', code: 'id', dialCode: '+62', nationality: 'Indonesian' },
        { country: 'China', code: 'cn', dialCode: '+86', nationality: 'Chinese' },
        { country: 'Vietnam', code: 'vn', dialCode: '+84', nationality: 'Vietnamese' },
        { country: 'Thailand', code: 'th', dialCode: '+66', nationality: 'Thai' },
        { country: 'Malaysia', code: 'my', dialCode: '+60', nationality: 'Malaysian' },
        { country: 'Singapore', code: 'sg', dialCode: '+65', nationality: 'Singaporean' },
        { country: 'Philippines', code: 'ph', dialCode: '+63', nationality: 'Filipino' },
        { country: 'Myanmar', code: 'mm', dialCode: '+95', nationality: 'Burmese' },
        { country: 'Laos', code: 'la', dialCode: '+856', nationality: 'Laotian' },
        { country: 'Taiwan', code: 'tw', dialCode: '+886', nationality: 'Taiwanese' },
        { country: 'South Korea', code: 'kr', dialCode: '+82', nationality: 'South Korean' },
        { country: 'Japan', code: 'jp', dialCode: '+81', nationality: 'Japanese' },
        { country: 'India', code: 'in', dialCode: '+91', nationality: 'Indian' },
        { country: 'Hong Kong', code: 'hk', dialCode: '+852' },
        { country: 'Macau', code: 'mo', dialCode: '+853' },
        { country: 'United States', code: 'us', dialCode: '+1', nationality: 'American' },
        { country: 'Canada', code: 'ca', dialCode: '+1', nationality: 'Canadian' },
        { country: 'United Kingdom', code: 'gb', dialCode: '+44', nationality: 'British' },
        { country: 'Australia', code: 'au', dialCode: '+61', nationality: 'Australian' },
        { country: 'Germany', code: 'de', dialCode: '+49', nationality: 'German' },
        { country: 'France', code: 'fr', dialCode: '+33', nationality: 'French' },
        { country: 'Russia', code: 'ru', dialCode: '+7', nationality: 'Russian' }
    ];

    function setupRegisterModal(container) {
        var openBtn = container.querySelector('.kd-open-register-modal');
        var modal = container.querySelector('.kd-modal-backdrop');
        if (!openBtn || !modal) return;

        var closeBtn = modal.querySelector('.kd-orig-modal-close');
        var form = modal.querySelector('.kd-orig-form');
        var successView = modal.querySelector('.kd-orig-success');
        var doneBtn = modal.querySelector('.kd-orig-done-btn');
        var errorBox = modal.querySelector('.kd-orig-alert-error');
        var submitBtn = modal.querySelector('.kd-orig-submit-btn');
        var submitText = modal.querySelector('.kd-orig-submit-text');
        var sendIcon = modal.querySelector('.kd-orig-send-icon');
        var spinner = modal.querySelector('.kd-orig-spinner');

        // Contact mode
        var currentMode = 'phone'; // 'phone' or 'email'
        var pillBtns = modal.querySelectorAll('.kd-orig-pill-btn');
        var contactLabel = modal.querySelector('.kd-orig-contact-label');
        var phoneWrap = modal.querySelector('.kd-orig-phone-container');
        var emailWrap = modal.querySelector('.kd-orig-email-container');
        var phoneInput = modal.querySelector('#kd_orig_phone');
        var emailInput = modal.querySelector('#kd_orig_email');
        var finalContactInput = modal.querySelector('.kd-orig-final-contact');
        var isNonMemberInput = modal.querySelector('.kd-orig-is-non-member');

        // Country picker
        var selectedCountry = COUNTRIES[0]; // Cambodia +855
        var countryTrigger = modal.querySelector('.kd-orig-country-trigger');
        var countryPopover = modal.querySelector('.kd-orig-country-popover');
        var countrySearch = modal.querySelector('.kd-orig-search-input');
        var countryList = modal.querySelector('.kd-orig-country-list');
        var flagImg = modal.querySelector('.kd-orig-flag-img');
        var dialCodeSpan = modal.querySelector('.kd-orig-dial-code');
        var chevron = modal.querySelector('.kd-orig-chevron');

        // Membership checkboxes
        var memberCheck = modal.querySelector('#kd_orig_status_member');
        var nonMemberCheck = modal.querySelector('#kd_orig_status_nonmember');
        var memberIdBox = modal.querySelector('.kd-orig-memberid-box');
        var optinBox = modal.querySelector('.kd-orig-optin-box');
        var memberIdInput = modal.querySelector('#kd_orig_member_id');

        function openModal() {
            modal.classList.add('kd-modal-open');
            modal.setAttribute('aria-hidden', 'false');
            document.body.classList.add('kd-body-no-scroll');

            // Reset form if previous success was shown
            if (form && successView && successView.style.display !== 'none') {
                form.reset();
                form.style.display = 'block';
                successView.style.display = 'none';
                if (errorBox) errorBox.style.display = 'none';
                setMode('phone');
                setMemberStatus('non-member');
            }

            var nameInput = modal.querySelector('#kd_orig_name');
            if (nameInput) {
                setTimeout(function () {
                    nameInput.focus();
                }, 100);
            }
        }

        function closeModal() {
            modal.classList.remove('kd-modal-open');
            modal.setAttribute('aria-hidden', 'true');
            document.body.classList.remove('kd-body-no-scroll');
            if (errorBox) errorBox.style.display = 'none';
            closeCountryDropdown();
        }

        openBtn.addEventListener('click', function (e) {
            e.preventDefault();
            openModal();
        });

        if (closeBtn) {
            closeBtn.addEventListener('click', function (e) {
                e.preventDefault();
                closeModal();
            });
        }

        if (doneBtn) {
            doneBtn.addEventListener('click', function (e) {
                e.preventDefault();
                closeModal();
            });
        }

        // Close on backdrop click
        modal.addEventListener('click', function (e) {
            if (e.target === modal) {
                closeModal();
            }
        });

        // Close on Escape key
        document.addEventListener('keydown', function (e) {
            if ((e.key === 'Escape' || e.key === 'Esc') && modal.classList.contains('kd-modal-open')) {
                closeModal();
            }
        });

        // Mode Switching (Phone vs Email)
        function setMode(mode) {
            currentMode = mode;
            pillBtns.forEach(function (btn) {
                if (btn.getAttribute('data-mode') === mode) {
                    btn.classList.add('kd-active');
                } else {
                    btn.classList.remove('kd-active');
                }
            });

            if (mode === 'phone') {
                if (contactLabel) {
                    contactLabel.innerHTML = 'Phone Number <span class="kd-orig-req">*</span>';
                }
                if (phoneWrap) phoneWrap.style.display = 'flex';
                if (emailWrap) emailWrap.style.display = 'none';
            } else {
                if (contactLabel) {
                    contactLabel.innerHTML = 'Email Address <span class="kd-orig-req">*</span>';
                }
                if (phoneWrap) phoneWrap.style.display = 'none';
                if (emailWrap) emailWrap.style.display = 'block';
            }
        }

        pillBtns.forEach(function (btn) {
            btn.addEventListener('click', function () {
                var m = this.getAttribute('data-mode');
                setMode(m);
            });
        });

        // Country Popover Render & Logic
        function renderCountryList(filterText) {
            if (!countryList) return;
            var query = (filterText || '').toLowerCase().trim();
            var matches = COUNTRIES.filter(function (c) {
                if (!query) return true;
                return (
                    c.country.toLowerCase().includes(query) ||
                    c.dialCode.toLowerCase().includes(query) ||
                    (c.nationality && c.nationality.toLowerCase().includes(query))
                );
            });

            countryList.innerHTML = '';
            if (matches.length === 0) {
                countryList.innerHTML = '<div class="kd-orig-empty-country">No country found</div>';
                return;
            }

            matches.forEach(function (c) {
                var isSelected = c.code === selectedCountry.code;
                var item = document.createElement('button');
                item.type = 'button';
                item.className = 'kd-orig-country-item' + (isSelected ? ' kd-selected' : '');
                item.innerHTML =
                    '<div class="kd-orig-item-left">' +
                    '<img src="https://flagcdn.com/w40/' + c.code + '.png" alt="" class="kd-orig-item-flag" />' +
                    '<span class="kd-orig-item-name">' + c.country + '</span>' +
                    '</div>' +
                    '<span class="kd-orig-item-code">' + c.dialCode + '</span>';

                item.addEventListener('click', function () {
                    selectCountry(c);
                });
                countryList.appendChild(item);
            });
        }

        function selectCountry(country) {
            selectedCountry = country;
            if (flagImg) {
                flagImg.src = 'https://flagcdn.com/w40/' + country.code + '.png';
                flagImg.alt = country.country;
            }
            if (dialCodeSpan) {
                dialCodeSpan.textContent = country.dialCode;
            }
            closeCountryDropdown();
        }

        function openCountryDropdown() {
            if (!countryPopover) return;
            countryPopover.style.display = 'block';
            if (chevron) chevron.classList.add('kd-rotated');
            renderCountryList(countrySearch ? countrySearch.value : '');
            if (countrySearch) {
                countrySearch.focus();
            }
        }

        function closeCountryDropdown() {
            if (!countryPopover) return;
            countryPopover.style.display = 'none';
            if (chevron) chevron.classList.remove('kd-rotated');
            if (countrySearch) countrySearch.value = '';
        }

        if (countryTrigger) {
            countryTrigger.addEventListener('click', function (e) {
                e.stopPropagation();
                if (countryPopover.style.display === 'none' || !countryPopover.style.display) {
                    openCountryDropdown();
                } else {
                    closeCountryDropdown();
                }
            });
        }

        if (countrySearch) {
            countrySearch.addEventListener('input', function () {
                renderCountryList(this.value);
            });
            countrySearch.addEventListener('click', function (e) {
                e.stopPropagation();
            });
        }

        // Close country dropdown when clicked outside
        document.addEventListener('click', function (e) {
            if (countryPopover && countryPopover.style.display !== 'none') {
                if (!countryPopover.contains(e.target) && !countryTrigger.contains(e.target)) {
                    closeCountryDropdown();
                }
            }
        });

        // Membership Status Checkboxes
        function setMemberStatus(status) {
            if (status === 'member') {
                if (memberCheck) memberCheck.checked = true;
                if (nonMemberCheck) nonMemberCheck.checked = false;
                if (memberIdBox) memberIdBox.style.display = 'block';
                if (optinBox) optinBox.style.display = 'none';
                if (isNonMemberInput) isNonMemberInput.value = 'false';
            } else {
                if (memberCheck) memberCheck.checked = false;
                if (nonMemberCheck) nonMemberCheck.checked = true;
                if (memberIdBox) memberIdBox.style.display = 'none';
                if (optinBox) optinBox.style.display = 'block';
                if (isNonMemberInput) isNonMemberInput.value = 'true';
            }
        }

        if (memberCheck) {
            memberCheck.addEventListener('change', function () {
                if (this.checked) {
                    setMemberStatus('member');
                } else {
                    setMemberStatus('non-member');
                }
            });
        }

        if (nonMemberCheck) {
            nonMemberCheck.addEventListener('change', function () {
                if (this.checked) {
                    setMemberStatus('non-member');
                } else {
                    setMemberStatus('member');
                }
            });
        }

        // Form Submit
        if (form) {
            form.addEventListener('submit', function (e) {
                e.preventDefault();

                if (errorBox) {
                    errorBox.style.display = 'none';
                    errorBox.textContent = '';
                }

                var nameVal = (form.querySelector('[name="name"]') || {}).value || '';
                if (!nameVal.trim()) {
                    showError('Please enter your full name.');
                    return;
                }

                var finalContact = '';
                var nationalityVal = '';

                if (currentMode === 'phone') {
                    var rawPhone = (phoneInput ? phoneInput.value : '').replace(/[^\d\s-]/g, '').trim();
                    if (!rawPhone) {
                        showError('Please enter your phone number.');
                        if (phoneInput) phoneInput.focus();
                        return;
                    }
                    var normalizedNum = rawPhone.replace(/^0+/, '');
                    finalContact = selectedCountry.dialCode + ' ' + normalizedNum;
                    nationalityVal = selectedCountry.nationality || selectedCountry.country;
                } else {
                    var emailVal = (emailInput ? emailInput.value : '').trim();
                    if (!emailVal || !emailVal.includes('@')) {
                        showError('Please enter a valid email address.');
                        if (emailInput) emailInput.focus();
                        return;
                    }
                    var natSelect = form.querySelector('[name="nationality"]');
                    nationalityVal = natSelect ? natSelect.value : '';
                    if (!nationalityVal) {
                        showError('Please select your nationality.');
                        if (natSelect) natSelect.focus();
                        return;
                    }
                    finalContact = emailVal;
                }

                if (finalContactInput) {
                    finalContactInput.value = finalContact;
                }

                setSubmitting(true);

                var formData = new FormData(form);
                formData.set('contact', finalContact);
                formData.set('phoneNumber', finalContact);
                formData.set('nationality', nationalityVal);
                formData.append('action', 'kd_register_event');

                if (window.kdEventsConfig && window.kdEventsConfig.nonce) {
                    formData.append('nonce', window.kdEventsConfig.nonce);
                }

                var ajaxEndpoint = (window.kdEventsConfig && window.kdEventsConfig.ajaxUrl)
                    ? window.kdEventsConfig.ajaxUrl
                    : '/wp-admin/admin-ajax.php';

                fetch(ajaxEndpoint, {
                    method: 'POST',
                    body: formData
                })
                .then(function (res) {
                    return res.json();
                })
                .then(function (data) {
                    setSubmitting(false);

                    if (data && data.success) {
                        var resData = data.data || {};
                        var resName = modal.querySelector('.kd-res-name');
                        var resContact = modal.querySelector('.kd-res-contact');

                        if (resName) resName.textContent = resData.name || nameVal;
                        if (resContact) resContact.textContent = resData.contact || finalContact;

                        form.style.display = 'none';
                        if (successView) successView.style.display = 'block';
                    } else {
                        var msg = (data && data.data && data.data.message)
                            ? data.data.message
                            : ((data && data.error) ? data.error : 'Registration could not be completed. Please try again.');
                        showError(msg);
                    }
                })
                .catch(function () {
                    setSubmitting(false);
                    showError('Network error while processing registration. Please try again.');
                });
            });
        }

        function showError(msg) {
            if (errorBox) {
                errorBox.textContent = msg;
                errorBox.style.display = 'block';
                errorBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
        }

        function setSubmitting(isSubmitting) {
            if (submitBtn) submitBtn.disabled = isSubmitting;
            if (submitText) submitText.style.display = isSubmitting ? 'none' : 'inline';
            if (sendIcon) sendIcon.style.display = isSubmitting ? 'none' : 'inline-block';
            if (spinner) spinner.style.display = isSubmitting ? 'inline-block' : 'none';
        }
    }

    function setupCountdownTimer(container) {
        var countdownBox = container.querySelector('.kd-countdown-box');
        if (!countdownBox) return;

        var startAtRaw = countdownBox.getAttribute('data-start-at');
        var endAtRaw = countdownBox.getAttribute('data-end-at');
        var dateStr = countdownBox.getAttribute('data-date-str') || '';

        var daysEl = countdownBox.querySelector('.kd-days');
        var hoursEl = countdownBox.querySelector('.kd-hours');
        var minutesEl = countdownBox.querySelector('.kd-minutes');
        var secondsEl = countdownBox.querySelector('.kd-seconds');
        var labelEl = countdownBox.querySelector('.kd-countdown-label');

        function parseTargetTime() {
            var now = Date.now();
            var start = startAtRaw ? new Date(startAtRaw).getTime() : NaN;
            var end = endAtRaw ? new Date(endAtRaw).getTime() : NaN;

            if (isNaN(start) && dateStr) {
                var parts = dateStr.split(/[–—\-]/);
                if (parts[0]) {
                    var pStart = new Date(parts[0].trim()).getTime();
                    if (!isNaN(pStart)) start = pStart;
                }
                if (parts[1]) {
                    var pEnd = new Date(parts[1].trim()).getTime();
                    if (!isNaN(pEnd)) end = pEnd;
                }
            }

            // Fallback for October tournament if unparsed
            if (isNaN(start) && isNaN(end)) {
                if (dateStr.toLowerCase().indexOf('october') !== -1 || !dateStr) {
                    start = new Date('2026-10-21T18:00:00+07:00').getTime();
                }
            }

            var isUpcoming = !isNaN(start) && now < start;
            var target = isUpcoming ? start : end;
            var label = isUpcoming ? 'Starts in' : 'Ends in';

            return { target: target, label: label };
        }

        function pad(n) {
            return n < 10 ? '0' + n : '' + n;
        }

        function tick() {
            var info = parseTargetTime();
            var now = Date.now();

            if (isNaN(info.target) || info.target <= now) {
                countdownBox.style.display = 'none';
                return;
            }

            if (labelEl) {
                labelEl.textContent = info.label;
            }

            var totalSecs = Math.floor((info.target - now) / 1000);
            var d = Math.floor(totalSecs / 86400);
            var h = Math.floor((totalSecs % 86400) / 3600);
            var m = Math.floor((totalSecs % 3600) / 60);
            var s = totalSecs % 60;

            if (daysEl) daysEl.textContent = pad(d);
            if (hoursEl) hoursEl.textContent = pad(h);
            if (minutesEl) minutesEl.textContent = pad(m);
            if (secondsEl) secondsEl.textContent = pad(s);
        }

        tick();
        setInterval(tick, 1000);
    }

    var activeLightbox = null;

    function setupFlyerLightbox(container) {
        var posterImages = container.querySelectorAll('.event-detail-posters img, .kd-rich-description img');
        if (!posterImages.length) return;

        posterImages.forEach(function (img) {
            img.style.cursor = 'zoom-in';
            img.onclick = function (e) {
                e.stopPropagation();
                openLightbox(img.src, img.alt || 'Event Flyer');
            };
        });
    }

    function openLightbox(src, alt) {
        if (!src) return;

        var lb = document.getElementById('kd-flyer-lightbox');
        if (!lb) {
            lb = document.createElement('div');
            lb.id = 'kd-flyer-lightbox';
            lb.className = 'kd-lightbox-backdrop';
            lb.innerHTML = '<button type="button" class="kd-lightbox-close" aria-label="Close flyer view"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button><div class="kd-lightbox-img-wrap"><img src="" alt="" class="kd-lightbox-img" /></div>';
            document.body.appendChild(lb);

            var closeBtn = lb.querySelector('.kd-lightbox-close');
            if (closeBtn) {
                closeBtn.addEventListener('click', function (e) {
                    e.stopPropagation();
                    closeLightbox();
                });
            }

            lb.addEventListener('click', function (e) {
                if (e.target === lb || e.target.classList.contains('kd-lightbox-img-wrap')) {
                    closeLightbox();
                }
            });

            document.addEventListener('keydown', function (e) {
                if ((e.key === 'Escape' || e.key === 'Esc') && lb.classList.contains('kd-lightbox-open')) {
                    closeLightbox();
                }
            });
        }

        var lbImg = lb.querySelector('.kd-lightbox-img');
        if (lbImg) {
            lbImg.src = src;
            lbImg.alt = alt || '';
        }

        activeLightbox = lb;
        lb.classList.add('kd-lightbox-open');
        document.body.classList.add('kd-body-no-scroll');
    }

    function closeLightbox() {
        if (!activeLightbox) {
            activeLightbox = document.getElementById('kd-flyer-lightbox');
        }
        if (activeLightbox) {
            activeLightbox.classList.remove('kd-lightbox-open');
        }
        document.body.classList.remove('kd-body-no-scroll');
    }

    // ── Membership Enrollment Implementation ──────────────────────────
    function setupEnrollmentForms() {
        var enrollContainers = document.querySelectorAll('.kd-enrollment-container');
        if (!enrollContainers.length) return;

        enrollContainers.forEach(function (container) {
            setupSingleEnrollment(container);
        });
    }

    function setupSingleEnrollment(container) {
        var translations = {};
        try {
            var rawT = container.getAttribute('data-translations');
            if (rawT) translations = JSON.parse(rawT);
        } catch (e) {
            console.error('KD Enrollment: Could not parse translations', e);
        }

        var countries = [];
        try {
            var rawC = container.getAttribute('data-countries');
            if (rawC) countries = JSON.parse(rawC);
        } catch (e) {}

        var nationalities = [];
        try {
            var rawN = container.getAttribute('data-nationalities');
            if (rawN) nationalities = JSON.parse(rawN);
        } catch (e) {}

        var apiHost = container.getAttribute('data-api-host') || 'https://kompongdewa.win';

        var form = container.querySelector('.kd-enroll-form');
        var successView = container.querySelector('.kd-enroll-success');
        var alertError = container.querySelector('.kd-enroll-alert-error');
        var scanErrorBox = container.querySelector('.kd-enroll-scan-error');
        var resetBtn = container.querySelector('.kd-enroll-reset-btn');

        var nameInput = container.querySelector('#kd_enroll_name');
        var phoneInput = container.querySelector('#kd_enroll_phone');
        var emailInput = container.querySelector('#kd_enroll_email');
        var fileInput = container.querySelector('#kd_enroll_file');
        var uploadBox = container.querySelector('.kd-enroll-upload-box');
        var uploadIdle = container.querySelector('.kd-enroll-upload-idle');
        var uploadScanning = container.querySelector('.kd-enroll-upload-scanning');
        var uploadVerified = container.querySelector('.kd-enroll-upload-verified');

        var submitBtn = container.querySelector('.kd-enroll-submit-btn');
        var submitText = container.querySelector('.kd-enroll-submit-text');
        var sendIcon = container.querySelector('.kd-enroll-send-icon');
        var submitSpinner = container.querySelector('.kd-enroll-spinner');

        var currentLang = 'en';
        var currentContactMode = 'phone';
        var selectedCountry = countries[0] || { country: 'Indonesia', code: 'id', dialCode: '+62', nationality: 'Indonesian' };
        var selectedNationality = 'Indonesian';
        var selectedPassportFile = null;

        // 1. Language Dropdown Switcher
        var langTrigger = container.querySelector('.kd-enroll-lang-trigger');
        var langMenu = container.querySelector('.kd-enroll-lang-menu');
        var langFlagCurrent = container.querySelector('.kd-enroll-lang-flag-current');
        var langLabelCurrent = container.querySelector('.kd-enroll-lang-label-current');
        var langOptions = container.querySelectorAll('.kd-enroll-lang-option');

        if (langTrigger && langMenu) {
            langTrigger.addEventListener('click', function (e) {
                e.stopPropagation();
                langMenu.classList.toggle('kd-open');
            });

            document.addEventListener('click', function (e) {
                if (!container.contains(e.target)) {
                    langMenu.classList.remove('kd-open');
                }
            });

            langOptions.forEach(function (opt) {
                opt.addEventListener('click', function (e) {
                    e.stopPropagation();
                    var code = this.getAttribute('data-lang-code');
                    var flag = this.querySelector('img');
                    var label = this.querySelector('span');

                    if (flag && langFlagCurrent) {
                        langFlagCurrent.src = flag.src;
                        langFlagCurrent.alt = flag.alt;
                    }
                    if (label && langLabelCurrent) {
                        langLabelCurrent.textContent = label.textContent;
                    }

                    langOptions.forEach(function (o) { o.classList.remove('kd-active'); });
                    this.classList.add('kd-active');
                    langMenu.classList.remove('kd-open');

                    currentLang = code;
                    applyEnrollmentTranslation(container, translations[code]);
                });
            });
        }

        // 2. Contact Mode Switcher (Phone vs Email)
        var pillBtns = container.querySelectorAll('.kd-enroll-pill-btn');
        var phoneContainer = container.querySelector('.kd-enroll-phone-container');
        var emailContainer = container.querySelector('.kd-enroll-email-container');
        var contactLabelText = container.querySelector('.kd-label-contact-text');

        function setContactMode(mode) {
            currentContactMode = mode;
            pillBtns.forEach(function (b) {
                if (b.getAttribute('data-mode') === mode) {
                    b.classList.add('kd-active');
                } else {
                    b.classList.remove('kd-active');
                }
            });

            var t = translations[currentLang] || {};
            if (mode === 'phone') {
                if (phoneContainer) phoneContainer.style.display = 'flex';
                if (emailContainer) emailContainer.style.display = 'none';
                if (contactLabelText) contactLabelText.textContent = t.phoneNumber || 'Phone Number';
            } else {
                if (phoneContainer) phoneContainer.style.display = 'none';
                if (emailContainer) emailContainer.style.display = 'block';
                if (contactLabelText) contactLabelText.textContent = t.emailAddress || 'Email Address';
            }
        }

        pillBtns.forEach(function (b) {
            b.addEventListener('click', function () {
                setContactMode(this.getAttribute('data-mode'));
            });
        });

        // 3. Country Picker Popover (Phone Mode)
        var countryTrigger = container.querySelector('.kd-enroll-country-trigger');
        var countryPopover = container.querySelector('.kd-enroll-country-popover');
        var countrySearch = container.querySelector('.kd-enroll-country-search-input');
        var countryList = container.querySelector('.kd-enroll-country-list');
        var countryFlagImg = container.querySelector('.kd-enroll-flag-img');
        var countryDialCode = container.querySelector('.kd-enroll-dial-code');

        function renderCountryList(filter) {
            if (!countryList) return;
            var q = (filter || '').toLowerCase().trim();
            var matches = countries.filter(function (c) {
                if (!q) return true;
                return c.country.toLowerCase().includes(q) ||
                       c.dialCode.toLowerCase().includes(q) ||
                       (c.nationality && c.nationality.toLowerCase().includes(q));
            });

            countryList.innerHTML = '';
            if (!matches.length) {
                countryList.innerHTML = '<div class="kd-orig-empty-country">No country found</div>';
                return;
            }

            matches.forEach(function (c) {
                var isSel = c.code === selectedCountry.code;
                var item = document.createElement('button');
                item.type = 'button';
                item.className = 'kd-orig-country-item' + (isSel ? ' kd-selected' : '');
                item.innerHTML =
                    '<div class="kd-orig-item-left">' +
                    '<img src="https://flagcdn.com/w40/' + c.code + '.png" alt="" class="kd-orig-item-flag" />' +
                    '<span class="kd-orig-item-name">' + c.country + '</span>' +
                    '</div>' +
                    '<span class="kd-orig-item-code">' + c.dialCode + '</span>';

                item.addEventListener('click', function () {
                    selectCountry(c);
                });
                countryList.appendChild(item);
            });
        }

        function selectCountry(c) {
            selectedCountry = c;
            if (countryFlagImg) {
                countryFlagImg.src = 'https://flagcdn.com/w40/' + c.code + '.png';
                countryFlagImg.alt = c.country;
            }
            if (countryDialCode) countryDialCode.textContent = c.dialCode;
            if (countryPopover) countryPopover.style.display = 'none';

            // Auto-sync nationality if available
            if (c.nationality) {
                setNationality(c.nationality, c.code);
            }
        }

        if (countryTrigger && countryPopover) {
            countryTrigger.addEventListener('click', function (e) {
                e.stopPropagation();
                var isOpen = countryPopover.style.display === 'block';
                countryPopover.style.display = isOpen ? 'none' : 'block';
                if (!isOpen) {
                    renderCountryList(countrySearch ? countrySearch.value : '');
                    if (countrySearch) countrySearch.focus();
                }
            });

            if (countrySearch) {
                countrySearch.addEventListener('input', function () {
                    renderCountryList(this.value);
                });
                countrySearch.addEventListener('click', function (e) {
                    e.stopPropagation();
                });
            }

            document.addEventListener('click', function (e) {
                if (!countryPopover.contains(e.target) && !countryTrigger.contains(e.target)) {
                    countryPopover.style.display = 'none';
                }
            });
        }

        // 4. Nationality Custom Dropdown Selector
        var natTrigger = container.querySelector('.kd-enroll-nat-trigger');
        var natPopover = container.querySelector('.kd-enroll-nat-popover');
        var natSearch = container.querySelector('.kd-enroll-nat-search-input');
        var natList = container.querySelector('.kd-enroll-nat-list');
        var natFlag = container.querySelector('.kd-enroll-nat-flag');
        var natName = container.querySelector('.kd-enroll-nat-name');
        var natHiddenVal = container.querySelector('.kd-enroll-nat-val');
        var natCustomBox = container.querySelector('.kd-enroll-nat-custom-box');
        var natCustomInput = container.querySelector('.kd-enroll-nat-custom-input');
        var natBackBtn = container.querySelector('.kd-enroll-nat-back-btn');

        function renderNationalityList(filter) {
            if (!natList) return;
            var q = (filter || '').toLowerCase().trim();
            var matches = nationalities.filter(function (n) {
                if (!q) return true;
                return n.label.toLowerCase().includes(q) ||
                       n.value.toLowerCase().includes(q) ||
                       n.code.toLowerCase().includes(q);
            });

            natList.innerHTML = '';
            if (!matches.length) {
                natList.innerHTML = '<div class="kd-orig-empty-country">No nationality found</div>';
                return;
            }

            matches.forEach(function (n) {
                var isSel = n.value.toLowerCase() === selectedNationality.toLowerCase();
                var item = document.createElement('button');
                item.type = 'button';
                item.className = 'kd-orig-country-item' + (isSel ? ' kd-selected' : '');
                
                var flagMarkup = (n.code && n.code !== 'other')
                    ? '<img src="https://flagcdn.com/w40/' + n.code + '.png" alt="" class="kd-orig-item-flag" />'
                    : '<span style="display:inline-block; width:20px; text-align:center;">🌐</span>';

                item.innerHTML =
                    '<div class="kd-orig-item-left">' +
                    flagMarkup +
                    '<span class="kd-orig-item-name">' + n.label + '</span>' +
                    '</div>';

                item.addEventListener('click', function () {
                    if (n.code === 'other') {
                        switchToCustomNationality();
                    } else {
                        setNationality(n.value, n.code);
                    }
                    if (natPopover) natPopover.style.display = 'none';
                });
                natList.appendChild(item);
            });
        }

        function setNationality(val, code) {
            selectedNationality = val;
            if (natHiddenVal) natHiddenVal.value = val;
            if (natName) natName.textContent = val;
            if (natFlag) {
                if (code && code !== 'other') {
                    natFlag.src = 'https://flagcdn.com/w40/' + code + '.png';
                    natFlag.style.display = 'inline-block';
                } else {
                    natFlag.style.display = 'none';
                }
            }
            if (natCustomBox) natCustomBox.style.display = 'none';
            if (natTrigger) natTrigger.style.display = 'flex';
        }

        function switchToCustomNationality() {
            if (natTrigger) natTrigger.style.display = 'none';
            if (natCustomBox) {
                natCustomBox.style.display = 'flex';
                if (natCustomInput) {
                    natCustomInput.value = '';
                    natCustomInput.focus();
                }
            }
        }

        if (natTrigger && natPopover) {
            natTrigger.addEventListener('click', function (e) {
                e.stopPropagation();
                var isOpen = natPopover.style.display === 'block';
                natPopover.style.display = isOpen ? 'none' : 'block';
                if (!isOpen) {
                    renderNationalityList(natSearch ? natSearch.value : '');
                    if (natSearch) natSearch.focus();
                }
            });

            if (natSearch) {
                natSearch.addEventListener('input', function () {
                    renderNationalityList(this.value);
                });
                natSearch.addEventListener('click', function (e) {
                    e.stopPropagation();
                });
            }

            document.addEventListener('click', function (e) {
                if (!natPopover.contains(e.target) && !natTrigger.contains(e.target)) {
                    natPopover.style.display = 'none';
                }
            });
        }

        if (natBackBtn) {
            natBackBtn.addEventListener('click', function () {
                if (natCustomBox) natCustomBox.style.display = 'none';
                if (natTrigger) natTrigger.style.display = 'flex';
                setNationality('Indonesian', 'id');
            });
        }

        if (natCustomInput) {
            natCustomInput.addEventListener('input', function () {
                selectedNationality = this.value.trim() || 'Other';
                if (natHiddenVal) natHiddenVal.value = selectedNationality;
            });
        }

        // 5. Passport Upload & OCR Scanning
        function setUploadState(state) {
            if (uploadIdle) uploadIdle.style.display = state === 'idle' ? 'flex' : 'none';
            if (uploadScanning) uploadScanning.style.display = state === 'scanning' ? 'flex' : 'none';
            if (uploadVerified) uploadVerified.style.display = state === 'verified' ? 'flex' : 'none';

            if (uploadBox) {
                uploadBox.classList.remove('kd-scanning', 'kd-verified', 'kd-error');
                if (state === 'scanning') uploadBox.classList.add('kd-scanning');
                if (state === 'verified') uploadBox.classList.add('kd-verified');
                if (state === 'error') uploadBox.classList.add('kd-error');
            }
        }

        function showScanError(msg) {
            if (scanErrorBox) {
                scanErrorBox.textContent = msg;
                scanErrorBox.style.display = 'block';
            }
            setUploadState('error');
        }

        function hideScanError() {
            if (scanErrorBox) {
                scanErrorBox.textContent = '';
                scanErrorBox.style.display = 'none';
            }
        }

        if (uploadBox && fileInput) {
            uploadBox.addEventListener('click', function () {
                fileInput.click();
            });

            uploadBox.addEventListener('dragover', function (e) {
                e.preventDefault();
                uploadBox.classList.add('kd-dragover');
            });

            uploadBox.addEventListener('dragleave', function () {
                uploadBox.classList.remove('kd-dragover');
            });

            uploadBox.addEventListener('drop', function (e) {
                e.preventDefault();
                uploadBox.classList.remove('kd-dragover');
                if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]) {
                    processPassportFile(e.dataTransfer.files[0]);
                }
            });

            fileInput.addEventListener('change', function () {
                if (this.files && this.files[0]) {
                    processPassportFile(this.files[0]);
                }
            });
        }

        function processPassportFile(file) {
            if (!file.type.match(/^image\//i)) {
                showScanError('Please select a valid image file (JPG, PNG, WebP).');
                return;
            }

            hideScanError();
            setUploadState('scanning');

            function doOCRScan() {
                if (!window.Tesseract) {
                    selectedPassportFile = file;
                    setUploadState('verified');
                    return;
                }

                window.Tesseract.recognize(file, 'eng')
                    .then(function (result) {
                        var text = (result && result.data && result.data.text) ? result.data.text : '';
                        var lines = text.split('\n').map(function (l) { return l.trim().replace(/\s+/g, ''); });
                        var pLine1 = /^P[A-Z<][A-Z<0-9]{42}$/;
                        var pLine2 = /^[A-Z0-9<]{44}$/;
                        var isValid = false;

                        for (var i = 0; i < lines.length; i++) {
                            if (pLine1.test(lines[i]) || pLine2.test(lines[i])) {
                                isValid = true;
                                break;
                            }
                        }

                        var low = text.toLowerCase();
                        if (!isValid && (low.includes('passport') || low.includes('paspor') || low.includes('republic') || low.includes('identity') || low.includes('card') || low.includes('surat') || low.includes('perjalanan') || low.includes('nama'))) {
                            isValid = true;
                        }

                        if (isValid) {
                            selectedPassportFile = file;
                            setUploadState('verified');
                            hideScanError();
                        } else {
                            selectedPassportFile = null;
                            if (fileInput) fileInput.value = '';
                            showScanError('Please upload a valid passport image. Selfies or random images are not allowed.');
                        }
                    })
                    .catch(function (err) {
                        console.warn('KD Enrollment OCR warning:', err);
                        // Fallback: accept file if OCR script fails
                        selectedPassportFile = file;
                        setUploadState('verified');
                        hideScanError();
                    });
            }

            if (!window.Tesseract) {
                var s = document.createElement('script');
                s.src = 'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js';
                s.onload = doOCRScan;
                s.onerror = function () {
                    selectedPassportFile = file;
                    setUploadState('verified');
                };
                document.head.appendChild(s);
            } else {
                doOCRScan();
            }
        }

        // 6. Form Submission & Anti-Spam Validation
        if (form) {
            form.addEventListener('submit', function (e) {
                e.preventDefault();
                hideFormError();

                var nameVal = (nameInput ? nameInput.value : '').trim();
                if (!nameVal) {
                    showFormError('Please enter your full name.');
                    if (nameInput) nameInput.focus();
                    return;
                }

                // Name validation
                if (nameVal.length < 2 || nameVal.length > 70) {
                    showFormError('Full name must be between 2 and 70 characters.');
                    if (nameInput) nameInput.focus();
                    return;
                }

                var finalContact = '';
                if (currentContactMode === 'phone') {
                    var rawPhone = (phoneInput ? phoneInput.value : '').replace(/[^\d\s-]/g, '').trim();
                    if (!rawPhone) {
                        showFormError('Please enter your phone number.');
                        if (phoneInput) phoneInput.focus();
                        return;
                    }
                    var digits = rawPhone.replace(/\D/g, '');
                    if (digits.length < 7) {
                        showFormError('Phone number must be at least 7 digits.');
                        if (phoneInput) phoneInput.focus();
                        return;
                    }
                    var normalized = rawPhone.replace(/^0+/, '');
                    finalContact = selectedCountry.dialCode + ' ' + normalized;
                } else {
                    var emailVal = (emailInput ? emailInput.value : '').trim();
                    if (!emailVal || !emailVal.includes('@') || !emailVal.includes('.')) {
                        showFormError('Please enter a valid email address.');
                        if (emailInput) emailInput.focus();
                        return;
                    }
                    finalContact = emailVal;
                }

                var natVal = (natCustomBox && natCustomBox.style.display !== 'none' && natCustomInput)
                    ? natCustomInput.value.trim()
                    : selectedNationality;

                if (!natVal) {
                    showFormError('Please select or specify your nationality.');
                    return;
                }

                if (!selectedPassportFile) {
                    showFormError('Please upload your ID/Passport image.');
                    if (uploadBox) uploadBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                    return;
                }

                setSubmitting(true);

                var formData = new FormData();
                formData.append('isNonMemberTab', 'true');
                formData.append('wantsMembership', 'true');
                formData.append('name', nameVal);
                formData.append('phoneNumber', finalContact);
                formData.append('contact', finalContact);
                formData.append('nationality', natVal);
                formData.append('passportImage', selectedPassportFile);

                // Direct fetch to backend
                var directUrl = apiHost.replace(/\/+$/, '') + '/api/register';

                fetch(directUrl, {
                    method: 'POST',
                    body: formData
                })
                .then(function (res) {
                    return res.json();
                })
                .then(function (data) {
                    setSubmitting(false);
                    if (data && data.success) {
                        showSuccess(nameVal, finalContact, natVal);
                    } else {
                        var errMsg = (data && data.error) ? data.error : 'Registration could not be completed. Please try again.';
                        showFormError(errMsg);
                    }
                })
                .catch(function (err) {
                    console.warn('KD Enrollment: Direct fetch failed, trying WordPress AJAX fallback', err);
                    submitViaAjaxFallback(formData, nameVal, finalContact, natVal);
                });
            });
        }

        function submitViaAjaxFallback(formData, nameVal, finalContact, natVal) {
            formData.append('action', 'kd_register_enrollment');
            if (window.kdEventsConfig && window.kdEventsConfig.nonce) {
                formData.append('nonce', window.kdEventsConfig.nonce);
            }

            var ajaxUrl = (window.kdEventsConfig && window.kdEventsConfig.ajaxUrl)
                ? window.kdEventsConfig.ajaxUrl
                : '/wp-admin/admin-ajax.php';

            fetch(ajaxUrl, {
                method: 'POST',
                body: formData
            })
            .then(function (res) { return res.json(); })
            .then(function (data) {
                setSubmitting(false);
                if (data && data.success) {
                    showSuccess(nameVal, finalContact, natVal);
                } else {
                    var msg = (data && data.data && data.data.message) ? data.data.message : 'Registration failed. Please try again.';
                    showFormError(msg);
                }
            })
            .catch(function () {
                setSubmitting(false);
                showFormError('Network connection error while submitting enrollment. Please check your connection and try again.');
            });
        }

        function showSuccess(nameVal, contactVal, natVal) {
            if (form) form.style.display = 'none';
            if (successView) {
                var resName = successView.querySelector('.kd-res-name');
                var resContact = successView.querySelector('.kd-res-contact');
                var resNat = successView.querySelector('.kd-res-nat');

                if (resName) resName.textContent = nameVal;
                if (resContact) resContact.textContent = contactVal;
                if (resNat) resNat.textContent = natVal;

                successView.style.display = 'block';
                successView.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
        }

        function showFormError(msg) {
            if (alertError) {
                alertError.textContent = msg;
                alertError.style.display = 'block';
                alertError.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
        }

        function hideFormError() {
            if (alertError) {
                alertError.textContent = '';
                alertError.style.display = 'none';
            }
        }

        function setSubmitting(isSubmitting) {
            if (submitBtn) submitBtn.disabled = isSubmitting;
            if (submitText) submitText.style.display = isSubmitting ? 'none' : 'inline';
            if (sendIcon) sendIcon.style.display = isSubmitting ? 'none' : 'inline-block';
            if (submitSpinner) submitSpinner.style.display = isSubmitting ? 'inline-block' : 'none';
        }

        // 7. Reset / Enroll Another Member
        if (resetBtn) {
            resetBtn.addEventListener('click', function () {
                if (form) {
                    form.reset();
                    form.style.display = 'block';
                }
                if (successView) successView.style.display = 'none';
                hideFormError();
                hideScanError();
                selectedPassportFile = null;
                setUploadState('idle');
                setContactMode('phone');
                setNationality('Indonesian', 'id');
            });
        }
    }

    function applyEnrollmentTranslation(container, data) {
        if (!data) return;

        var elHeroTitle = container.querySelector('.kd-enroll-hero-title');
        if (elHeroTitle && data.resortTitle) elHeroTitle.textContent = data.resortTitle;

        var elHeroLoc = container.querySelector('.kd-enroll-hero-loc-text');
        if (elHeroLoc && data.resortLocation) elHeroLoc.textContent = data.resortLocation;

        var elHeroDesc = container.querySelector('.kd-enroll-hero-desc');
        if (elHeroDesc && data.resortDesc) elHeroDesc.textContent = data.resortDesc;

        var elFormTitle = container.querySelector('.kd-enroll-form-title');
        if (elFormTitle && data.membershipEnrollment) elFormTitle.textContent = data.membershipEnrollment;

        var elNameLabel = container.querySelector('.kd-label-name-text');
        if (elNameLabel && data.fullName) elNameLabel.textContent = data.fullName;

        var elNameInput = container.querySelector('#kd_enroll_name');
        if (elNameInput && data.fullNamePlaceholder) elNameInput.placeholder = data.fullNamePlaceholder;

        var elTabPhone = container.querySelector('.kd-tab-phone-text');
        if (elTabPhone && data.phoneTab) elTabPhone.textContent = data.phoneTab;

        var elTabEmail = container.querySelector('.kd-tab-email-text');
        if (elTabEmail && data.emailTab) elTabEmail.textContent = data.emailTab;

        var elPhoneInput = container.querySelector('#kd_enroll_phone');
        if (elPhoneInput && data.phonePlaceholder) elPhoneInput.placeholder = data.phonePlaceholder;

        var elEmailInput = container.querySelector('#kd_enroll_email');
        if (elEmailInput && data.emailPlaceholder) elEmailInput.placeholder = data.emailPlaceholder;

        var elNatLabel = container.querySelector('.kd-label-nat-text');
        if (elNatLabel && data.nationality) elNatLabel.textContent = data.nationality;

        var elPassLabel = container.querySelector('.kd-label-passport-text');
        if (elPassLabel && data.uploadPassport) elPassLabel.textContent = data.uploadPassport;

        var elUploadIdle = container.querySelector('.kd-enroll-upload-label-text');
        if (elUploadIdle && data.clickToUpload) elUploadIdle.textContent = data.clickToUpload;

        var elScanning = container.querySelector('.kd-enroll-scanning-text');
        if (elScanning && data.scanningId) elScanning.textContent = data.scanningId;

        var elHelp = container.querySelector('.kd-enroll-help-note');
        if (elHelp && data.passportHelp) elHelp.textContent = data.passportHelp;

        var elSubmit = container.querySelector('.kd-enroll-submit-text');
        if (elSubmit && data.submitRegistration) elSubmit.textContent = data.submitRegistration;

        var elSuccessTitle = container.querySelector('.kd-enroll-success-title');
        if (elSuccessTitle && data.membershipSuccess) elSuccessTitle.textContent = data.membershipSuccess;

        var elSuccessDesc = container.querySelector('.kd-enroll-success-desc');
        if (elSuccessDesc && data.thankYou) elSuccessDesc.textContent = data.thankYou;

        var elReset = container.querySelector('.kd-enroll-reset-btn span');
        if (elReset && data.enrollAnother) elReset.textContent = data.enrollAnother;
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initKDEventShowcase);
    } else {
        initKDEventShowcase();
    }
})();
