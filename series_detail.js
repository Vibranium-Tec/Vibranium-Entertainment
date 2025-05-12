const TMDB_API_KEY = '89ade83a1b714a065cb7a54cafd2ae2b';
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w500';
const urlParams = new URLSearchParams(window.location.search);
const seriesId = urlParams.get('id');
const seriesPoster = document.getElementById('seriesPoster');
const seriesTitle = document.getElementById('seriesTitle');
const seriesYear = document.getElementById('seriesYear');
const seriesRating = document.getElementById('seriesRating');
const seriesOverview = document.getElementById('seriesOverview');
const seriesPlayer = document.getElementById('seriesPlayer');
const castGrid = document.getElementById('castGrid');
const seasonSelect = document.getElementById('seasonSelect');
const episodeSelect = document.getElementById('episodeSelect');
const sourceSelect = document.getElementById('sourceSelect');

function buildSeriesSources(seriesId, season, episode) {
    return [
        { name: "embed.su", url: `https://embed.su/embed/tv/${seriesId}/${season}/${episode}` },
        { name: "vidsrc.rip", url: `https://vidsrc.rip/embed/tv/${seriesId}/${season}/${episode}` },
        { name: "vidsrc.cc", url: `https://vidsrc.cc/v2/embed/tv/${seriesId}/${season}/${episode}` },
        { name: "autoembed.cc", url: `https://player.autoembed.cc/embed/tv/${seriesId}/${season}/${episode}` },
        { name: "vidsrc.vip", url: `https://vidsrc.vip/embed/tv/${seriesId}/${season}/${episode}` },
        { name: "vidsrc.xyz (direct)", url: `https://vidsrc.xyz/embed/tv/${seriesId}/${season}-${episode}` },
        { name: "vidsrc.xyz (params)", url: `https://vidsrc.xyz/embed/tv?tmdb=${seriesId}&season=${season}&episode=${episode}` }
    ];
}

async function fetchSeriesDetails() {
    const res = await fetch(`${TMDB_BASE_URL}/tv/${seriesId}?api_key=${TMDB_API_KEY}`);
    const series = await res.json();
    document.getElementById('seriesBackdrop').style.backgroundImage = series.backdrop_path ? `url(${TMDB_IMAGE_BASE}${series.backdrop_path})` : 'none';
    seriesPoster.src = `${TMDB_IMAGE_BASE}${series.poster_path}`;
    seriesTitle.textContent = series.name;
    seriesYear.textContent = series.first_air_date?.split('-')[0] || 'N/A';
    seriesRating.textContent = `★ ${series.vote_average?.toFixed(1)}`;
    seriesOverview.textContent = series.overview;

    seasonSelect.innerHTML = series.seasons
        .filter(s => s.season_number > 0)
        .map(s => `<option value="${s.season_number}">Season ${s.season_number}</option>`).join('');
    seasonSelect.value = 1;
    await populateEpisodes(1);
    await fetchSeriesCast();
    setupSourceSwitcher();
}

async function populateEpisodes(seasonNumber) {
    const res = await fetch(`${TMDB_BASE_URL}/tv/${seriesId}/season/${seasonNumber}?api_key=${TMDB_API_KEY}`);
    const data = await res.json();
    episodeSelect.innerHTML = data.episodes.map(e =>
        `<option value="${e.episode_number}">Episode ${e.episode_number}: ${e.name}</option>`
    ).join('');
    episodeSelect.value = 1;
}

async function fetchSeriesCast() {
    const res = await fetch(`${TMDB_BASE_URL}/tv/${seriesId}/credits?api_key=${TMDB_API_KEY}`);
    const data = await res.json();
    const cast = data.cast.slice(0, 6);
    castGrid.innerHTML = cast.map(person => `
        <div class="cast-member">
            <img src="${TMDB_IMAGE_BASE}${person.profile_path}" alt="${person.name}" onerror="this.src='./no-poster.png'">
            <div class="cast-info">
                <h3>${person.name}</h3>
                <p>${person.character}</p>
            </div>
        </div>
    `).join('');
}

function setupSourceSwitcher() {
    function updatePlayer() {
        const season = seasonSelect.value;
        const episode = episodeSelect.value;
        const sources = buildSeriesSources(seriesId, season, episode);
        sourceSelect.innerHTML = sources.map(s => `<option value=\"${s.url}\">${s.name}</option>`).join('');
        seriesPlayer.src = sources[0].url;
        sourceSelect.onchange = () => {
            seriesPlayer.src = sourceSelect.value;
        };
    }
    seasonSelect.onchange = async () => {
        await populateEpisodes(seasonSelect.value);
        updatePlayer();
    };
    episodeSelect.onchange = updatePlayer;
    updatePlayer();
}

if (seriesId) fetchSeriesDetails();