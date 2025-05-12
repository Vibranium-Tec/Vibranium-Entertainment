const TMDB_API_KEY = '89ade83a1b714a065cb7a54cafd2ae2b';
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w500';
const trendingMoviesCarousel = document.getElementById('trendingMoviesCarousel');
const trendingSeriesCarousel = document.getElementById('trendingSeriesCarousel');
const heroMainArt = document.getElementById('heroMainArt');

function getImage(path) {
  return path ? `${TMDB_IMAGE_BASE}${path}` : './no-poster.png';
}

function createCard(item, type = 'movie') {
  const div = document.createElement('div');
  div.className = 'movie-card';
  div.innerHTML = `
    <img src="${getImage(item.poster_path)}" alt="${item.title || item.name}">
    <div class="movie-title">${item.title || item.name}</div>
    <div class="movie-meta">${(item.release_date || item.first_air_date || '').split('-')[0] || ''} &bull; ${item.vote_average?.toFixed(1) || 'N/A'}</div>
  `;
  div.tabIndex = 0;
  div.addEventListener('click', () => {
    window.location.href = type === 'movie' ? `Wmovie.html?id=${item.id}` : `Wseries.html?id=${item.id}`;
  });
  return div;
}

function createCarousel(items, container, type) {
  container.innerHTML = '';
  const track = document.createElement('div');
  track.className = 'carousel-track';
  items.forEach(item => track.appendChild(createCard(item, type)));
  container.appendChild(track);

  const left = document.createElement('button');
  left.className = 'carousel-arrow left';
  left.innerHTML = '<img src="https://unpkg.com/feather-icons/dist/icons/chevron-left.svg" alt="Left" width="28" height="28">';
  const right = document.createElement('button');
  right.className = 'carousel-arrow right';
  right.innerHTML = '<img src="https://unpkg.com/feather-icons/dist/icons/chevron-right.svg" alt="Right" width="28" height="28">';
  container.appendChild(left);
  container.appendChild(right);

  let pos = 0;
  let cardWidth = 200;
  let gap = 18;
  let visible = Math.floor((container.offsetWidth - 96) / (cardWidth + gap));

  function updateVisible() {
    cardWidth = track.querySelector('.movie-card')?.offsetWidth || 200;
    gap = parseInt(getComputedStyle(track).gap) || 18;
    visible = Math.max(1, Math.floor((container.offsetWidth - 96) / (cardWidth + gap)));

    if (items.length <= visible) {
      left.style.display = 'none';
      right.style.display = 'none';
      track.style.transform = 'translateX(0)';
    } else {
      left.style.display = '';
      right.style.display = '';
    }
  }

  function goTo(newPos) {
    pos = Math.max(0, Math.min(items.length - visible, newPos));
    track.style.transform = `translateX(-${pos * (cardWidth + gap)}px)`;
  }

  left.onclick = () => goTo(pos - visible);
  right.onclick = () => goTo(pos + visible);

  let autoSlide = setInterval(() => {
    if (pos < items.length - visible) goTo(pos + 1);
    else goTo(0);
  }, 3500);

  container.addEventListener('mouseenter', () => clearInterval(autoSlide));
  container.addEventListener('mouseleave', () => {
    autoSlide = setInterval(() => {
      if (pos < items.length - visible) goTo(pos + 1);
      else goTo(0);
    }, 3500);
  });

  window.addEventListener('resize', () => {
    updateVisible();
    goTo(pos);
  });

  setTimeout(() => {
    updateVisible();
    goTo(0);
  }, 100);
}

async function fetchTrendingMovies() {
  const res = await fetch(`${TMDB_BASE_URL}/trending/movie/week?api_key=${TMDB_API_KEY}`);
  const data = await res.json();
  return data.results || [];
}

async function fetchTrendingSeries() {
  const res = await fetch(`${TMDB_BASE_URL}/trending/tv/week?api_key=${TMDB_API_KEY}`);
  const data = await res.json();
  return data.results || [];
}

async function setupHome() {
  const [movies, series] = await Promise.all([
    fetchTrendingMovies(),
    fetchTrendingSeries()
  ]);
  if (movies.length) {
    heroMainArt.innerHTML = `
      <img src="${getImage(movies[0].backdrop_path || movies[0].poster_path)}" alt="${movies[0].title}">
      <div class="play-btn">
        <svg viewBox="0 0 38 38"><circle cx="19" cy="19" r="18" stroke="#a084ee" stroke-width="2" fill="none"/><polygon points="15,12 27,19 15,26" fill="#a084ee"/></svg>
      </div>
    `;
    heroMainArt.querySelector('.play-btn').onclick = () => {
      window.open(`https://www.youtube.com/results?search_query=${encodeURIComponent(movies[0].title + ' trailer')}`);
    };
  }
  createCarousel(movies, trendingMoviesCarousel, 'movie');
  createCarousel(series, trendingSeriesCarousel, 'series');
}

setupHome(); 