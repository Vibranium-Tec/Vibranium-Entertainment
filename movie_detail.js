const TMDB_API_KEY = '89ade83a1b714a065cb7a54cafd2ae2b';
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w500';
const urlParams = new URLSearchParams(window.location.search);
const movieId = urlParams.get('id');
const moviePoster = document.getElementById('moviePoster');
const movieTitle = document.getElementById('movieTitle');
const movieYear = document.getElementById('movieYear');
const movieRuntime = document.getElementById('movieRuntime');
const movieRating = document.getElementById('movieRating');
const movieOverview = document.getElementById('movieOverview');
const moviePlayer = document.getElementById('moviePlayer');
const castGrid = document.getElementById('castGrid');
const movieStartTime = document.getElementById('movieStartTime');
const movieEndTime = document.getElementById('movieEndTime');

let movieDurationSec = 0;

const sourceSelect = document.getElementById('sourceSelect');

function formatTime(sec) {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
}

function formatTimeOfDay(date) {
    let h = date.getHours();
    let m = date.getMinutes();
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

function addMinutesToTime(date, minutesToAdd) {
    let h = date.getHours();
    let m = date.getMinutes();
    let totalMinutes = h * 60 + m + minutesToAdd;
    let newH = Math.floor(totalMinutes / 60) % 24;
    let newM = totalMinutes % 60;
    return `${newH.toString().padStart(2, '0')}:${newM.toString().padStart(2, '0')}`;
}

const trailerModal = document.getElementById('trailerModal');
const trailerFrame = document.getElementById('trailerFrame');
const closeTrailer = document.getElementById('closeTrailer');

if (closeTrailer) {
    closeTrailer.onclick = () => {
        trailerModal.style.display = 'none';
        trailerFrame.src = '';
    };
}
window.onclick = function(event) {
    if (event.target === trailerModal) {
        trailerModal.style.display = 'none';
        trailerFrame.src = '';
    }
};

function getImdbIdFromTmdb(tmdbId) {
    return fetch(`${TMDB_BASE_URL}/movie/${tmdbId}/external_ids?api_key=${TMDB_API_KEY}`)
        .then(res => res.json())
        .then(data => data.imdb_id);
}

function buildSources(tmdbId) {
    return [
        {
            name: "embed.su (ADS + BEST)",
            url: `https://embed.su/embed/movie/${tmdbId}`
        },
        {
            name: "vidsrc.rip (ADS)",
            url: `https://vidsrc.rip/embed/movie/${tmdbId}`
        },
        {
            name: "vidsrc.cc (ADS)",
            url: `https://vidsrc.cc/v2/embed/movie/${tmdbId}`

        },
        {
            name: "123embed (BROKEN)",
            url: `https://play2.123embed.net/movie/${tmdbId}`
        },
        {
            name: "autoembed.cc (ADS)",
            url: `https://player.autoembed.cc/embed/movie/${tmdbId}`
        },
        {
            name: "vidsrc.vip (ADS)",
            url: `https://vidsrc.vip/embed/movie/${tmdbId}`
        },
        {
            name: "vidsrc.icu (ADS)",
            url: `https://vidsrc.icu/embed/movie/${tmdbId}`
        },
        {
            name: "vidsrc.xyz (ADS)",
            url: `https://vidsrc.xyz/embed/movie?tmdb=${tmdbId}`
        }
    ];
}

async function setupSources(tmdbId) {
    const sources = buildSources(tmdbId);
    sourceSelect.innerHTML = sources.map((s, i) =>
        `<option value="${s.url}">${s.name}</option>`
    ).join('');
    if (sources.length) {
        moviePlayer.src = sources[0].url;
    }
    sourceSelect.onchange = () => {
        moviePlayer.src = sourceSelect.value;
    };
}

async function fetchMovieDetails() {
    try {
        const response = await fetch(`${TMDB_BASE_URL}/movie/${movieId}?api_key=${TMDB_API_KEY}`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const movie = await response.json();
        
        const backdrop = document.getElementById('movieBackdrop');
        backdrop.style.backgroundImage = movie.backdrop_path
            ? `url(${TMDB_IMAGE_BASE}${movie.backdrop_path})`
            : 'none';

        moviePoster.src = `${TMDB_IMAGE_BASE}${movie.poster_path}`;
        movieTitle.textContent = movie.title;
        movieYear.textContent = movie.release_date?.split('-')[0] || 'N/A';
        movieRuntime.textContent = `${movie.runtime} min`;
        movieRating.textContent = `★ ${movie.vote_average?.toFixed(1)}`;
        movieOverview.textContent = movie.overview;

        const runtimeMin = movie.runtime || 0;
        movieDurationSec = runtimeMin * 60;

        const now = new Date();
        movieStartTime.textContent = `Start: ${formatTimeOfDay(now)}`;
        movieEndTime.textContent = `End: ${addMinutesToTime(now, runtimeMin)}`;

        document.title = `${movie.title} - MovieHub`;

        await fetchMovieCast();
        await fetchMovieTrailers();
        await setupSources(movieId);
    } catch (error) {
        console.error('Error fetching movie details:', error);
    }
}

async function fetchMovieCast() {
    try {
        const response = await fetch(`${TMDB_BASE_URL}/movie/${movieId}/credits?api_key=${TMDB_API_KEY}`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        
        const cast = data.cast.slice(0, 6);
        castGrid.innerHTML = cast.map(person => `
            <div class="cast-member">
                <img src="${TMDB_IMAGE_BASE}${person.profile_path}" alt="${person.name}" 
                     onerror="this.src='./no-poster.png'">
                <div class="cast-info">
                    <h3>${person.name}</h3>
                    <p>${person.character}</p>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error fetching cast:', error);
    }
}

async function fetchMovieTrailers() {
    try {
        const response = await fetch(`${TMDB_BASE_URL}/movie/${movieId}/videos?api_key=${TMDB_API_KEY}`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        const trailers = data.results.filter(v => v.type === 'Trailer' && v.site === 'YouTube');
        const trailerLinks = document.getElementById('trailerLinks');
        if (trailers.length > 0) {
            trailerLinks.innerHTML = `<button class="trailer-btn">Watch Trailer</button>`;
            document.querySelector('.trailer-btn').onclick = () => {
                trailerFrame.src = `https://www.youtube.com/embed/${trailers[0].key}?autoplay=1&rel=0&showinfo=0`;
                trailerModal.style.display = 'flex';
            };
        } else {
            trailerLinks.innerHTML = '';
        }
    } catch (error) {
        console.error('Error fetching trailers:', error);
    }
}

// Function to set video source (to be implemented when you provide sources)
function setVideoSource(source) {
    moviePlayer.src = source;
}

if (movieId) {
    fetchMovieDetails();
} else {
    window.location.href = 'movies.html';
} 