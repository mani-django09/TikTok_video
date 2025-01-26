document.addEventListener('DOMContentLoaded', function() {
    const urlInput = document.querySelector('.url-input');
    const downloadBtn = document.querySelector('.download-btn');
    const pasteBtn = document.querySelector('.paste-btn');
    const form = document.querySelector('.download-form');
    let isProcessing = false;

    // Add styles
    const styles = `
        .video-preview {
            background: rgba(0, 0, 0, 0.8);
            border-radius: 12px;
            padding: 20px;
            margin-top: 20px;
            backdrop-filter: blur(10px);
        }

        .preview-container {
            max-width: 800px;
            margin: 0 auto;
            padding: 0 20px;
        }

        .video-info-wrapper {
            margin-bottom: 20px;
        }

        .channel-info {
            display: flex;
            align-items: center;
            gap: 15px;
            margin-bottom: 15px;
        }

        .channel-thumbnail {
            width: 48px;
            height: 48px;
            border-radius: 50%;
            object-fit: cover;
        }

        .channel-details {
            color: white;
        }

        .channel-name {
            font-size: 18px;
            margin-bottom: 5px;
        }

        .video-title {
            font-size: 14px;
            color: rgba(255, 255, 255, 0.8);
            word-break: break-word;
            line-height: 1.4;
        }

        .video-stats {
            display: flex;
            gap: 20px;
            color: white;
            font-size: 14px;
        }

        .video-stats span {
            display: flex;
            align-items: center;
            gap: 5px;
            padding: 4px 8px;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 12px;
            font-size: 13px;
        }

        .download-options {
            display: flex;
            flex-direction: column;
            gap: 10px;
        }

        .download-btn-option {
            width: 100%;
            padding: 15px;
            background: #60A5FA;
            border: none;
            border-radius: 8px;
            color: white;
            font-size: 16px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: space-between;
            transition: background-color 0.3s;
        }

        .download-btn-option:hover {
            background: #3B82F6;
        }

        .download-btn-option:disabled {
            background: #9CA3AF;
            cursor: not-allowed;
        }

        .quality-badge {
            background: rgba(255, 255, 255, 0.2);
            padding: 2px 8px;
            border-radius: 4px;
            font-size: 12px;
        }

        .message {
            margin-top: 10px;
            padding: 10px;
            border-radius: 8px;
            text-align: center;
        }

        .error-message {
            background: #FEE2E2;
            color: #DC2626;
        }

        .success-message {
            background: #DCFCE7;
            color: #16A34A;
        }

        .hero-section {
            min-height: auto;
            padding: 40px 0;
        }

        .video-music {
            color: rgba(255, 255, 255, 0.7);
            font-size: 12px;
            margin-top: 5px;
            display: flex;
            align-items: center;
            gap: 5px;
        }

        .video-music i {
            font-size: 14px;
        }

        @media (max-width: 768px) {
            .video-preview {
                margin: 20px 10px;
            }
            
            .video-stats {
                justify-content: space-around;
            }
        }
    `;

    const styleSheet = document.createElement("style");
    styleSheet.innerText = styles;
    document.head.appendChild(styleSheet);

    // Initialize form handlers
    function initializeFormHandlers() {
        // Handle form submission
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (!isProcessing) {
                handleVideoInfo();
            }
        });

        // Handle download button click
        downloadBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (!isProcessing) {
                handleVideoInfo();
            }
        });

        // Handle paste button
        if (pasteBtn) {
            pasteBtn.addEventListener('click', async () => {
                try {
                    const text = await navigator.clipboard.readText();
                    urlInput.value = text;
                    urlInput.focus();
                    
                    // Add visual feedback
                    pasteBtn.innerHTML = '<i class="fas fa-check"></i>';
                    pasteBtn.style.background = '#10b981';
                    pasteBtn.style.color = 'white';
                    
                    setTimeout(() => {
                        pasteBtn.innerHTML = '<i class="fas fa-paste"></i>';
                        pasteBtn.style.background = '';
                        pasteBtn.style.color = '';
                    }, 1000);
                } catch (err) {
                    showError('Failed to paste from clipboard');
                }
            });
        }
    }

    function hideMainContent() {
        const sectionsToHide = document.querySelectorAll('.features-section, .how-to-section, .faq-section');
        sectionsToHide.forEach(section => section.style.display = 'none');
    
        const heroContent = document.querySelector('.hero-content');
        if (heroContent) {
            const downloadForm = heroContent.querySelector('.download-form');
            const elementsToHide = heroContent.querySelectorAll('.main-title, .subtitle');
            
            if (downloadForm) downloadForm.style.display = 'none';
            elementsToHide.forEach(el => el.style.display = 'none');
        }
    }

    async function handleVideoInfo() {
        const url = urlInput.value.trim();
        
        if (!url) {
            showError('Please enter a TikTok URL');
            return;
        }
    
        if (!isValidTikTokUrl(url)) {
            showError('Please enter a valid TikTok URL');
            return;
        }
    
        isProcessing = true;
        showLoading();
    
        try {
            removeMessages();
    
            // Make actual API call to get video info
            const response = await fetch('/api/video-info/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': getCsrfToken()
                },
                body: JSON.stringify({ url })
            });
    
            const data = await response.json();
    
            if (data.status === 'success') {
                hideMainContent();
                showVideoPreview({
                    url: url,
                    thumbnail: data.data.thumbnail,
                    title: data.data.title,
                    author: data.data.author,
                    likes: data.data.likes || 0,
                    comments: data.data.comments || 0,
                    shares: data.data.shares || 0,
                    description: data.data.description || '',
                    duration: data.data.duration || '',
                    music: data.data.music || {}
                });
                urlInput.value = '';
            } else {
                handleApiError(data);
            }
        } catch (error) {
            handleApiError(error);
        } finally {
            isProcessing = false;
            hideLoading();
        }
    }

    function showVideoPreview(data) {
        const previewHTML = `
            <div class="video-preview">
                <div class="preview-content">
                    <!-- User Info Section -->
                    <div class="user-section">
                        <img src="${data.thumbnail}" class="user-avatar" alt="Profile">
                        <div class="user-info">
                            <h3 class="username">${data.author}</h3>
                            <p class="description">${data.description || 'No description'}</p>
                            <div class="sound-info">
                                <i class="fas fa-music"></i>
                                <span>Original sound - ${data.author}</span>
                            </div>
                        </div>
                    </div>
    
                    <!-- Download Buttons -->
                    <div class="download-options">
                        <button class="download-btn-option" onclick="handleDownload('sd', '${data.url}')">
                            Without watermark
                        </button>
                        <button class="download-btn-option" onclick="handleDownload('hd', '${data.url}')">
                            Without watermark HD
                            <span class="quality-badge">4K</span>
                        </button>
                        <button class="download-btn-option" onclick="handleDownload('audio', '${data.url}')">
                            Download MP3
                        </button>
                    </div>
                </div>
    
                <!-- Stats Bar -->
                <div class="stats-bar">
                    <div class="stat-item">
                        <i class="fas fa-heart"></i>
                        <span>${formatNumber(data.likes)}</span>
                    </div>
                    <div class="stat-item">
                        <i class="fas fa-comment"></i>
                        <span>${formatNumber(data.comments)}</span>
                    </div>
                    <div class="stat-item">
                        <i class="fas fa-share"></i>
                        <span>${formatNumber(data.shares)}</span>
                    </div>
                </div>
            </div>
        `;
    
        // Find the hero section to insert the preview
        const heroSection = document.querySelector('.hero-section');
        if (heroSection) {
            let previewContainer = heroSection.querySelector('.preview-container');
            if (!previewContainer) {
                previewContainer = document.createElement('div');
                previewContainer.className = 'preview-container';
                heroSection.appendChild(previewContainer);
            }
            previewContainer.innerHTML = previewHTML;
        }
    }

    // Add this function at the global scope (outside any event listeners)
    window.handleDownload = function(quality, url) {
        const button = event.target.closest('.download-btn-option');
        const originalText = button.innerHTML;
        
        try {
            button.disabled = true;
            button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';

            fetch('/api/process/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': getCsrfToken()
                },
                body: JSON.stringify({
                    url: url,
                    quality: quality,
                    remove_watermark: true
                })
            })
            .then(response => response.json())
            .then(data => {
                if (data.status === 'success' && data.download_url) {
                    showSuccess('Starting download...');
                    window.location.href = data.download_url;
                } else {
                    throw new Error('Download failed');
                }
            })
            .catch(error => {
                showError('Download failed. Please try again.');
                console.error('Download error:', error);
            })
            .finally(() => {
                button.disabled = false;
                button.innerHTML = originalText;
            });
        } catch (error) {
            showError('Download failed. Please try again.');
            console.error('Download error:', error);
            button.disabled = false;
            button.innerHTML = originalText;
        }
    };

    function handleApiError(error) {
        if (error.message?.includes('Api Limit')) {
            showError('Please wait a moment before trying again');
            setTimeout(() => {
                if (!isProcessing) {
                    handleVideoInfo();
                }
            }, 2000);
        } else {
            showError(error.message || 'An error occurred. Please try again.');
        }
    }

    function showLoading() {
        downloadBtn.disabled = true;
        downloadBtn.innerHTML = `
            <i class="fas fa-spinner fa-spin"></i>
            <span>Processing...</span>
        `;
    }

    function hideLoading() {
        downloadBtn.disabled = false;
        downloadBtn.innerHTML = `
            <i class="fas fa-download"></i>
            <span>Download</span>
        `;
    }

    function showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'message error-message';
        errorDiv.innerHTML = `
            <i class="fas fa-exclamation-circle"></i>
            <span>${message}</span>
        `;
        document.querySelector('.download-form').appendChild(errorDiv);
        setTimeout(() => errorDiv.remove(), 3000);
    }

    function showSuccess(message) {
        const successDiv = document.createElement('div');
        successDiv.className = 'message success-message';
        successDiv.innerHTML = `
            <i class="fas fa-check-circle"></i>
            <span>${message}</span>
        `;
        document.querySelector('.download-form').appendChild(successDiv);
        setTimeout(() => successDiv.remove(), 3000);
    }

    function removeMessages() {
        const messages = document.querySelectorAll('.message');
        messages.forEach(msg => msg.remove());
    }

    function formatNumber(num) {
        if (!num) return '0';
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M';
        }
        if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'K';
        }
        return num.toString();
    }

    function formatDuration(seconds) {
        if (!seconds) return '';
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }

    function isValidTikTokUrl(url) {
        return url.toLowerCase().includes('tiktok.com/') && 
               (url.includes('/video/') || url.includes('/@'));
    }

    function getCsrfToken() {
        const cookies = document.cookie.split(';');
        for (let cookie of cookies) {
            const [name, value] = cookie.trim().split('=');
            if (name === 'csrftoken') {
                return value;
            }
        }
        return '';
    }

    // Initialize event handlers
    initializeFormHandlers();

    // Initialize footer
    initFooterAnimations();
});

