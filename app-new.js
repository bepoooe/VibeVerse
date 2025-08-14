// Enhanced VibeVerse Music Player - Spotify-like Experience
// Maintains original functionality while adding new features

document.addEventListener('DOMContentLoaded', function() {
    // Global variables
    let currentSongIndex = 0;
    let songs = [];
    let isPlaying = false;
    let loopState = 0; // 0: off, 1: repeat one, 2: repeat all
    let isShuffled = false;
    let originalSongOrder = [];
    let hasLoopedOnce = false;
    let isTypingInSearch = false;
    let customSongs = [];
    let currentVolume = 0.5;
    let searchTimeout = null;
    let selectedDropdownIndex = -1;
    let likedSongs = JSON.parse(localStorage.getItem('likedSongs') || '[]');
    let playlists = JSON.parse(localStorage.getItem('playlists') || '[]');
    let recentlyPlayed = JSON.parse(localStorage.getItem('recentlyPlayed') || '[]');
    let currentSection = 'home';
    
    // DOM elements
    const musicPlayer = document.getElementById('music-player');
    const sidebar = document.getElementById('sidebar');
    const sidebarOverlay = document.getElementById('sidebar-overlay');
    const themeToggle = document.getElementById('theme-toggle');
    const audioPlayer = document.getElementById('audio-player');
    
    // Modals
    const addToPlaylistModal = document.getElementById('add-to-playlist-modal');
    const songContextMenu = document.getElementById('song-context-menu');
    
    // Context menu variables
    let contextMenuSong = null;
    let contextMenuPosition = { x: 0, y: 0 };
    
    // Navigation elements
    const navItems = document.querySelectorAll('.nav-item');
    const contentSections = document.querySelectorAll('.content-section');
    
    // Search elements
    const searchInput = document.getElementById('search-input');
    const searchBtn = document.getElementById('search-btn');
    const searchDropdown = document.getElementById('search-dropdown');
    const dropdownResults = document.getElementById('dropdown-results');
    const searchResults = document.getElementById('search-results');
    
    // Player elements
    const playPauseBtn = document.getElementById('play-pause-btn');
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    const shuffleBtn = document.getElementById('shuffle-btn');
    const loopBtn = document.getElementById('loop-btn');
    const volumeBtn = document.getElementById('volume-btn');
    const volumeSlider = document.getElementById('volume-slider');
    const progressBar = document.getElementById('progress-bar');
    const progress = document.getElementById('progress');
    const waveProgress = document.getElementById('wave-progress');
    const currentTimeDisplay = document.getElementById('current-time');
    const durationDisplay = document.getElementById('duration');
    
    // Track info elements
    const currentAlbumArt = document.getElementById('current-album-art');
    const currentSongTitle = document.getElementById('current-song-title');
    const currentSongArtist = document.getElementById('current-song-artist');
    const likeBtn = document.getElementById('like-btn');
    
    // Mobile expanded controls elements
    const mobileExpandBtn = document.getElementById('mobile-expand-btn');
    const mobileExpandedControls = document.getElementById('mobile-expanded-controls');
    const mobilePlayPauseBtn = document.getElementById('mobile-play-pause-btn');
    const mobilePrevBtn = document.getElementById('mobile-prev-btn');
    const mobileNextBtn = document.getElementById('mobile-next-btn');
    const mobileShuffleBtn = document.getElementById('mobile-shuffle-btn');
    const mobileLoopBtn = document.getElementById('mobile-loop-btn');
    const mobileVolumeBtn = document.getElementById('mobile-volume-btn');
    const mobileVolumeSlider = document.getElementById('mobile-volume-slider');
    const mobileProgressBar = document.getElementById('mobile-progress-bar');
    const mobileProgress = document.getElementById('mobile-progress');
    const mobileCurrentTimeDisplay = document.getElementById('mobile-current-time');
    const mobileDurationDisplay = document.getElementById('mobile-duration');
    const mobileCurrentAlbumArt = document.getElementById('mobile-current-album-art');
    const mobileCurrentSongTitle = document.getElementById('mobile-current-song-title');
    const mobileCurrentSongArtist = document.getElementById('mobile-current-song-artist');
    const mobileLikeBtn = document.getElementById('mobile-like-btn');
    const mobileFullscreenBtn = document.getElementById('mobile-fullscreen-btn');
    
    // Modal elements
    const likedSongsModal = document.getElementById('liked-songs-modal');
    const createPlaylistModal = document.getElementById('create-playlist-modal');
    const fullscreenPlayer = document.getElementById('fullscreen-player');
    
    // Initialize the app
    init();
    
    function init() {
        loadCustomSongs();
        setupEventListeners();
        setupNavigation();
        setupPlayer();
        setupModals();
        updatePlaylistsInSidebar();
        loadHomeContent();
        setGreeting();
        initializeSidebar();
        
        // Set initial volume
        audioPlayer.volume = currentVolume;
        volumeSlider.value = currentVolume * 100;
    }
    
    function initializeSidebar() {
        // Initialize sidebar state based on screen size
        if (window.innerWidth <= 768) {
            // Mobile: sidebar should be closed by default
            sidebar?.classList.remove('open');
            sidebarOverlay?.classList.remove('show');
        } else {
            // Desktop: sidebar should be open by default
            sidebar?.classList.remove('open');
            sidebarOverlay?.classList.remove('show');
        }
        
        // Set correct icons for mobile toggle
        updateSidebarIcons();
        
        // Add resize listener with debouncing
        window.sidebarResizeHandler = debounce(handleWindowResize, 150);
        window.addEventListener('resize', window.sidebarResizeHandler);
    }
    
    // Debounce utility function
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
    
    function updateSidebarIcons() {
        // Update mobile menu toggle icon
        const mobileToggle = document.getElementById('mobile-menu-toggle');
        if (mobileToggle) {
            const icon = mobileToggle.querySelector('i');
            if (icon) {
                if (window.innerWidth <= 768) {
                    // Mobile mode - show bars or times based on sidebar state
                    const isOpen = sidebar?.classList.contains('open');
                    icon.className = isOpen ? 'fas fa-times' : 'fas fa-bars';
                } else {
                    // Desktop mode - always show bars for mobile toggle
                    icon.className = 'fas fa-bars';
                }
                icon.style.transform = 'scale(1)';
            }
        }
    }
    
    function handleWindowResize() {
        const isMobile = window.innerWidth <= 768;
        
        if (isMobile) {
            // Mobile mode: ensure sidebar is closed
            sidebar?.classList.remove('open');
            sidebarOverlay?.classList.remove('show');
        } else {
            // Desktop mode: ensure sidebar is visible and close mobile expanded controls
            sidebar?.classList.remove('open');
            sidebarOverlay?.classList.remove('show');
            closeMobileExpandedControls();
        }
        
        // Update icons after state changes
        updateSidebarIcons();
    }
    
    function loadCustomSongs() {
        const script = document.createElement('script');
        script.src = 'custom.js';
        script.onload = function() {
            customSongs = window.customSongs || [];
        };
        document.head.appendChild(script);
    }
    
    function setupEventListeners() {
        // Mobile menu toggle
        const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
        mobileMenuToggle?.addEventListener('click', toggleMobileSidebar);
        
        // Sidebar overlay
        sidebarOverlay?.addEventListener('click', closeMobileSidebar);
        
        // Theme toggle
        themeToggle?.addEventListener('click', toggleTheme);
        
        // Search functionality
        searchInput?.addEventListener('input', handleSearchInput);
        searchInput?.addEventListener('focus', () => isTypingInSearch = true);
        searchInput?.addEventListener('blur', () => {
            isTypingInSearch = false;
            setTimeout(() => {
                if (!searchDropdown?.contains(document.activeElement)) {
                    hideSearchDropdown();
                }
            }, 200);
        });
        searchInput?.addEventListener('keydown', handleSearchKeydown);
        searchBtn?.addEventListener('click', handleSearchSubmit);
        
        // Player controls
        playPauseBtn?.addEventListener('click', togglePlayPause);
        prevBtn?.addEventListener('click', playPrevious);
        nextBtn?.addEventListener('click', playNext);
        shuffleBtn?.addEventListener('click', toggleShuffle);
        loopBtn?.addEventListener('click', toggleLoop);
        
        // Volume control
        volumeBtn?.addEventListener('click', toggleMute);
        volumeSlider?.addEventListener('input', handleVolumeChange);
        
        // Progress bar
        progressBar?.addEventListener('click', handleProgressBarClick);
        
        // Mobile expanded controls
        mobileExpandBtn?.addEventListener('click', toggleMobileExpandedControls);
        mobilePlayPauseBtn?.addEventListener('click', togglePlayPause);
        mobilePrevBtn?.addEventListener('click', playPrevious);
        mobileNextBtn?.addEventListener('click', playNext);
        mobileShuffleBtn?.addEventListener('click', toggleShuffle);
        mobileLoopBtn?.addEventListener('click', toggleLoop);
        mobileVolumeBtn?.addEventListener('click', toggleMute);
        mobileVolumeSlider?.addEventListener('input', handleVolumeChange);
        mobileProgressBar?.addEventListener('click', handleMobileProgressBarClick);
        mobileLikeBtn?.addEventListener('click', toggleLike);
        mobileFullscreenBtn?.addEventListener('click', openFullscreenPlayer);
        
        // Audio player events
        audioPlayer?.addEventListener('timeupdate', updateProgress);
        audioPlayer?.addEventListener('ended', handleSongEnd);
        audioPlayer?.addEventListener('play', () => {
            isPlaying = true;
            updatePlayPauseIcon();
        });
        audioPlayer?.addEventListener('pause', () => {
            isPlaying = false;
            updatePlayPauseIcon();
        });
        
        // Like button
        likeBtn?.addEventListener('click', toggleLike);
        
        // Fullscreen player
        document.getElementById('fullscreen-btn')?.addEventListener('click', openFullscreenPlayer);
        document.getElementById('close-fullscreen')?.addEventListener('click', closeFullscreenPlayer);
        
        // Global keyboard shortcuts
        document.addEventListener('keydown', handleGlobalKeyboard);
        
        // Click outside to close dropdowns
        document.addEventListener('click', handleOutsideClick);
        
        // Context menu
        document.addEventListener('contextmenu', handleContextMenu);
        document.addEventListener('click', hideContextMenu);
        
        // Add to playlist modal
        document.getElementById('close-add-to-playlist')?.addEventListener('click', closeAddToPlaylistModal);
        document.getElementById('create-new-playlist-option')?.addEventListener('click', () => {
            closeAddToPlaylistModal();
            openCreatePlaylistModal();
        });
    }
    
    function setupNavigation() {
        navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                
                // Handle special cases first
                if (item.id === 'create-playlist-btn') {
                    openCreatePlaylistModal();
                    return;
                }
                
                if (item.id === 'liked-songs-nav') {
                    openLikedSongsModal();
                    return;
                }
                
                // Handle regular navigation
                const section = item.dataset.section;
                if (section) {
                    navigateToSection(section);
                }
            });
        });
    }
    
    function setupPlayer() {
        updateVolumeIcon();
        updatePlayPauseIcon();
        updateShuffleButton();
        updateLoopButton();
    }
    
    function setupModals() {
        // Liked songs modal
        document.getElementById('close-liked-songs')?.addEventListener('click', closeLikedSongsModal);
        
        // Create playlist modal
        document.getElementById('close-create-playlist')?.addEventListener('click', closeCreatePlaylistModal);
        document.getElementById('cancel-create-playlist')?.addEventListener('click', closeCreatePlaylistModal);
        document.getElementById('confirm-create-playlist')?.addEventListener('click', createPlaylist);
        
        // Modal backdrop clicks
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.classList.add('hidden');
                }
            });
        });
        
        // Escape key to close modals
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                closeAllModals();
            }
        });
    }
    
    // Navigation functions
    function navigateToSection(section) {
        currentSection = section;
        
        // Update nav items
        navItems.forEach(item => {
            if (item.dataset.section === section) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });
        
        // Show/hide content sections
        contentSections.forEach(contentSection => {
            if (contentSection.id === `${section}-section`) {
                contentSection.classList.add('active');
                contentSection.classList.remove('hidden');
            } else {
                contentSection.classList.remove('active');
                contentSection.classList.add('hidden');
            }
        });
        
        // Load section content
        switch (section) {
            case 'home':
                loadHomeContent();
                break;
            case 'search':
                focusSearchInput();
                break;
            case 'library':
                loadLibraryContent();
                break;
        }
    }
    
    function toggleMobileSidebar() {
        // Prevent multiple rapid toggles
        if (window.mobileToggling) return;
        window.mobileToggling = true;
        
        const isOpen = sidebar?.classList.contains('open');
        
        if (isOpen) {
            closeMobileSidebar();
        } else {
            openMobileSidebar();
        }
        
        setTimeout(() => {
            window.mobileToggling = false;
        }, 400);
    }
    
    function openMobileSidebar() {
        sidebar?.classList.add('open');
        sidebarOverlay?.classList.add('show');
        
        // Update icon
        const mobileToggle = document.getElementById('mobile-menu-toggle');
        if (mobileToggle) {
            const icon = mobileToggle.querySelector('i');
            if (icon) {
                icon.style.transform = 'scale(0)';
                setTimeout(() => {
                    icon.className = 'fas fa-times';
                    icon.style.transform = 'scale(1)';
                }, 150);
            }
        }
    }
    
    function closeMobileSidebar() {
        sidebar?.classList.remove('open');
        sidebarOverlay?.classList.remove('show');
        
        // Update icon
        const mobileToggle = document.getElementById('mobile-menu-toggle');
        if (mobileToggle) {
            const icon = mobileToggle.querySelector('i');
            if (icon) {
                icon.style.transform = 'scale(0)';
                setTimeout(() => {
                    icon.className = 'fas fa-bars';
                    icon.style.transform = 'scale(1)';
                }, 150);
            }
        }
    }
    
    function toggleTheme() {
        const isDark = musicPlayer?.classList.contains('dark-mode');
        if (isDark) {
            musicPlayer?.classList.remove('dark-mode');
            musicPlayer?.classList.add('light-mode');
            themeToggle.innerHTML = '<i class="fas fa-sun"></i><span>Light Mode</span>';
            showToast('Switched to light mode', 'info');
        } else {
            musicPlayer?.classList.remove('light-mode');
            musicPlayer?.classList.add('dark-mode');
            themeToggle.innerHTML = '<i class="fas fa-moon"></i><span>Dark Mode</span>';
            showToast('Switched to dark mode', 'info');
        }
    }
    
    // Mobile expanded controls functionality
    function toggleMobileExpandedControls() {
        const isExpanded = mobileExpandedControls?.classList.contains('show');
        
        if (isExpanded) {
            closeMobileExpandedControls();
        } else {
            openMobileExpandedControls();
        }
    }
    
    function openMobileExpandedControls() {
        if (mobileExpandedControls) {
            // Ensure element is visible - force show even on desktop for testing
            mobileExpandedControls.style.display = 'block';
            mobileExpandedControls.style.visibility = 'visible';
            
            // Use timeout to ensure DOM is ready for animation
            setTimeout(() => {
                mobileExpandedControls.classList.add('show');
            }, 10);
        }
        if (mobileExpandBtn) {
            mobileExpandBtn.classList.add('expanded');
        }
        
        // Update mobile controls with current state
        updateMobileTrackInfo();
        updateMobilePlayPauseIcon();
        updateMobileShuffleState();
        updateMobileLoopState();
        updateMobileVolumeState();
        updateMobileLikeState();
        
        showToast('Expanded player controls', 'info');
    }
    
    // Add a global test function (remove this in production)
    window.testMobileControls = function() {
        console.log('Testing mobile controls...');
        console.log('Button element:', mobileExpandBtn);
        console.log('Controls element:', mobileExpandedControls);
        toggleMobileExpandedControls();
    };
    
    function closeMobileExpandedControls() {
        if (mobileExpandedControls) {
            mobileExpandedControls.classList.remove('show');
            // Wait for animation to complete before hiding
            setTimeout(() => {
                mobileExpandedControls.style.display = 'none';
                mobileExpandedControls.style.visibility = 'hidden';
            }, 300); // Match the CSS transition duration
        }
        if (mobileExpandBtn) {
            mobileExpandBtn.classList.remove('expanded');
        }
    }
    
    function handleMobileProgressBarClick(e) {
        if (!audioPlayer?.duration) return;
        
        const rect = mobileProgressBar.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const percentage = clickX / rect.width;
        const newTime = percentage * audioPlayer.duration;
        
        audioPlayer.currentTime = newTime;
        updateProgress();
    }
    
    function updateMobileTrackInfo() {
        const currentSong = songs[currentSongIndex];
        if (!currentSong) return;
        
        if (mobileCurrentAlbumArt) {
            mobileCurrentAlbumArt.src = currentSong.image || 'music.gif';
        }
        if (mobileCurrentSongTitle) {
            mobileCurrentSongTitle.textContent = currentSong.title || 'Just relax and vibe!';
        }
        if (mobileCurrentSongArtist) {
            mobileCurrentSongArtist.textContent = currentSong.artist || '';
        }
    }
    
    function updateMobilePlayPauseIcon() {
        const icon = mobilePlayPauseBtn?.querySelector('i');
        if (icon) {
            icon.className = isPlaying ? 'fas fa-pause' : 'fas fa-play';
        }
    }
    
    function updateMobileShuffleState() {
        if (mobileShuffleBtn) {
            if (isShuffled) {
                mobileShuffleBtn.classList.add('active');
            } else {
                mobileShuffleBtn.classList.remove('active');
            }
        }
    }
    
    function updateMobileLoopState() {
        if (mobileLoopBtn) {
            const icon = mobileLoopBtn.querySelector('i');
            if (loopState === 1) {
                mobileLoopBtn.classList.add('active');
                if (icon) icon.className = 'fas fa-repeat-1';
            } else if (loopState === 2) {
                mobileLoopBtn.classList.add('active');
                if (icon) icon.className = 'fas fa-repeat';
            } else {
                mobileLoopBtn.classList.remove('active');
                if (icon) icon.className = 'fas fa-repeat';
            }
        }
    }
    
    function updateMobileVolumeState() {
        if (mobileVolumeSlider) {
            mobileVolumeSlider.value = currentVolume * 100;
        }
        
        if (mobileVolumeBtn) {
            const icon = mobileVolumeBtn.querySelector('i');
            if (icon) {
                if (currentVolume === 0) {
                    icon.className = 'fas fa-volume-mute';
                } else if (currentVolume < 0.5) {
                    icon.className = 'fas fa-volume-down';
                } else {
                    icon.className = 'fas fa-volume-up';
                }
            }
        }
    }
    
    function updateMobileLikeState() {
        const currentSong = songs[currentSongIndex];
        if (!currentSong || !mobileLikeBtn) return;
        
        const isLiked = likedSongs.some(song => song.title === currentSong.title && song.artist === currentSong.artist);
        const icon = mobileLikeBtn.querySelector('i');
        
        if (isLiked) {
            mobileLikeBtn.classList.add('liked');
            if (icon) icon.className = 'fas fa-heart';
        } else {
            mobileLikeBtn.classList.remove('liked');
            if (icon) icon.className = 'fa-regular fa-heart';
        }
    }
    
    // Search functionality
    function handleSearchInput() {
        const query = searchInput.value.trim();
        selectedDropdownIndex = -1;
        
        if (searchTimeout) {
            clearTimeout(searchTimeout);
        }
        
        if (query.length < 2) {
            hideSearchDropdown();
            return;
        }
        
        searchTimeout = setTimeout(() => {
            performSearch(query, true);
        }, 300);
    }
    
    function handleSearchKeydown(e) {
        const dropdownItems = searchDropdown?.querySelectorAll('.dropdown-item');
        
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            selectedDropdownIndex = Math.min(selectedDropdownIndex + 1, (dropdownItems?.length || 1) - 1);
            updateDropdownSelection(dropdownItems);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            selectedDropdownIndex = Math.max(selectedDropdownIndex - 1, -1);
            updateDropdownSelection(dropdownItems);
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (selectedDropdownIndex >= 0 && dropdownItems?.[selectedDropdownIndex]) {
                dropdownItems[selectedDropdownIndex].click();
            } else {
                handleSearchSubmit();
            }
        } else if (e.key === 'Escape') {
            hideSearchDropdown();
            searchInput.blur();
        }
    }
    
    function handleSearchSubmit() {
        const query = searchInput.value.trim();
        if (query) {
            performSearch(query, false);
        }
    }
    
    async function performSearch(query, isDropdownSearch = false) {
        if (!query) {
            if (!isDropdownSearch) {
                showSearchMessage("Please enter a song name");
            }
            hideSearchDropdown();
            return;
        }
        
        if (isDropdownSearch) {
            showSearchLoading();
        } else {
            showSearchMessage(`Searching for "${query}"...`);
            navigateToSection('search');
        }
        
        // Search custom songs first
        const matchedCustomSongs = customSongs.filter(song => 
            song.name.toLowerCase().includes(query.toLowerCase()) ||
            song.artists?.primary?.[0]?.name.toLowerCase().includes(query.toLowerCase())
        );
        
        try {
            let allSongs = [...matchedCustomSongs];
            
            // Search API
            const response = await fetch(`https://saavn.dev/api/search/songs?query=${encodeURIComponent(query)}`);
            const data = await response.json();
            
            if (data.data && data.data.results) {
                allSongs = [...allSongs, ...data.data.results];
            }
            
            if (allSongs.length === 0) {
                if (isDropdownSearch) {
                    showNoResults();
                } else {
                    showSearchMessage("No songs found");
                    displaySearchResults([]);
                }
                return;
            }
            
            songs = allSongs;
            
            if (isDropdownSearch) {
                displaySearchDropdown(allSongs.slice(0, 8));
            } else {
                displaySearchResults(allSongs);
                hideSearchDropdown();
            }
        } catch (error) {
            console.error("Search error:", error);
            if (isDropdownSearch) {
                showNoResults();
            } else {
                showSearchMessage("Search failed. Please try again.");
                displaySearchResults([]);
            }
        }
    }
    
    function displaySearchDropdown(songList) {
        if (!dropdownResults) return;
        
        dropdownResults.innerHTML = '';
        searchDropdown?.classList.remove('hidden');
        
        songList.forEach((song, index) => {
            const dropdownItem = document.createElement('div');
            dropdownItem.className = 'dropdown-item';
            dropdownItem.addEventListener('click', () => {
                const originalIndex = songs.indexOf(song);
                if (originalIndex !== -1) {
                    currentSongIndex = originalIndex;
                    playSong(song);
                    hideSearchDropdown();
                    searchInput.blur();
                }
            });
            
            const thumbnail = song.image?.find(img => img.quality === "150x150")?.url || 
                            song.image?.find(img => img.quality === "500x500")?.url || 
                            'music.gif';
            
            dropdownItem.innerHTML = `
                <img class="dropdown-image" src="${thumbnail}" alt="Album Art" onerror="this.src='music.gif'">
                <div class="dropdown-info">
                    <div class="dropdown-title">${decodeHtmlEntities(song.name)}</div>
                    <div class="dropdown-artist">${decodeHtmlEntities(song.artists?.primary?.[0]?.name || "Unknown Artist")}</div>
                </div>
                <i class="fas fa-play dropdown-play-icon"></i>
            `;
            
            dropdownResults.appendChild(dropdownItem);
        });
    }
    
    function displaySearchResults(songList) {
        if (!searchResults) return;
        
        if (songList.length === 0) {
            searchResults.innerHTML = '<div class="search-no-results">No songs found</div>';
            return;
        }
        
        searchResults.innerHTML = `
            <div class="search-results-header">
                <h3>Search Results</h3>
                <p>${songList.length} songs found</p>
            </div>
            <div class="track-list" id="search-track-list">
                ${songList.map((song, index) => createTrackItem(song, index)).join('')}
            </div>
        `;
        
        // Add event listeners to track items
        setupTrackListeners('search-track-list');
    }
    
    function hideSearchDropdown() {
        searchDropdown?.classList.add('hidden');
        selectedDropdownIndex = -1;
    }
    
    function showSearchLoading() {
        if (!dropdownResults) return;
        dropdownResults.innerHTML = '<div class="search-loading"><i class="fas fa-spinner fa-spin"></i> Searching...</div>';
        searchDropdown?.classList.remove('hidden');
    }
    
    function showNoResults() {
        if (!dropdownResults) return;
        dropdownResults.innerHTML = '<div class="search-no-results">No songs found</div>';
        searchDropdown?.classList.remove('hidden');
    }
    
    function showSearchMessage(message) {
        // Show message in search results area
        if (currentSection === 'search' && searchResults) {
            searchResults.innerHTML = `<div class="search-message">${message}</div>`;
        }
        
        // Also show as toast for immediate feedback
        if (message.includes('Now playing')) {
            showToast(message, 'success');
        } else if (message.includes('error') || message.includes('failed')) {
            showToast(message, 'error');
        } else {
            showToast(message, 'info');
        }
    }
    
    function updateDropdownSelection(dropdownItems) {
        dropdownItems?.forEach((item, index) => {
            if (index === selectedDropdownIndex) {
                item.classList.add('selected');
                item.scrollIntoView({ block: 'nearest' });
            } else {
                item.classList.remove('selected');
            }
        });
    }
    
    function focusSearchInput() {
        setTimeout(() => searchInput?.focus(), 100);
    }
    
    // Player functionality
    function togglePlayPause() {
        if (audioPlayer?.src) {
            if (isPlaying) {
                audioPlayer.pause();
            } else {
                audioPlayer.play();
            }
        }
    }
    
    function playPrevious() {
        if (songs.length > 0) {
            currentSongIndex = (currentSongIndex - 1 + songs.length) % songs.length;
            playSong(songs[currentSongIndex]);
        }
    }
    
    function playNext() {
        if (songs.length > 0) {
            if (isShuffled && originalSongOrder.length > 0) {
                // Shuffle logic
                const remainingSongs = originalSongOrder.filter((_, index) => index !== currentSongIndex);
                if (remainingSongs.length > 0) {
                    const randomIndex = Math.floor(Math.random() * remainingSongs.length);
                    currentSongIndex = originalSongOrder.indexOf(remainingSongs[randomIndex]);
                } else {
                    currentSongIndex = 0; // Start over
                }
            } else {
                currentSongIndex = (currentSongIndex + 1) % songs.length;
            }
            playSong(songs[currentSongIndex]);
        }
    }
    
    function toggleShuffle() {
        isShuffled = !isShuffled;
        if (isShuffled) {
            originalSongOrder = [...songs];
        }
        updateShuffleButton();
    }
    
    function toggleLoop() {
        loopState = (loopState + 1) % 3;
        hasLoopedOnce = false;
        updateLoopButton();
    }
    
    function toggleMute() {
        if (audioPlayer?.volume > 0) {
            audioPlayer.volume = 0;
            volumeSlider.value = 0;
        } else {
            audioPlayer.volume = currentVolume;
            volumeSlider.value = currentVolume * 100;
        }
        updateVolumeIcon();
    }
    
    function handleVolumeChange(e) {
        // Determine which slider was used
        const slider = e.target;
        currentVolume = slider.value / 100;
        audioPlayer.volume = currentVolume;
        
        // Sync both sliders
        if (volumeSlider && slider !== volumeSlider) {
            volumeSlider.value = currentVolume * 100;
        }
        if (mobileVolumeSlider && slider !== mobileVolumeSlider) {
            mobileVolumeSlider.value = currentVolume * 100;
        }
        
        updateVolumeIcon();
    }
    
    function handleProgressBarClick(e) {
        if (audioPlayer?.src) {
            const clickPosition = e.offsetX / progressBar.clientWidth;
            audioPlayer.currentTime = clickPosition * audioPlayer.duration;
        }
    }
    
    function updateProgress() {
        if (!audioPlayer) return;
        
        const currentTime = audioPlayer.currentTime;
        const duration = audioPlayer.duration || 1;
        const progressPercent = (currentTime / duration) * 100;
        
        progress.style.width = `${progressPercent}%`;
        waveProgress.style.width = `${progressPercent}%`;
        currentTimeDisplay.textContent = formatTime(currentTime);
        
        if (!isNaN(duration)) {
            durationDisplay.textContent = formatTime(duration);
        }
        
        // Update fullscreen player progress
        const fullscreenProgress = document.getElementById('fullscreen-progress');
        const fullscreenCurrentTime = document.getElementById('fullscreen-current-time');
        const fullscreenDuration = document.getElementById('fullscreen-duration');
        
        if (fullscreenProgress) {
            fullscreenProgress.style.width = `${progressPercent}%`;
        }
        if (fullscreenCurrentTime) {
            fullscreenCurrentTime.textContent = formatTime(currentTime);
        }
        if (fullscreenDuration && !isNaN(duration)) {
            fullscreenDuration.textContent = formatTime(duration);
        }
        
        // Update mobile expanded controls progress
        if (mobileProgress) {
            mobileProgress.style.width = `${progressPercent}%`;
        }
        if (mobileCurrentTimeDisplay) {
            mobileCurrentTimeDisplay.textContent = formatTime(currentTime);
        }
        if (mobileDurationDisplay && !isNaN(duration)) {
            mobileDurationDisplay.textContent = formatTime(duration);
        }
    }
    
    function handleSongEnd() {
        if (loopState === 1) { // Repeat one
            if (!hasLoopedOnce) {
                audioPlayer.currentTime = 0;
                audioPlayer.play();
                hasLoopedOnce = true;
            } else {
                playNext();
                hasLoopedOnce = false;
            }
        } else if (loopState === 2) { // Repeat all
            audioPlayer.currentTime = 0;
            audioPlayer.play();
        } else {
            playNext();
        }
    }
    
    function playSong(song) {
        if (!song) return;
        
        const downloads = song.downloadUrl || [];
        let audioUrl = null;
        
        // Try to find the best quality audio
        const qualityPriority = ["320kbps", "160kbps", "96kbps"];
        for (const quality of qualityPriority) {
            const cdn = downloads.find(dl => 
                dl.quality === quality && (dl.url.includes("aac.saavncdn.com") || dl.url.startsWith("http"))
            );
            if (cdn) {
                audioUrl = cdn.url;
                break;
            }
        }
        
        if (!audioUrl) {
            showSearchMessage("No playable audio found for this song");
            return;
        }
        
        // Update audio player
        audioPlayer.src = audioUrl;
        audioPlayer.volume = currentVolume;
        
        // Update UI
        const thumbnail = song.image?.find(img => img.quality === "500x500")?.url || 
                         song.image?.find(img => img.quality === "150x150")?.url || 
                         'music.gif';
        
        currentSongTitle.textContent = decodeHtmlEntities(song.name);
        currentSongArtist.textContent = decodeHtmlEntities(song.artists?.primary?.[0]?.name || "Unknown Artist");
        currentAlbumArt.src = thumbnail;
        
        // Update mobile expanded controls
        if (mobileCurrentSongTitle) mobileCurrentSongTitle.textContent = decodeHtmlEntities(song.name);
        if (mobileCurrentSongArtist) mobileCurrentSongArtist.textContent = decodeHtmlEntities(song.artists?.primary?.[0]?.name || "Unknown Artist");
        if (mobileCurrentAlbumArt) mobileCurrentAlbumArt.src = thumbnail;
        
        // Update fullscreen player
        const fullscreenTitle = document.getElementById('fullscreen-song-title');
        const fullscreenArtist = document.getElementById('fullscreen-song-artist');
        const fullscreenAlbumArt = document.getElementById('fullscreen-album-art');
        
        if (fullscreenTitle) fullscreenTitle.textContent = decodeHtmlEntities(song.name);
        if (fullscreenArtist) fullscreenArtist.textContent = decodeHtmlEntities(song.artists?.primary?.[0]?.name || "Unknown Artist");
        if (fullscreenAlbumArt) fullscreenAlbumArt.src = thumbnail;
        
        // Update like button
        updateLikeButton(song);
        
        // Add to recently played
        addToRecentlyPlayed(song);
        
        // Play the song
        audioPlayer.play()
            .then(() => {
                isPlaying = true;
                updatePlayPauseIcon();
                showSearchMessage(`Now playing: ${decodeHtmlEntities(song.name)}`);
            })
            .catch(error => {
                console.error("Playback error:", error);
                showSearchMessage("Playback error occurred");
            });
    }
    
    function playCurrentSong() {
        if (songs.length > 0 && currentSongIndex >= 0 && currentSongIndex < songs.length) {
            playSong(songs[currentSongIndex]);
        }
    }
    
    function toggleLikeSong(song) {
        const existingIndex = likedSongs.findIndex(s => s.id === song.id);
        
        if (existingIndex !== -1) {
            likedSongs.splice(existingIndex, 1);
            showToast(`Removed "${song.name}" from liked songs`, 'success');
        } else {
            likedSongs.unshift(song);
            showToast(`Added "${song.name}" to liked songs`, 'success');
        }
        
        saveLikedSongs();
        updateLikeButton();
    }
    
    function saveLikedSongs() {
        localStorage.setItem('likedSongs', JSON.stringify(likedSongs));
    }
    
    // UI update functions
    function updatePlayPauseIcon() {
        const icons = [
            playPauseBtn?.querySelector('i'),
            document.getElementById('fullscreen-play-pause')?.querySelector('i'),
            mobilePlayPauseBtn?.querySelector('i')
        ];
        
        icons.forEach(icon => {
            if (icon) {
                icon.className = isPlaying ? 'fas fa-pause' : 'fas fa-play';
            }
        });
    }
    
    function updateShuffleButton() {
        shuffleBtn?.classList.toggle('active', isShuffled);
        document.getElementById('fullscreen-shuffle')?.classList.toggle('active', isShuffled);
        mobileShuffleBtn?.classList.toggle('active', isShuffled);
    }
    
    function updateLoopButton() {
        const buttons = [loopBtn, document.getElementById('fullscreen-loop'), mobileLoopBtn];
        
        buttons.forEach(btn => {
            if (!btn) return;
            
            btn.classList.toggle('active', loopState > 0);
            
            switch(loopState) {
                case 0:
                    btn.innerHTML = '<i class="fas fa-repeat"></i>';
                    break;
                case 1:
                    btn.innerHTML = '<i class="fas fa-repeat"></i><span class="loop-count">1</span>';
                    break;
                case 2:
                    btn.innerHTML = '<i class="fas fa-infinity"></i>';
                    break;
            }
        });
    }
    
    function updateVolumeIcon() {
        const volumeButtons = [volumeBtn, mobileVolumeBtn];
        
        volumeButtons.forEach(btn => {
            if (!btn) return;
            
            if (audioPlayer?.volume === 0) {
                btn.innerHTML = '<i class="fas fa-volume-mute"></i>';
            } else if (audioPlayer.volume < 0.5) {
                btn.innerHTML = '<i class="fas fa-volume-down"></i>';
            } else {
                btn.innerHTML = '<i class="fas fa-volume-up"></i>';
            }
        });
    }
    
    function updateLikeButton(song) {
        const isLiked = isSongLiked(song);
        const buttons = [likeBtn, document.getElementById('fullscreen-like'), mobileLikeBtn];
        
        buttons.forEach(btn => {
            if (!btn) return;
            
            const icon = btn.querySelector('i');
            if (icon) {
                icon.className = isLiked ? 'fas fa-heart' : 'far fa-heart';
            }
            btn.classList.toggle('active', isLiked);
        });
    }
    
    // Liked songs functionality
    function toggleLike() {
        const song = songs[currentSongIndex];
        if (!song) return;
        
        const songId = getSongId(song);
        const isCurrentlyLiked = isSongLiked(song);
        
        if (isCurrentlyLiked) {
            likedSongs = likedSongs.filter(s => getSongId(s) !== songId);
        } else {
            likedSongs.unshift(song);
        }
        
        saveLikedSongs();
        updateLikeButton(song);
        
        // Update any open liked songs modal
        if (!likedSongsModal?.classList.contains('hidden')) {
            renderLikedSongsList();
        }
    }
    
    function getSongId(song) {
        return song.id || song._id || (song.name + '|' + (song.artists?.primary?.[0]?.name || ''));
    }
    
    function isSongLiked(song) {
        const id = getSongId(song);
        return likedSongs.some(s => getSongId(s) === id);
    }
    
    function saveLikedSongs() {
        localStorage.setItem('likedSongs', JSON.stringify(likedSongs));
    }
    
    function openLikedSongsModal() {
        renderLikedSongsList();
        likedSongsModal?.classList.remove('hidden');
    }
    
    function closeLikedSongsModal() {
        likedSongsModal?.classList.add('hidden');
    }
    
    function renderLikedSongsList() {
        const likedSongsList = document.getElementById('liked-songs-list');
        if (!likedSongsList) return;
        
        if (likedSongs.length === 0) {
            likedSongsList.innerHTML = '<div class="search-no-results">No liked songs yet!</div>';
            return;
        }
        
        likedSongsList.innerHTML = likedSongs.map((song, index) => 
            createTrackItem(song, index, true)
        ).join('');
        
        // Add event listeners
        setupLikedSongsListeners();
    }
    
    function setupLikedSongsListeners() {
        const likedSongsList = document.getElementById('liked-songs-list');
        if (!likedSongsList) return;
        
        likedSongsList.addEventListener('click', (e) => {
            const trackItem = e.target.closest('.track-item');
            if (!trackItem) return;
            
            const index = parseInt(trackItem.dataset.index);
            
            if (e.target.closest('.track-like-btn')) {
                // Unlike song
                const songId = getSongId(likedSongs[index]);
                likedSongs = likedSongs.filter(s => getSongId(s) !== songId);
                saveLikedSongs();
                renderLikedSongsList();
                
                // Update current song like status if it's the same song
                if (songs[currentSongIndex] && getSongId(songs[currentSongIndex]) === songId) {
                    updateLikeButton(songs[currentSongIndex]);
                }
            } else {
                // Play song
                songs = [...likedSongs];
                currentSongIndex = index;
                playSong(likedSongs[index]);
                closeLikedSongsModal();
            }
        });
    }
    
    // Playlist functionality
    function openCreatePlaylistModal() {
        const nameInput = document.getElementById('playlist-name');
        const descInput = document.getElementById('playlist-description');
        
        if (nameInput) nameInput.value = '';
        if (descInput) descInput.value = '';
        
        createPlaylistModal?.classList.remove('hidden');
        nameInput?.focus();
    }
    
    function closeCreatePlaylistModal() {
        createPlaylistModal?.classList.add('hidden');
    }
    
    function createPlaylist() {
        const nameInput = document.getElementById('playlist-name');
        const descInput = document.getElementById('playlist-description');
        
        const name = nameInput?.value.trim() || 'My Playlist #1';
        const description = descInput?.value.trim() || '';
        
        const newPlaylist = {
            id: Date.now().toString(),
            name,
            description,
            songs: [],
            createdAt: new Date().toISOString()
        };
        
        playlists.unshift(newPlaylist);
        savePlaylists();
        updatePlaylistsInSidebar();
        closeCreatePlaylistModal();
        showToast(`Playlist "${name}" created successfully!`, 'success');
    }
    
    function savePlaylists() {
        localStorage.setItem('playlists', JSON.stringify(playlists));
    }
    
    function updatePlaylistsInSidebar() {
        const playlistsList = document.getElementById('playlists-list');
        if (!playlistsList) return;
        
        playlistsList.innerHTML = playlists.map(playlist => `
            <li>
                <a href="#" class="playlist-item" data-playlist-id="${playlist.id}">
                    <div class="playlist-icon">
                        <i class="fas fa-music"></i>
                    </div>
                    <div class="playlist-info">
                        <div class="playlist-name">${playlist.name}</div>
                        <div class="playlist-count">${playlist.songs.length} songs</div>
                    </div>
                </a>
            </li>
        `).join('');
        
        // Add event listeners
        playlistsList.querySelectorAll('.playlist-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const playlistId = item.dataset.playlistId;
                const playlist = playlists.find(p => p.id === playlistId);
                if (playlist) {
                    loadPlaylistContent(playlist);
                }
            });
        });
    }
    
    function loadPlaylistContent(playlist) {
        // Switch to library section and show playlist
        navigateToSection('library');
        
        const libraryContent = document.getElementById('library-content');
        if (!libraryContent) return;
        
        libraryContent.innerHTML = `
            <div class="playlist-header">
                <div class="playlist-header-info">
                    <div class="playlist-icon large">
                        <i class="fas fa-music"></i>
                    </div>
                    <div class="playlist-details">
                        <span class="playlist-type">Playlist</span>
                        <h1 class="playlist-title">${playlist.name}</h1>
                        <p class="playlist-description">${playlist.description || 'No description'}</p>
                        <div class="playlist-meta">
                            <span>${playlist.songs.length} songs</span>
                        </div>
                    </div>
                </div>
                <div class="playlist-actions">
                    <button class="btn primary play-playlist-btn" ${playlist.songs.length === 0 ? 'disabled' : ''}>
                        <i class="fas fa-play"></i>
                        Play
                    </button>
                    <button class="btn secondary delete-playlist-btn" data-playlist-id="${playlist.id}">
                        <i class="fas fa-trash"></i>
                        Delete
                    </button>
                </div>
            </div>
            <div class="songs-section">
                <div class="songs-grid" id="playlist-songs">
                    ${playlist.songs.length === 0 ? 
                        '<div class="empty-state"><i class="fas fa-music"></i><p>No songs in this playlist</p><p>Search for songs and add them to this playlist</p></div>' :
                        playlist.songs.map((song, index) => `
                            <div class="song-item" data-song-index="${index}">
                                <div class="song-play-btn">
                                    <i class="fas fa-play"></i>
                                </div>
                                <img src="${song.image || 'music.gif'}" alt="${song.name}" class="song-image">
                                <div class="song-info">
                                    <div class="song-title">${song.name}</div>
                                    <div class="song-artist">${song.artist || 'Unknown Artist'}</div>
                                </div>
                                <div class="song-actions">
                                    <button class="btn-icon remove-from-playlist-btn" data-song-index="${index}">
                                        <i class="fas fa-times"></i>
                                    </button>
                                </div>
                            </div>
                        `).join('')
                    }
                </div>
            </div>
        `;
        
        // Add event listeners for playlist actions
        const playPlaylistBtn = libraryContent.querySelector('.play-playlist-btn');
        const deletePlaylistBtn = libraryContent.querySelector('.delete-playlist-btn');
        const removeBtns = libraryContent.querySelectorAll('.remove-from-playlist-btn');
        const songItems = libraryContent.querySelectorAll('.song-item');
        
        playPlaylistBtn?.addEventListener('click', () => {
            if (playlist.songs.length > 0) {
                songs = playlist.songs;
                currentSongIndex = 0;
                playCurrentSong();
                showToast(`Playing "${playlist.name}"`, 'success');
            }
        });
        
        deletePlaylistBtn?.addEventListener('click', () => {
            if (confirm(`Are you sure you want to delete "${playlist.name}"?`)) {
                const playlistIndex = playlists.findIndex(p => p.id === playlist.id);
                if (playlistIndex !== -1) {
                    playlists.splice(playlistIndex, 1);
                    savePlaylists();
                    updatePlaylistsInSidebar();
                    loadLibraryContent(); // Go back to main library
                    showToast(`Playlist "${playlist.name}" deleted`, 'success');
                }
            }
        });
        
        removeBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const songIndex = parseInt(btn.dataset.songIndex);
                const playlistIndex = playlists.findIndex(p => p.id === playlist.id);
                if (playlistIndex !== -1 && playlist.songs[songIndex]) {
                    const removedSong = playlist.songs[songIndex];
                    playlists[playlistIndex].songs.splice(songIndex, 1);
                    savePlaylists();
                    updatePlaylistsInSidebar();
                    loadPlaylistContent(playlists[playlistIndex]); // Refresh the view
                    showToast(`Removed "${removedSong.name}" from playlist`, 'success');
                }
            });
        });
        
        songItems.forEach((item, index) => {
            item.addEventListener('click', () => {
                songs = playlist.songs;
                currentSongIndex = index;
                playCurrentSong();
            });
        });
    }
    
    // Home content
    function loadHomeContent() {
        setGreeting();
        loadQuickPicks();
        loadRecentlyPlayed();
    }
    
    function setGreeting() {
        const hour = new Date().getHours();
        let greeting = 'Good evening';
        
        if (hour < 12) greeting = 'Good morning';
        else if (hour < 17) greeting = 'Good afternoon';
        
        const header = document.querySelector('#home-section .section-header h2');
        if (header) header.textContent = greeting;
    }
    
    function loadQuickPicks() {
        const quickPicksGrid = document.getElementById('quick-picks-grid');
        if (!quickPicksGrid) return;
        
        // Create some featured content cards
        const quickPicks = [
            { title: 'Liked Songs', subtitle: `${likedSongs.length} liked songs`, image: 'music.gif', action: () => openLikedSongsModal() },
            { title: 'Recently Played', subtitle: 'Jump back in', image: 'music.gif', action: () => loadRecentlyPlayedSection() }
        ];
        
        quickPicksGrid.innerHTML = quickPicks.map(pick => `
            <div class="card quick-pick-card" data-title="${pick.title}">
                <img src="${pick.image}" alt="${pick.title}" class="card-image">
                <div class="card-title">${pick.title}</div>
                <div class="card-subtitle">${pick.subtitle}</div>
            </div>
        `).join('');
        
        // Add event listeners
        quickPicksGrid.querySelectorAll('.quick-pick-card').forEach(card => {
            card.addEventListener('click', () => {
                const title = card.dataset.title;
                const pick = quickPicks.find(p => p.title === title);
                if (pick && pick.action) pick.action();
            });
        });
    }
    
    function loadRecentlyPlayed() {
        const recentlyPlayedGrid = document.getElementById('recently-played-grid');
        if (!recentlyPlayedGrid) return;
        
        if (recentlyPlayed.length === 0) {
            recentlyPlayedGrid.innerHTML = '<p class="text-muted">No recently played songs</p>';
            return;
        }
        
        recentlyPlayedGrid.innerHTML = recentlyPlayed.slice(0, 6).map(song => `
            <div class="card song-card" data-song-index="${recentlyPlayed.indexOf(song)}">
                <img src="${song.image?.find(img => img.quality === '500x500')?.url || 'music.gif'}" alt="${song.name}" class="card-image">
                <div class="card-title">${decodeHtmlEntities(song.name)}</div>
                <div class="card-subtitle">${decodeHtmlEntities(song.artists?.primary?.[0]?.name || 'Unknown Artist')}</div>
            </div>
        `).join('');
        
        // Add event listeners
        recentlyPlayedGrid.querySelectorAll('.song-card').forEach(card => {
            card.addEventListener('click', () => {
                const songIndex = parseInt(card.dataset.songIndex);
                const song = recentlyPlayed[songIndex];
                if (song) {
                    songs = [...recentlyPlayed];
                    currentSongIndex = songIndex;
                    playSong(song);
                }
            });
        });
    }
    
    function loadRecentlyPlayedSection() {
        // Navigate to recently played view (we can implement this as a library section)
        navigateToSection('library');
        
        const libraryContent = document.getElementById('library-content');
        if (!libraryContent) return;
        
        libraryContent.innerHTML = `
            <div class="section-header">
                <h2>Recently Played</h2>
            </div>
            <div class="songs-grid" id="recently-played-songs">
                ${recentlyPlayed.length === 0 ? 
                    '<div class="empty-state"><i class="fas fa-clock"></i><p>No recently played songs</p><p>Start listening to see your recent tracks here</p></div>' :
                    recentlyPlayed.map((song, index) => `
                        <div class="song-item" data-song-index="${index}">
                            <div class="song-play-btn">
                                <i class="fas fa-play"></i>
                            </div>
                            <img src="${song.image?.find(img => img.quality === '500x500')?.url || 'music.gif'}" alt="${song.name}" class="song-image">
                            <div class="song-info">
                                <div class="song-title">${decodeHtmlEntities(song.name)}</div>
                                <div class="song-artist">${decodeHtmlEntities(song.artists?.primary?.[0]?.name || 'Unknown Artist')}</div>
                            </div>
                            <div class="song-actions">
                                <button class="btn-icon like-btn ${likedSongs.find(s => s.id === song.id) ? 'liked' : ''}" data-song-id="${song.id}">
                                    <i class="fas fa-heart"></i>
                                </button>
                                <button class="btn-icon add-to-playlist-btn" data-song-index="${index}">
                                    <i class="fas fa-plus"></i>
                                </button>
                            </div>
                        </div>
                    `).join('')
                }
            </div>
        `;
        
        // Add event listeners
        const songItems = libraryContent.querySelectorAll('.song-item');
        const likeBtns = libraryContent.querySelectorAll('.like-btn');
        const addToPlaylistBtns = libraryContent.querySelectorAll('.add-to-playlist-btn');
        
        songItems.forEach((item, index) => {
            item.addEventListener('click', (e) => {
                if (!e.target.closest('.song-actions')) {
                    songs = [...recentlyPlayed];
                    currentSongIndex = index;
                    playCurrentSong();
                }
            });
        });
        
        likeBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const songId = btn.dataset.songId;
                const song = recentlyPlayed.find(s => s.id === songId);
                if (song) {
                    toggleLikeSong(song);
                    btn.classList.toggle('liked');
                }
            });
        });
        
        addToPlaylistBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const songIndex = parseInt(btn.dataset.songIndex);
                const song = recentlyPlayed[songIndex];
                if (song) {
                    openAddToPlaylistModal(song);
                }
            });
        });
    }
    
    function addToRecentlyPlayed(song) {
        if (!song) return;
        
        // Remove if already exists
        const songId = getSongId(song);
        recentlyPlayed = recentlyPlayed.filter(s => getSongId(s) !== songId);
        
        // Add to beginning
        recentlyPlayed.unshift(song);
        
        // Keep only last 50 songs
        recentlyPlayed = recentlyPlayed.slice(0, 50);
        
        // Save to localStorage
        localStorage.setItem('recentlyPlayed', JSON.stringify(recentlyPlayed));
    }
    
    // Library content
    function loadLibraryContent() {
        const libraryContent = document.getElementById('library-content');
        if (!libraryContent) return;
        
        // Setup filter buttons
        const filterBtns = document.querySelectorAll('.filter-btn');
        filterBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                filterBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                const filter = btn.dataset.filter;
                displayLibraryContent(filter);
            });
        });
        
        // Load default content (all)
        displayLibraryContent('all');
    }
    
    function displayLibraryContent(filter) {
        const libraryContent = document.getElementById('library-content');
        if (!libraryContent) return;
        
        let content = '';
        
        switch (filter) {
            case 'playlists':
                content = displayPlaylistsInLibrary();
                break;
            case 'liked':
                content = displayLikedSongsInLibrary();
                break;
            default:
                content = displayAllLibraryContent();
        }
        
        libraryContent.innerHTML = content;
        setupLibraryEventListeners();
    }
    
    function displayAllLibraryContent() {
        let content = '';
        
        // Add liked songs if any
        if (likedSongs.length > 0) {
            content += `
                <div class="library-section">
                    <div class="library-item liked-songs-item">
                        <div class="library-item-icon liked-songs-icon">
                            <i class="fas fa-heart"></i>
                        </div>
                        <div class="library-item-info">
                            <div class="library-item-title">Liked Songs</div>
                            <div class="library-item-subtitle">${likedSongs.length} songs</div>
                        </div>
                    </div>
                </div>
            `;
        }
        
        // Add playlists if any
        if (playlists.length > 0) {
            content += `
                <div class="library-section">
                    <h4>Your Playlists</h4>
                    ${playlists.map(playlist => `
                        <div class="library-item playlist-item" data-playlist-id="${playlist.id}">
                            <div class="library-item-icon">
                                <i class="fas fa-music"></i>
                            </div>
                            <div class="library-item-info">
                                <div class="library-item-title">${playlist.name}</div>
                                <div class="library-item-subtitle">${playlist.songs.length} songs</div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
        }
        
        if (!content) {
            content = '<div class="library-empty">Your library is empty. Start by liking some songs or creating playlists!</div>';
        }
        
        return content;
    }
    
    function displayPlaylistsInLibrary() {
        if (playlists.length === 0) {
            return '<div class="library-empty">No playlists yet. Create your first playlist!</div>';
        }
        
        return playlists.map(playlist => `
            <div class="library-item playlist-item" data-playlist-id="${playlist.id}">
                <div class="library-item-icon">
                    <i class="fas fa-music"></i>
                </div>
                <div class="library-item-info">
                    <div class="library-item-title">${playlist.name}</div>
                    <div class="library-item-subtitle">${playlist.songs.length} songs</div>
                </div>
            </div>
        `).join('');
    }
    
    function displayLikedSongsInLibrary() {
        if (likedSongs.length === 0) {
            return '<div class="library-empty">No liked songs yet!</div>';
        }
        
        return `
            <div class="track-list">
                ${likedSongs.map((song, index) => createTrackItem(song, index, true)).join('')}
            </div>
        `;
    }
    
    function setupLibraryEventListeners() {
        const libraryContent = document.getElementById('library-content');
        if (!libraryContent) return;
        
        // Liked songs item
        const likedSongsItem = libraryContent.querySelector('.liked-songs-item');
        if (likedSongsItem) {
            likedSongsItem.addEventListener('click', openLikedSongsModal);
        }
        
        // Playlist items
        libraryContent.querySelectorAll('.playlist-item').forEach(item => {
            item.addEventListener('click', () => {
                const playlistId = item.dataset.playlistId;
                const playlist = playlists.find(p => p.id === playlistId);
                if (playlist) {
                    loadPlaylistContent(playlist);
                }
            });
        });
        
        // Track items in liked songs view
        libraryContent.querySelectorAll('.track-item').forEach(item => {
            item.addEventListener('click', (e) => {
                if (e.target.closest('.track-like-btn')) {
                    // Handle unlike
                    const index = parseInt(item.dataset.index);
                    const songId = getSongId(likedSongs[index]);
                    likedSongs = likedSongs.filter(s => getSongId(s) !== songId);
                    saveLikedSongs();
                    displayLibraryContent('liked');
                } else {
                    // Play song
                    const index = parseInt(item.dataset.index);
                    songs = [...likedSongs];
                    currentSongIndex = index;
                    playSong(likedSongs[index]);
                }
            });
        });
    }
    
    // Fullscreen player
    function openFullscreenPlayer() {
        fullscreenPlayer?.classList.remove('hidden');
        
        // Setup fullscreen controls
        const fullscreenPlayPause = document.getElementById('fullscreen-play-pause');
        const fullscreenPrev = document.getElementById('fullscreen-prev');
        const fullscreenNext = document.getElementById('fullscreen-next');
        const fullscreenShuffle = document.getElementById('fullscreen-shuffle');
        const fullscreenLoop = document.getElementById('fullscreen-loop');
        const fullscreenLike = document.getElementById('fullscreen-like');
        const fullscreenProgressBar = document.getElementById('fullscreen-progress-bar');
        
        fullscreenPlayPause?.addEventListener('click', togglePlayPause);
        fullscreenPrev?.addEventListener('click', playPrevious);
        fullscreenNext?.addEventListener('click', playNext);
        fullscreenShuffle?.addEventListener('click', toggleShuffle);
        fullscreenLoop?.addEventListener('click', toggleLoop);
        fullscreenLike?.addEventListener('click', toggleLike);
        fullscreenProgressBar?.addEventListener('click', (e) => {
            if (audioPlayer?.src) {
                const clickPosition = e.offsetX / fullscreenProgressBar.clientWidth;
                audioPlayer.currentTime = clickPosition * audioPlayer.duration;
            }
        });
    }
    
    function closeFullscreenPlayer() {
        fullscreenPlayer?.classList.add('hidden');
    }
    
    // Utility functions
    function createTrackItem(song, index, showLikeButton = false) {
        const thumbnail = song.image?.find(img => img.quality === '150x150')?.url || 
                         song.image?.find(img => img.quality === '500x500')?.url || 
                         'music.gif';
        
        const isCurrentSong = songs[currentSongIndex] === song && isPlaying;
        const isLiked = isSongLiked(song);
        
        return `
            <div class="track-item ${isCurrentSong ? 'playing' : ''}" data-index="${index}">
                <div class="track-number">${index + 1}</div>
                <div class="track-play-btn">
                    <i class="fas fa-${isCurrentSong ? 'pause' : 'play'}"></i>
                </div>
                <img src="${thumbnail}" alt="Album Art" class="track-image" onerror="this.src='music.gif'">
                <div class="track-details">
                    <div class="track-title">${decodeHtmlEntities(song.name)}</div>
                    <div class="track-artist">${decodeHtmlEntities(song.artists?.primary?.[0]?.name || 'Unknown Artist')}</div>
                </div>
                <div class="track-actions">
                    <button class="track-action-btn like-btn ${isLiked ? 'active' : ''}" title="${isLiked ? 'Remove from Liked Songs' : 'Add to Liked Songs'}" data-action="like">
                        <i class="fas fa-heart"></i>
                    </button>
                    <button class="track-action-btn" title="Add to Playlist" data-action="add-to-playlist">
                        <i class="fas fa-plus"></i>
                    </button>
                    <button class="track-action-btn" title="More options" data-action="more">
                        <i class="fas fa-ellipsis-h"></i>
                    </button>
                </div>
                ${showLikeButton ? '<button class="track-like-btn icon-btn active"><i class="fas fa-heart"></i></button>' : ''}
                <div class="track-duration">3:45</div>
            </div>
        `;
    }
    
    function setupTrackListeners(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        container.addEventListener('click', (e) => {
            e.stopPropagation();
            
            const trackItem = e.target.closest('.track-item');
            if (!trackItem) return;
            
            const index = parseInt(trackItem.dataset.index);
            const song = songs[index];
            
            // Handle action buttons
            if (e.target.closest('.track-action-btn')) {
                const action = e.target.closest('.track-action-btn').dataset.action;
                handleTrackAction(action, song, e);
                return;
            }
            
            // Handle track click (play/pause)
            if (songs[currentSongIndex] === song && audioPlayer.src) {
                togglePlayPause();
            } else {
                currentSongIndex = index;
                playSong(song);
            }
        });
    }
    
    function handleTrackAction(action, song, event) {
        event.stopPropagation();
        
        switch (action) {
            case 'like':
                toggleSongLike(song);
                // Update the button immediately
                const likeBtn = event.target.closest('.track-action-btn');
                const isLiked = isSongLiked(song);
                likeBtn.classList.toggle('active', isLiked);
                likeBtn.title = isLiked ? 'Remove from Liked Songs' : 'Add to Liked Songs';
                break;
                
            case 'add-to-playlist':
                openAddToPlaylistModal(song);
                break;
                
            case 'more':
                contextMenuSong = song;
                showContextMenu(event.clientX, event.clientY);
                break;
        }
    }
    
    // Toast Notification System
    function showToast(message, type = 'info', duration = 3000) {
        const toastContainer = document.getElementById('toast-container') || document.body;
        
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        const icons = {
            success: 'fa-check-circle',
            error: 'fa-exclamation-circle',
            info: 'fa-info-circle'
        };
        
        toast.innerHTML = `
            <i class="fas ${icons[type] || icons.info}"></i>
            <span>${message}</span>
        `;
        
        toastContainer.appendChild(toast);
        
        // Show toast
        setTimeout(() => toast.classList.add('show'), 100);
        
        // Hide and remove toast
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toastContainer.removeChild(toast), 300);
        }, duration);
    }
    
    // Utility Functions
    function copyToClipboard(text) {
        if (navigator.clipboard) {
            navigator.clipboard.writeText(text);
        } else {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = text;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
        }
    }
    
    function formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${minutes}:${secs.toString().padStart(2, '0')}`;
    }
    
    function decodeHtmlEntities(text) {
        if (!text) return '';
        const textArea = document.createElement('textarea');
        textArea.innerHTML = text;
        return textArea.value;
    }
    
    function closeAllModals() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.classList.add('hidden');
        });
        closeFullscreenPlayer();
    }
    
    function handleOutsideClick(e) {
        // Close search dropdown
        if (!searchDropdown?.contains(e.target) && 
            !searchInput?.contains(e.target) && 
            !searchBtn?.contains(e.target)) {
            hideSearchDropdown();
        }
        
        // Close mobile sidebar
        if (window.innerWidth <= 768 && sidebar?.classList.contains('open')) {
            if (!sidebar.contains(e.target) && 
                !document.getElementById('mobile-menu-toggle')?.contains(e.target)) {
                closeMobileSidebar();
            }
        }
        
        // Close mobile expanded controls
        if (window.innerWidth <= 768 && mobileExpandedControls?.classList.contains('show')) {
            if (!mobileExpandedControls.contains(e.target) && 
                !mobileExpandBtn?.contains(e.target)) {
                closeMobileExpandedControls();
            }
        }
    }
    
    // Context Menu Functions
    function handleContextMenu(e) {
        const trackItem = e.target.closest('.track-item');
        if (trackItem) {
            e.preventDefault();
            const index = parseInt(trackItem.dataset.index);
            contextMenuSong = songs[index];
            contextMenuPosition = { x: e.clientX, y: e.clientY };
            showContextMenu(e.clientX, e.clientY);
        }
    }
    
    function showContextMenu(x, y) {
        if (!songContextMenu || !contextMenuSong) return;
        
        // Update like/unlike text
        const likeItem = songContextMenu.querySelector('[data-action="like"]');
        if (likeItem) {
            const isLiked = isSongLiked(contextMenuSong);
            likeItem.innerHTML = isLiked ? 
                '<i class="fas fa-heart-broken"></i><span>Remove from Liked Songs</span>' :
                '<i class="fas fa-heart"></i><span>Add to Liked Songs</span>';
        }
        
        songContextMenu.style.left = `${x}px`;
        songContextMenu.style.top = `${y}px`;
        songContextMenu.classList.remove('hidden');
        
        // Adjust position if menu goes off screen
        const menuRect = songContextMenu.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        
        if (menuRect.right > viewportWidth) {
            songContextMenu.style.left = `${x - menuRect.width}px`;
        }
        
        if (menuRect.bottom > viewportHeight) {
            songContextMenu.style.top = `${y - menuRect.height}px`;
        }
        
        // Add event listeners to menu items
        setupContextMenuListeners();
    }
    
    function hideContextMenu() {
        songContextMenu?.classList.add('hidden');
        contextMenuSong = null;
    }
    
    function setupContextMenuListeners() {
        if (!songContextMenu) return;
        
        songContextMenu.querySelectorAll('.context-menu-item').forEach(item => {
            item.onclick = (e) => {
                e.stopPropagation();
                handleContextMenuAction(item.dataset.action);
                hideContextMenu();
            };
        });
    }
    
    function handleContextMenuAction(action) {
        if (!contextMenuSong) return;
        
        switch (action) {
            case 'play':
                const songIndex = songs.indexOf(contextMenuSong);
                if (songIndex !== -1) {
                    currentSongIndex = songIndex;
                    playSong(contextMenuSong);
                }
                break;
                
            case 'add-to-queue':
                // Add to queue functionality (for future implementation)
                showToast('Added to queue', 'success');
                break;
                
            case 'add-to-playlist':
                openAddToPlaylistModal(contextMenuSong);
                break;
                
            case 'like':
                toggleSongLike(contextMenuSong);
                break;
                
            case 'copy-link':
                // Copy song link functionality
                copyToClipboard(`VibeVerse Song: ${contextMenuSong.name} by ${contextMenuSong.artists?.primary?.[0]?.name || 'Unknown'}`);
                showToast('Song link copied to clipboard', 'success');
                break;
        }
    }
    
    // Add to Playlist Functions
    function openAddToPlaylistModal(song) {
        if (!addToPlaylistModal || !song) return;
        
        contextMenuSong = song;
        
        // Update modal with song info
        const songImage = document.getElementById('add-to-playlist-image');
        const songTitle = document.getElementById('add-to-playlist-title');
        const songArtist = document.getElementById('add-to-playlist-artist');
        
        if (songImage) {
            songImage.src = song.image?.find(img => img.quality === '150x150')?.url || 
                           song.image?.find(img => img.quality === '500x500')?.url || 
                           'music.gif';
        }
        if (songTitle) songTitle.textContent = decodeHtmlEntities(song.name);
        if (songArtist) songArtist.textContent = decodeHtmlEntities(song.artists?.primary?.[0]?.name || 'Unknown Artist');
        
        // Render playlist options
        renderPlaylistOptions();
        
        addToPlaylistModal.classList.remove('hidden');
    }
    
    function closeAddToPlaylistModal() {
        addToPlaylistModal?.classList.add('hidden');
        contextMenuSong = null;
    }
    
    function renderPlaylistOptions() {
        const existingPlaylists = document.getElementById('existing-playlists');
        if (!existingPlaylists) return;
        
        if (playlists.length === 0) {
            existingPlaylists.innerHTML = '<p class="text-muted">No playlists created yet. Create your first playlist!</p>';
            return;
        }
        
        existingPlaylists.innerHTML = playlists.map(playlist => `
            <div class="playlist-option" data-playlist-id="${playlist.id}">
                <div class="playlist-option-icon">
                    <i class="fas fa-music"></i>
                </div>
                <div class="playlist-option-info">
                    <div class="playlist-option-name">${playlist.name}</div>
                    <div class="playlist-option-count">${playlist.songs.length} songs</div>
                </div>
            </div>
        `).join('');
        
        // Add event listeners
        existingPlaylists.querySelectorAll('.playlist-option').forEach(option => {
            option.addEventListener('click', () => {
                const playlistId = option.dataset.playlistId;
                addSongToPlaylist(playlistId, contextMenuSong);
            });
        });
    }
    
    function addSongToPlaylist(playlistId, song) {
        if (!song) return;
        
        const playlist = playlists.find(p => p.id === playlistId);
        if (!playlist) return;
        
        // Check if song already exists in playlist
        const songId = getSongId(song);
        const songExists = playlist.songs.some(s => getSongId(s) === songId);
        
        if (songExists) {
            showToast(`Song already in "${playlist.name}"`, 'info');
        } else {
            playlist.songs.push(song);
            savePlaylists();
            updatePlaylistsInSidebar();
            showToast(`Added to "${playlist.name}"`, 'success');
        }
        
        closeAddToPlaylistModal();
    }
    
    function toggleSongLike(song) {
        const songId = getSongId(song);
        const isCurrentlyLiked = isSongLiked(song);
        
        if (isCurrentlyLiked) {
            likedSongs = likedSongs.filter(s => getSongId(s) !== songId);
            showToast('Removed from Liked Songs', 'info');
        } else {
            likedSongs.unshift(song);
            showToast('Added to Liked Songs', 'success');
        }
        
        saveLikedSongs();
        
        // Update current song like status if it's the same song
        if (songs[currentSongIndex] && getSongId(songs[currentSongIndex]) === songId) {
            updateLikeButton(songs[currentSongIndex]);
        }
        
        // Update any open liked songs modal
        if (!likedSongsModal?.classList.contains('hidden')) {
            renderLikedSongsList();
        }
    }
    
    function handleGlobalKeyboard(e) {
        if (e.target.tagName.toLowerCase() === 'input' || 
            e.target.tagName.toLowerCase() === 'textarea') {
            return; // Don't handle shortcuts when typing
        }
        
        switch (e.code) {
            case 'Space':
                e.preventDefault();
                togglePlayPause();
                break;
            case 'ArrowLeft':
                if (e.ctrlKey || e.metaKey) {
                    e.preventDefault();
                    playPrevious();
                }
                break;
            case 'ArrowRight':
                if (e.ctrlKey || e.metaKey) {
                    e.preventDefault();
                    playNext();
                }
                break;
            case 'KeyL':
                if (e.ctrlKey || e.metaKey) {
                    e.preventDefault();
                    toggleLike();
                }
                break;
        }
    }
});
