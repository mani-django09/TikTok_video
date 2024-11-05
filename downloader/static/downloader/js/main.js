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
            width: 50px;
            height: 50px;
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
    initializeFormHandlers();

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
        // Hide all sections that should be hidden
        const sectionsToHide = document.querySelectorAll('.features-section, .how-to-section, .faq-section');
        sectionsToHide.forEach(section => {
            section.style.display = 'none';
        });

        // Hide the form but keep the container for the preview
        const heroContent = document.querySelector('.hero-content');
        if (heroContent) {
            const downloadForm = heroContent.querySelector('.download-form');
            if (downloadForm) {
                downloadForm.style.display = 'none';
            }
            // Hide any other elements in hero section except what's needed for preview
            const elementsToHide = heroContent.querySelectorAll('.main-title, .subtitle');
            elementsToHide.forEach(el => {
                el.style.display = 'none';
            });
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

    function showVideoPreview(videoData) {
        // Remove any existing preview
        const existingPreview = document.querySelector('.video-preview');
        if (existingPreview) {
            existingPreview.remove();
        }
    
        const previewHTML = `
            <div class="video-preview">
                <div class="preview-content">
                    <div class="video-info-wrapper">
                        <div class="channel-info">
                            <img src="${videoData.thumbnail}" alt="Video thumbnail" class="channel-thumbnail">
                            <div class="channel-details">
                                <h3 class="channel-name">${videoData.author}</h3>
                                <p class="video-title">${videoData.description || 'No description'}</p>
                                ${videoData.music ? `
                                    <p class="video-music">
                                        <i class="fas fa-music"></i> ${videoData.music.title || 'Original sound'} - ${videoData.music.author || videoData.author}
                                    </p>
                                ` : ''}
                            </div>
                        </div>
                        <div class="video-stats">
                            <span title="Likes"><i class="fas fa-heart"></i> ${formatNumber(videoData.likes)}</span>
                            <span title="Comments"><i class="fas fa-comment"></i> ${formatNumber(videoData.comments)}</span>
                            <span title="Shares"><i class="fas fa-share"></i> ${formatNumber(videoData.shares)}</span>
                            ${videoData.duration ? `
                                <span title="Duration"><i class="fas fa-clock"></i> ${formatDuration(videoData.duration)}</span>
                            ` : ''}
                        </div>
                    </div>
    
                    <div class="download-options">
                        <button class="download-btn-option" data-quality="sd">
                            Without watermark
                        </button>
                        <button class="download-btn-option" data-quality="hd">
                            Without watermark HD
                            <span class="quality-badge">4K</span>
                        </button>
                        <button class="download-btn-option" data-quality="audio">
                            Download MP3
                        </button>
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

        // Initialize download buttons
        initializeDownloadButtons(videoData.url);
    }

    function initializeDownloadButtons(videoUrl) {
        const downloadButtons = document.querySelectorAll('.download-btn-option');
        downloadButtons.forEach(btn => {
            btn.addEventListener('click', async () => {
                const quality = btn.dataset.quality;
                btn.disabled = true;
                const originalText = btn.innerHTML;
                btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
    
                try {
                    const response = await fetch('/api/process/', {  // Changed from /api/download to /api/process/
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            url: videoUrl,
                            quality: quality,
                            remove_watermark: true
                        })
                    });
    
                    const data = await response.json();
    
                    if (data.status === 'success' && data.download_url) {  // Changed to match your API response structure
                        showSuccess('Starting download...');
                        setTimeout(() => {
                            window.location.href = data.download_url;
                        }, 1000);
                    } else {
                        throw new Error('Download failed');
                    }
                } catch (error) {
                    showError('Download failed. Please try again.');
                    console.error('Download error:', error);
                } finally {
                    btn.disabled = false;
                    btn.innerHTML = originalText;
                }
            });
        });
    }

    function handleApiError(error) {
        showError(error.message || 'An error occurred. Please try again.');
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
        removeMessages();
        const errorDiv = document.createElement('div');
        errorDiv.className = 'message error-message';
        errorDiv.innerHTML = `
            <i class="fas fa-exclamation-circle"></i>
            <span>${message}</span>
        `;
        form.appendChild(errorDiv);
        
        setTimeout(() => {
            errorDiv.remove();
        }, 3000);
    }

    function showSuccess(message) {
        removeMessages();
        const successDiv = document.createElement('div');
        successDiv.className = 'message success-message';
        successDiv.innerHTML = `
            <i class="fas fa-check-circle"></i>
            <span>${message}</span>
        `;
        form.appendChild(successDiv);
        
        setTimeout(() => {
            successDiv.remove();
        }, 3000);
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
    
    // Add these styles to your existing styles
    const additionalStyles = `
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
    
        .channel-thumbnail {
            width: 48px;
            height: 48px;
            border-radius: 50%;
            object-fit: cover;
        }
    
        .video-stats span {
            padding: 4px 8px;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 12px;
            font-size: 13px;
        }
    
        .video-title {
            word-break: break-word;
            line-height: 1.4;
        }
    `;
    

    function isValidTikTokUrl(url) {
        return url.toLowerCase().includes('tiktok.com/') && 
               (url.includes('/video/') || url.includes('/@'));
    }
})


function removeFooterAnimations() {
    // Remove animation-related classes from footer
    const footer = document.querySelector('.site-footer');
    if (footer) {
        footer.classList.remove('animate-fade-in', 'wave-animation');
        // Remove wave SVG if it exists
        const waves = footer.querySelector('.footer-waves');
        if (waves) {
            waves.remove();
        }
    }

    // Remove number animations
    const stats = document.querySelectorAll('.stat-number');
    stats.forEach(stat => {
        const finalValue = stat.getAttribute('data-count');
        stat.textContent = formatNumber(finalValue);
    });
}

// Updated styles for static footer
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

// Add the static footer styles
const styleSheet = document.createElement("style");
styleSheet.innerText = footerStyles;
document.head.appendChild(styleSheet);

// Call this function when the page loads
document.addEventListener('DOMContentLoaded', function() {
    removeFooterAnimations();
});