// Footer animations and functionality
function initFooterAnimations() {
    
    const stats = document.querySelectorAll('.stat-number');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                animateNumber(entry.target);
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.5
    });

    stats.forEach(stat => observer.observe(stat));
}

function animateNumber(element) {
    const final = parseInt(element.getAttribute('data-count'));
    const duration = 2000;
    const start = performance.now();
    
    function updateNumber(currentTime) {
        const elapsed = currentTime - start;
        const progress = Math.min(elapsed / duration, 1);
        const easeOutQuart = 1 - Math.pow(1 - progress, 4);
        const current = Math.floor(easeOutQuart * final);
        element.textContent = formatNumber(current);
        
        if (progress < 1) {
            requestAnimationFrame(updateNumber);
        }
    }
    
    requestAnimationFrame(updateNumber);
}

// FAQ Functionality
function toggleFaq(element) {
    const faqItems = document.querySelectorAll('.faq-item');
    const currentItem = element.closest('.faq-item');
    const answer = currentItem.querySelector('.faq-answer');
    
    faqItems.forEach(item => {
        if (item !== currentItem) {
            item.classList.remove('active');
            item.querySelector('.faq-answer').style.maxHeight = '0';
            item.querySelector('.faq-icon i').style.transform = 'rotate(0)';
        }
    });

    currentItem.classList.toggle('active');
    const isActive = currentItem.classList.contains('active');
    const icon = currentItem.querySelector('.faq-icon i');
    
    answer.style.maxHeight = isActive ? `${answer.scrollHeight}px` : '0';
    icon.style.transform = isActive ? 'rotate(180deg)' : 'rotate(0)';
}

