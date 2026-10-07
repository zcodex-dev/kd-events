/**
 * KD Event Showcase JavaScript
 * Handles Flag Language Dropdown, Instant Multi-Language Switching, Mobile Navigation Drawer, and Live Countdown Timer
 */

(function () {
    'use strict';

    function initKDEventShowcase() {
        var containers = document.querySelectorAll('.kd-showcase-container');
        if (!containers.length) return;

        containers.forEach(function (container) {
            setupLanguageDropdown(container);
            setupCountdownTimer(container);
            setupPrizePoolAnimations(container);
            setupRegisterModal(container);
            setupFlyerLightbox(container);
        });
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

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initKDEventShowcase);
    } else {
        initKDEventShowcase();
    }
})();
