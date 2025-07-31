document.addEventListener('DOMContentLoaded', function() {
    // Back to Home button logic
    const backHomeBtn = document.getElementById('back-home-btn');
    if (backHomeBtn) {
        backHomeBtn.addEventListener('click', function() {
            window.location.reload();
        });
    }
    const musicPlayer = document.getElementById('music-player');
    const themeToggle = document.getElementById('theme-toggle');
    const searchInput = document.getElementById('search-input');
    const searchBtn = document.getElementById('search-btn');
    const albumArt = document.getElementById('album-art');
    const songTitle = document.getElementById('song-title');
    const songArtist = document.getElementById('song-artist');
    const progressBar = document.getElementById('progress-bar');
    const progress = document.getElementById('progress');
    const waveProgress = document.getElementById('wave-progress');
    const currentTimeDisplay = document.getElementById('current-time');
    const durationDisplay = document.getElementById('duration');
    const playPauseBtn = document.getElementById('play-pause-btn');
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    const audioPlayer = document.getElementById('audio-player');
    const loopBtn = document.getElementById('loop-btn');
    const volumeBtn = document.getElementById('volume-btn');
    const volumeSlider = document.getElementById('volume-slider');
    const searchDropdown = document.getElementById('search-dropdown');
    const dropdownResults = document.getElementById('dropdown-results');
    const likeBtn = document.getElementById('like-btn');
    const likedSongsBtn = document.getElementById('liked-songs-btn');
    let currentSongIndex = 0;
    let songs = [];
    let isPlaying = false;
    let loopState = 0;
    let hasLoopedOnce = false;
    let isTypingInSearch = false;
    let customSongs = [];
    let currentVolume = 0.5;
    let searchTimeout = null;
    let selectedDropdownIndex = -1;
    let likedSongs = JSON.parse(localStorage.getItem('likedSongs') || '[]');
    let showingLikedSongs = false;
    // --- Liked Songs Feature ---
    function getSongId(song) {
        // Use a unique property for id, fallback to name+artist
        return song.id || song._id || (song.name + '|' + (song.artists?.primary?.[0]?.name || ''));
    }

    function isSongLiked(song) {
        const id = getSongId(song);
        return likedSongs.some(s => getSongId(s) === id);
    }

    function updateLikeBtn(song) {
        if (!likeBtn) return;
        if (song && audioPlayer.src) {
            likeBtn.classList.add('active');
            if (isSongLiked(song)) {
                likeBtn.querySelector('i').classList.remove('fa-regular');
                likeBtn.querySelector('i').classList.add('fa-solid');
            } else {
                likeBtn.querySelector('i').classList.remove('fa-solid');
                likeBtn.querySelector('i').classList.add('fa-regular');
            }
        } else {
            likeBtn.classList.remove('active');
        }
        // Also update modal list if open
        if (typeof renderLikedSongsList === 'function' && likedSongsModal && !likedSongsModal.classList.contains('hidden')) {
            renderLikedSongsList();
        }
    }

    function saveLikedSongs() {
        localStorage.setItem('likedSongs', JSON.stringify(likedSongs));
    }

    if (likeBtn) {
        likeBtn.addEventListener('click', function() {
            const song = songs[currentSongIndex];
            if (!song) return;
            const id = getSongId(song);
            if (isSongLiked(song)) {
                likedSongs = likedSongs.filter(s => getSongId(s) !== id);
            } else {
                likedSongs.unshift(song);
            }
            saveLikedSongs();
            updateLikeBtn(song);
        });
    }

    // --- Modal logic ---
    const likedSongsModal = document.getElementById('liked-songs-modal');
    const likedSongsList = document.getElementById('liked-songs-list');
    const closeLikedSongs = document.getElementById('close-liked-songs');

    function openLikedSongsModal() {
        if (!likedSongsModal) return;
        renderLikedSongsList();
        likedSongsModal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    }

    function closeLikedSongsModal() {
        if (!likedSongsModal) return;
        likedSongsModal.classList.add('hidden');
        document.body.style.overflow = '';
    }

    if (likedSongsBtn) {
        likedSongsBtn.addEventListener('click', function() {
            openLikedSongsModal();
        });
    }
    if (closeLikedSongs) {
        closeLikedSongs.addEventListener('click', closeLikedSongsModal);
    }
    window.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && likedSongsModal && !likedSongsModal.classList.contains('hidden')) {
            closeLikedSongsModal();
        }
    });

    function renderLikedSongsList() {
        if (!likedSongsList) return;
        likedSongsList.innerHTML = '';
        if (likedSongs.length === 0) {
            likedSongsList.innerHTML = '<div class="liked-songs-list-empty">No liked songs yet!</div>';
            return;
        }
        likedSongs.forEach((song, idx) => {
            const item = document.createElement('div');
            item.className = 'liked-song-item';
            item.title = song.name;
            // Play on click (not on heart click)
            item.addEventListener('click', (e) => {
                if (e.target.closest('.liked-song-like-btn')) return;
                songs = [...likedSongs];
                currentSongIndex = idx;
                playSong(song);
                closeLikedSongsModal();
            });
            const thumb = song.image?.find(img => img.quality === '150x150')?.url || song.image?.find(img => img.quality === '500x500')?.url || 'music.gif';
            item.innerHTML = `
                <img class="liked-song-thumb" src="${thumb}" alt="Album Art" onerror="this.src='music.gif'">
                <div class="liked-song-info">
                  <div class="liked-song-title">${decodeHtmlEntities(song.name)}</div>
                  <div class="liked-song-artist">${decodeHtmlEntities(song.artists?.primary?.[0]?.name || 'Unknown')}</div>
                </div>
                <button class="liked-song-like-btn liked" title="Remove from liked"><i class="fa-solid fa-heart"></i></button>
            `;
            // Remove from liked
            item.querySelector('.liked-song-like-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                const id = getSongId(song);
                likedSongs = likedSongs.filter(s => getSongId(s) !== id);
                saveLikedSongs();
                renderLikedSongsList();
                // If currently playing song is unliked, update likeBtn
                if (songs[currentSongIndex] && getSongId(songs[currentSongIndex]) === id) {
                    updateLikeBtn(songs[currentSongIndex]);
                }
            });
            likedSongsList.appendChild(item);
        });
    }

    function loadCustomSongs() {
        const script = document.createElement('script');
        script.src = 'custom.js';
        script.onload = function() {
            customSongs = window.customSongs || [];
        };
        document.head.appendChild(script);
    }
    loadCustomSongs();

    // Initialize volume
    audioPlayer.volume = currentVolume;
    volumeSlider.value = currentVolume * 100;    searchInput.addEventListener('focus', function() {
        isTypingInSearch = true;
    });

    searchInput.addEventListener('blur', function() {
        isTypingInSearch = false;
        // Hide dropdown after a short delay to allow clicking on results
        setTimeout(() => {
            if (!searchDropdown.contains(document.activeElement)) {
                hideSearchDropdown();
            }
        }, 200);
    });

    // Real-time search as user types
    searchInput.addEventListener('input', function() {
        const query = this.value.trim();
        selectedDropdownIndex = -1;
        
        if (searchTimeout) {
            clearTimeout(searchTimeout);
        }
        
        if (query.length < 2) {
            hideSearchDropdown();
            return;
        }
        
        // Debounce search to avoid too many API calls
        searchTimeout = setTimeout(() => {
            performSearch(query, true);
        }, 300);
    });

    // Handle keyboard navigation in dropdown
    searchInput.addEventListener('keydown', function(e) {
        const dropdownItems = searchDropdown.querySelectorAll('.dropdown-item');
        
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            selectedDropdownIndex = Math.min(selectedDropdownIndex + 1, dropdownItems.length - 1);
            updateDropdownSelection(dropdownItems);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            selectedDropdownIndex = Math.max(selectedDropdownIndex - 1, -1);
            updateDropdownSelection(dropdownItems);
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (selectedDropdownIndex >= 0 && dropdownItems[selectedDropdownIndex]) {
                dropdownItems[selectedDropdownIndex].click();
            } else {
                performSearch(this.value.trim(), false);
            }
        } else if (e.key === 'Escape') {
            hideSearchDropdown();
            this.blur();
        }
    });

    // Hide dropdown when clicking outside
    document.addEventListener('click', function(e) {
        if (!searchDropdown.contains(e.target) && !searchInput.contains(e.target) && !searchBtn.contains(e.target)) {
            hideSearchDropdown();
        }
    });
    
    themeToggle.addEventListener('click', function() {
        musicPlayer.classList.toggle('dark-mode');
        musicPlayer.classList.toggle('light-mode');
        const icon = themeToggle.querySelector('i');
        if (musicPlayer.classList.contains('light-mode')) {
            icon.classList.remove('fa-moon');
            icon.classList.add('fa-sun');
        } else {
            icon.classList.remove('fa-sun');
            icon.classList.add('fa-moon');
        }
    });
      searchBtn.addEventListener('click', function() {
        const query = searchInput.value.trim();
        if (query) {
            performSearch(query, false);
        }
    });
    
    searchInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter' && selectedDropdownIndex === -1) {
            performSearch(this.value.trim(), false);
        }
    });
      loopBtn.addEventListener('click', function() {
        loopState = (loopState + 1) % 3;
        hasLoopedOnce = false;
        updateLoopButton();
    });

    // Volume control event listeners
    volumeBtn.addEventListener('click', function() {
        if (audioPlayer.volume > 0) {
            audioPlayer.volume = 0;
            volumeSlider.value = 0;
            volumeBtn.innerHTML = '<i class="fas fa-volume-mute"></i>';
        } else {
            audioPlayer.volume = currentVolume;
            volumeSlider.value = currentVolume * 100;
            updateVolumeIcon();
        }
    });

    volumeSlider.addEventListener('input', function() {
        currentVolume = this.value / 100;
        audioPlayer.volume = currentVolume;
        updateVolumeIcon();
    });

    function updateVolumeIcon() {
        if (audioPlayer.volume === 0) {
            volumeBtn.innerHTML = '<i class="fas fa-volume-mute"></i>';
        } else if (audioPlayer.volume < 0.5) {
            volumeBtn.innerHTML = '<i class="fas fa-volume-down"></i>';
        } else {
            volumeBtn.innerHTML = '<i class="fas fa-volume-up"></i>';
        }
    }
    
    function updateLoopButton() {
        switch(loopState) {
            case 0:
                loopBtn.innerHTML = '<i class="fas fa-repeat"></i>';
                loopBtn.style.color = '';
                break;
            case 1:
                loopBtn.innerHTML = '<i class="fas fa-repeat"></i><span class="loop-count">1</span>';
                loopBtn.style.color = '#007bff';
                break;
            case 2:
                loopBtn.innerHTML = '<i class="fas fa-infinity"></i>';
                loopBtn.style.color = '#007bff';
                break;
        }
    }    async function performSearch(query, isDropdownSearch = false) {
        if (!query) {
            updateUnavailableMessage("Please enter a song name");
            hideSearchDropdown();
            return;
        }
        
        if (isDropdownSearch) {
            showSearchLoading();
        } else {
            updateUnavailableMessage(`Searching for "${query}"...`);
        }
        
        const matchedCustomSongs = customSongs.filter(song => 
            song.name.toLowerCase().includes(query.toLowerCase())
        );
        
        try {
            let allSongs = [...matchedCustomSongs];
            
            // Also search API for more results
            const response = await fetch(`https://saavn.dev/api/search/songs?query=${encodeURIComponent(query)}`);
            const data = await response.json();
            
            if (data.data && data.data.results) {
                allSongs = [...allSongs, ...data.data.results];
            }
            
            if (allSongs.length === 0) {
                if (isDropdownSearch) {
                    showNoResults();
                } else {
                    updateUnavailableMessage("No songs found");
                    hideSearchDropdown();
                }
                return;
            }
            
            songs = allSongs;
            
            if (isDropdownSearch) {
                displaySearchDropdown(allSongs.slice(0, 8));
            } else {
                currentSongIndex = 0;
                playSong(songs[currentSongIndex]);
                hideSearchDropdown();
            }
        } catch (error) {
            console.error("Error:", error);
            if (isDropdownSearch) {
                showNoResults();
            } else {
                updateUnavailableMessage("Something went wrong");
                hideSearchDropdown();
            }
        }
    }
    
    function decodeHtmlEntities(text) {
        const textArea = document.createElement('textarea');
        textArea.innerHTML = text;
        return textArea.value;
    }
    
    function formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
    }
    
    function playSong(song) {
        const downloads = song.downloadUrl || [];
        let audioUrl = null;
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
        if (audioUrl) {
            audioPlayer.src = audioUrl;
            audioPlayer.volume = currentVolume; // Ensure volume is maintained
            const thumb = song.image?.find(img => img.quality === "500x500")?.url || "";
            songTitle.textContent = decodeHtmlEntities(song.name);
            songArtist.textContent = decodeHtmlEntities(song.artists?.primary?.[0]?.name || "Unknown");
            albumArt.src = thumb || 'music.gif';
            updateLikeBtn(song);
            likeBtn && likeBtn.classList.add('active');
            audioPlayer.play()
                .then(() => {
                    isPlaying = true;
                    updatePlayPauseIcon();
                    updateUnavailableMessage(`Now playing: ${decodeHtmlEntities(song.name)}`);
                })
                .catch(error => {
                    console.error("Playback error:", error);
                    updateUnavailableMessage("Playback error. Check console.");
                });
        } else {
            updateUnavailableMessage("No playable CDN link found");
            likeBtn && likeBtn.classList.remove('active');
            updateLikeBtn(null);
        }
    }
    
    function updatePlayPauseIcon() {
        if (isPlaying) {
            playPauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
        } else {
            playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
        }
        // Hide like button if nothing is playing
        if (likeBtn) {
            if (!audioPlayer.src || !isPlaying) {
                likeBtn.classList.remove('active');
            }
        }
    }
    
    function togglePlayPause() {
        if (audioPlayer.src) {
            if (isPlaying) {
                audioPlayer.pause();
            } else {
                audioPlayer.play();
            }
            isPlaying = !isPlaying;
            updatePlayPauseIcon();
        }
    }
    
    playPauseBtn.addEventListener('click', togglePlayPause);
    
    document.addEventListener('keydown', function(e) {
        if (e.code === 'Space' && !isTypingInSearch) {
            e.preventDefault();
            togglePlayPause();
        }
    });
    
    prevBtn.addEventListener('click', function() {
        if (songs.length > 0) {
            currentSongIndex = (currentSongIndex - 1 + songs.length) % songs.length;
            playSong(songs[currentSongIndex]);
        }
    });
    
    nextBtn.addEventListener('click', function() {
        if (songs.length > 0) {
            currentSongIndex = (currentSongIndex + 1) % songs.length;
            playSong(songs[currentSongIndex]);
        }
    });
    
    audioPlayer.addEventListener('timeupdate', function() {
        const currentTime = audioPlayer.currentTime;
        const duration = audioPlayer.duration || 1;
        const progressPercent = (currentTime / duration) * 100;
        progress.style.width = `${progressPercent}%`;
        waveProgress.style.width = `${progressPercent}%`;
        currentTimeDisplay.textContent = formatTime(currentTime);
        if (!isNaN(duration)) {
            durationDisplay.textContent = formatTime(duration);
        }
    });
    
    progressBar.addEventListener('click', function(e) {
        if (audioPlayer.src) {
            const clickPosition = e.offsetX / this.clientWidth;
            audioPlayer.currentTime = clickPosition * audioPlayer.duration;
        }
    });
    
    // Show/hide unavailable message only when needed
    function updateUnavailableMessage(message) {
        let msgDiv = document.getElementById('unavailable-message');
        if (!msgDiv) {
            // Insert after #player-options for best visibility
            const player = document.getElementById('player');
            if (player) {
                msgDiv = document.createElement('div');
                msgDiv.id = 'unavailable-message';
                player.insertBefore(msgDiv, player.firstChild);
            }
        }
        if (msgDiv) {
            if (message) {
                msgDiv.style.display = '';
                msgDiv.innerHTML = `<code>${message}</code>`;
            } else {
                msgDiv.style.display = 'none';
                msgDiv.innerHTML = '';
            }
        }
    }

    // Hide message by default on load
    updateUnavailableMessage('');
    
    audioPlayer.addEventListener('ended', function() {
        if (loopState === 1) {
            if (!hasLoopedOnce) {
                audioPlayer.currentTime = 0;
                audioPlayer.play();
                hasLoopedOnce = true;
            } else {
                if (songs.length > 0) {
                    currentSongIndex = (currentSongIndex + 1) % songs.length;
                    playSong(songs[currentSongIndex]);
                }
                hasLoopedOnce = false;
            }
        } else if (loopState === 2) {
            audioPlayer.currentTime = 0;
            audioPlayer.play();
        } else {
            if (songs.length > 0) {
                currentSongIndex = (currentSongIndex + 1) % songs.length;
                playSong(songs[currentSongIndex]);
            } else {
                isPlaying = false;
                updatePlayPauseIcon();
            }
        }
    });
    
    audioPlayer.addEventListener('play', function() {
        isPlaying = true;
        updatePlayPauseIcon();
    });
    
    audioPlayer.addEventListener('pause', function() {
        isPlaying = false;
        updatePlayPauseIcon();
    });
      function displaySearchDropdown(songList) {
        dropdownResults.innerHTML = '';
        searchDropdown.classList.remove('hidden');
        
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
    
    function hideSearchDropdown() {
        searchDropdown.classList.add('hidden');
        selectedDropdownIndex = -1;
    }
    
    function showSearchLoading() {
        dropdownResults.innerHTML = '<div class="search-loading"><i class="fas fa-spinner fa-spin"></i> Searching...</div>';
        searchDropdown.classList.remove('hidden');
    }
    
    function showNoResults() {
        dropdownResults.innerHTML = '<div class="search-no-results">No songs found</div>';
        searchDropdown.classList.remove('hidden');
    }
    
    function updateDropdownSelection(dropdownItems) {
        dropdownItems.forEach((item, index) => {
            if (index === selectedDropdownIndex) {
                item.classList.add('selected');
                item.scrollIntoView({ block: 'nearest' });
            } else {
                item.classList.remove('selected');
            }
        });
    }
});