// Add event listeners
document.querySelectorAll('.faq-question').forEach(question => {
    question.addEventListener('click', function() {
        toggleFaq(this);
    });
});

// Add click event listeners to all FAQ questions
document.addEventListener('DOMContentLoaded', function() {
    // Remove all onclick attributes from HTML elements
    document.querySelectorAll('.faq-question').forEach(question => {
        question.removeAttribute('onclick');
    });

    // Add click event listeners
    document.querySelectorAll('.faq-item').forEach(item => {
        const question = item.querySelector('.faq-question');
        const answer = item.querySelector('.faq-answer');
        
        question.addEventListener('click', function() {
            // Close other items
            document.querySelectorAll('.faq-item.active').forEach(activeItem => {
                if (activeItem !== item) {
                    activeItem.classList.remove('active');
                    const otherAnswer = activeItem.querySelector('.faq-answer');
                    otherAnswer.style.maxHeight = null;
                }
            });

            // Toggle current item
            item.classList.toggle('active');
            if (item.classList.contains('active')) {
                answer.style.maxHeight = answer.scrollHeight + 'px';
            } else {
                answer.style.maxHeight = null;
            }
        });
    });
});

function removeFooterAnimations() {
    const footer = document.querySelector('.site-footer');
    if (footer) {
        footer.classList.remove('animate-fade-in', 'wave-animation');
        const waves = footer.querySelector('.footer-waves');
        if (waves) {
            waves.remove();
        }
    }

    const stats = document.querySelectorAll('.stat-number');
    stats.forEach(stat => {
        const finalValue = stat.getAttribute('data-count');
        stat.textContent = formatNumber(finalValue);
    });
}

