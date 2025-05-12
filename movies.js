const TMDB_API_KEY = '89ade83a1b714a065cb7a54cafd2ae2b';
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w500';

let currentPage = 1;
const searchInput = document.getElementById('searchInput');
const videoGrid = document.getElementById('videoGrid');
const searchResults = document.getElementById('searchResults');

function getImage(path) {
    return path ? `${TMDB_IMAGE_BASE}${path}` : './no-poster.png';
}

function createVideoItem(item, isSearch = false) {
    const div = document.createElement('div');
    div.classList.add('videoItem');
    div.tabIndex = 0;

    const thumbnail = document.createElement('a');
    thumbnail.classList.add('thumbnail');
    thumbnail.href = `Wmovie.html?id=${item.id}`;
    thumbnail.innerHTML = `
        <img loading="lazy" src="${getImage(item.poster_path)}" alt="${item.title}">
        <span class="playIcon">
            <svg width="38" height="38" fill="none" stroke="#a084ee" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="11" stroke="#a084ee" stroke-width="2"/>
                <polygon points="10,8 16,12 10,16" fill="#a084ee"/>
            </svg>
        </span>
    `;

    const infoBar = document.createElement('div');
    infoBar.className = 'infoBar';
    infoBar.innerHTML = `
        <span class="rating">
            <svg width="16" height="16" fill="#fff" viewBox="0 0 24 24"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>
            ${item.vote_average?.toFixed(1) || 'N/A'}
        </span>
        <span class="date">
            <svg width="14" height="14" fill="#fff" viewBox="0 0 24 24"><path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V9h14v11zm0-13H5V6h14v1z"/></svg>
            ${item.release_date?.split('-')[0] || 'N/A'}
        </span>
    `;

    const title = document.createElement('h3');
    title.title = item.title;
    title.innerText = item.title;

    div.appendChild(thumbnail);
    div.appendChild(infoBar);
    div.appendChild(title);

    (isSearch ? searchResults : videoGrid).appendChild(div);
}

async function fetchTrending(page) {
    try {
        const response = await fetch(`${TMDB_BASE_URL}/trending/movie/week?api_key=${TMDB_API_KEY}&page=${page}`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        return data.results || [];
    } catch (error) {
        console.error('Error fetching trending movies:', error);
        return [];
    }
}

async function displayTrending() {
    const items = await fetchTrending(currentPage);
    if (items && items.length > 0) {
        items.forEach(item => createVideoItem(item));
    } else {
        videoGrid.innerHTML = '<p style="text-align: center; grid-column: 1/-1;">No movies found</p>';
    }
}

let searchTimeout;
searchInput.addEventListener('input', async () => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(async () => {
        const query = searchInput.value.trim();
        if (query) {
            try {
                const response = await fetch(`${TMDB_BASE_URL}/search/movie?api_key=${TMDB_API_KEY}&query=${query}`);
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                const data = await response.json();
                searchResults.innerHTML = '';
                videoGrid.style.display = 'none';
                if (data.results && data.results.length > 0) {
                    data.results.forEach(item => createVideoItem(item, true));
                } else {
                    searchResults.innerHTML = '<p style="text-align: center;">No results found</p>';
                }
            } catch (error) {
                console.error('Error searching movies:', error);
                searchResults.innerHTML = '<p style="text-align: center;">Error searching movies</p>';
            }
        } else {
            searchResults.innerHTML = '';
            videoGrid.style.display = '';
        }
    }, 400);
});

window.addEventListener('scroll', async () => {
    if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 200 && searchResults.innerHTML === '') {
        currentPage++;
        await displayTrending();
    }
});

displayTrending();