// Add footer styles
const footerStyles = `
    .site-footer {
        background: #1a1a1a;
        color: #fff;
        padding: 60px 0 20px;
        position: relative;
        margin-top: 100px;
    }

    .footer-container {
        max-width: 1200px;
        margin: 0 auto;
        padding: 0 20px;
    }

    .footer-content {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 40px;
    }

    .footer-brand {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-bottom: 20px;
    }

    .footer-brand i {
        color: #00f2fe;
        font-size: 24px;
    }

    .footer-brand h3 {
        font-size: 24px;
        margin: 0;
    }

    .footer-description {
        color: #9ca3af;
        margin-bottom: 20px;
        line-height: 1.6;
    }

    .download-stats {
        display: flex;
        gap: 40px;
    }

    .stat-item {
        display: flex;
        flex-direction: column;
        align-items: center;
    }

    .stat-number {
        font-size: 24px;
        font-weight: bold;
        color: #00f2fe;
    }

    .stat-label {
        color: #9ca3af;
        font-size: 14px;
    }

    .quick-links h4,
    .support h4 {
        font-size: 18px;
        margin-bottom: 20px;
        color: #fff;
    }

    .quick-links ul {
        list-style: none;
        padding: 0;
    }

    .quick-links li {
        margin-bottom: 12px;
    }

    .quick-links a {
        color: #9ca3af;
        text-decoration: none;
        display: flex;
        align-items: center;
        gap: 8px;
        transition: color 0.3s;
    }

    .quick-links a:hover {
        color: #00f2fe;
    }

    .support-content p {
        color: #9ca3af;
        margin-bottom: 15px;
    }

    .support-email {
        color: #00f2fe;
        text-decoration: none;
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 20px;
    }

    .social-links {
        display: flex;
        gap: 15px;
    }

    .social-links a {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background: #333;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #fff;
        text-decoration: none;
        transition: background-color 0.3s;
    }

    .social-links a:hover {
        background: #00f2fe;
    }

    @media (max-width: 768px) {
        .footer-content {
            grid-template-columns: 1fr;
            text-align: center;
        }

        .footer-brand {
            justify-content: center;
        }

        .download-stats {
            justify-content: center;
        }

        .quick-links a {
            justify-content: center;
        }

        .social-links {
            justify-content: center;
        }
    }
`;

// Add the footer styles
const footerStyleSheet = document.createElement("style");
footerStyleSheet.innerText = footerStyles;
document.head.appendChild(footerStyleSheet);

// Add this to your existing JavaScript file
document.addEventListener('DOMContentLoaded', function() {
    const downloadButtons = document.querySelectorAll('.download-option');
    
    downloadButtons.forEach(button => {
      button.addEventListener('click', function() {
        const quality = this.textContent.includes('HD') ? 'hd' : 'sd';
        const isAudio = this.textContent.includes('MP3');
        const originalText = this.innerHTML;
        
        // Here you would typically call your backend API to handle the download
        // For demonstration, we'll just simulate the process
        this.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
        this.disabled = true;
        
        setTimeout(() => {
          if (isAudio) {
            console.log('Downloading audio...');
          } else {
            console.log(`Downloading video in ${quality} quality...`);
          }
          
          this.innerHTML = '<i class="fas fa-check"></i> Download Complete!';
          
          setTimeout(() => {
            this.innerHTML = originalText;
            this.disabled = false;
          }, 2000);
        }, 2000);
      });
    });
  });

  
// Track download button clicks
document.querySelectorAll('.download-btn-option').forEach(button => {
    button.addEventListener('click', function() {
        gtag('event', 'download_click', {
            'event_category': 'Download',
            'event_label': this.textContent.includes('HD') ? 'HD Video' : 
                          this.textContent.includes('MP3') ? 'MP3' : 'SD Video'
        });
    });
});

// Track paste button clicks
document.querySelector('.paste-btn')?.addEventListener('click', function() {
    gtag('event', 'paste_click', {
        'event_category': 'Input',
        'event_label': 'Paste URL'
    });
});