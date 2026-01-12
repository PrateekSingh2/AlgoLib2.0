// --- GLOBAL DATA ---
let algorithms = [];

// --- DARK MODE TOGGLE ---
function initThemeToggle() {
    const themeToggle = document.getElementById('theme-toggle') || document.getElementById('theme-toggle-nav');
    const isDarkMode = localStorage.getItem('darkMode') === 'true';
    
    if (isDarkMode) {
        document.body.classList.add('dark-mode');
        updateThemeIcon(true);
    }
    
    if(themeToggle) {
        themeToggle.addEventListener('click', () => {
            document.body.classList.toggle('dark-mode');
            const isNowDark = document.body.classList.contains('dark-mode');
            localStorage.setItem('darkMode', isNowDark);
            updateThemeIcon(isNowDark);
        });
    }
}

function updateThemeIcon(isDark) {
    const icons = document.querySelectorAll('.theme-toggle i');
    icons.forEach(icon => {
        if(isDark) {
            icon.classList.remove('fa-moon');
            icon.classList.add('fa-sun');
        } else {
            icon.classList.remove('fa-sun');
            icon.classList.add('fa-moon');
        }
    });
}

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
    initThemeToggle();
    if (window.location.pathname.includes('view.html')) {
        document.body.classList.add('view-page');
    }

    const jsonPath = 'https://api.npoint.io/bcd767f5eb569c2592c6'; 

    fetch(jsonPath)
        .then(response => {
            if (!response.ok) throw new Error("Failed to load algorithms data");
            return response.json();
        })
        .then(data => {
            algorithms = data;
            console.log("Algorithms loaded:", algorithms.length);

            if (window.location.pathname.includes('view.html')) {
                const params = new URLSearchParams(window.location.search);
                const algoId = params.get('algo');
                
                if (algoId) {
                    loadPageContent(algoId);
                } else {
                    document.getElementById('algo-title').innerText = "No Algorithm Selected";
                }
            }
        })
        .catch(err => {
            console.error("Error loading JSON:", err);
            if(document.getElementById('algo-title')) {
                document.getElementById('algo-title').innerText = "Error Loading Data";
                document.getElementById('algo-desc').innerHTML = `Could not load data from external source.<br>Check console for details or verify the URL.`;
            }
        });
    
    setTimeout(() => {
        if (algorithms.length > 0) {
            initCategoryFilters();
        }
    }, 100);
    
    setupKeyboardShortcuts();

    initMobileMenus();
});

// --- MOBILE MENU & SEARCH HANDLING ---
function initMobileMenus() {
    // 1. Hamburger Menu Logic
    const toggles = document.querySelectorAll('.menu-toggle');
    if (toggles.length) {
        toggles.forEach(toggle => {
            const navbar = toggle.closest('.navbar');
            const navLinks = navbar.querySelector('.nav-links');
            const icon = toggle.querySelector('i');

            toggle.setAttribute('aria-expanded', 'false');
            if (navLinks) navLinks.setAttribute('aria-hidden', 'true');

            toggle.addEventListener('click', (e) => {
                e.stopPropagation();
                const expanded = navLinks.classList.toggle('expanded');
                toggle.setAttribute('aria-expanded', expanded);
                navLinks.setAttribute('aria-hidden', (!expanded).toString());
                if (icon) {
                    icon.classList.toggle('fa-bars', !expanded);
                    icon.classList.toggle('fa-times', expanded);
                }
                if (expanded) {
                    const first = navLinks.querySelector('.nav-link');
                    if (first) first.focus();
                }
            });

            navLinks.querySelectorAll('.nav-link').forEach(link => link.addEventListener('click', closeAllMobileMenus));
        });
    }

    // 2. Mobile Search Icon Logic (NEW)
    const searchToggles = document.querySelectorAll('.search-toggle-mobile');
    searchToggles.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const wrapper = btn.closest('.search-wrapper');
            if (wrapper) {
                wrapper.classList.toggle('active');
                const input = wrapper.querySelector('input');
                if (wrapper.classList.contains('active') && input) {
                    input.focus();
                }
            }
        });
    });

    // Close menus when clicking outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.navbar')) {
            closeAllMobileMenus();
            // Close search bar if clicked outside (optional, but good UX)
            document.querySelectorAll('.search-wrapper.active').forEach(el => {
                el.classList.remove('active');
            });
        }
    });

    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeAllMobileMenus(); });

    window.addEventListener('resize', () => { if (window.innerWidth > 768) closeAllMobileMenus(); });
}

function closeAllMobileMenus() {
    document.querySelectorAll('.nav-links.expanded').forEach(nav => {
        nav.classList.remove('expanded');
        nav.setAttribute('aria-hidden', 'true');
    });
    document.querySelectorAll('#menu-toggle, #menu-toggle-nav').forEach(toggle => {
        toggle.setAttribute('aria-expanded', 'false');
        const icon = toggle.querySelector('i');
        if (icon) { icon.classList.remove('fa-times'); icon.classList.add('fa-bars'); }
    });
}

// --- LOAD PAGE CONTENT (view.html) ---
function loadPageContent(id) {
    const algo = algorithms.find(item => item.id === id);
    
    if (algo) {
        document.title = `${algo.title} - AlgoLib`;
        document.getElementById('algo-title').innerText = algo.title;
        document.getElementById('algo-desc').innerText = algo.description;
        document.getElementById('algo-time').innerText = algo.timeComplexity || "-";
        document.getElementById('algo-space').innerText = algo.spaceComplexity || "-";
        
        document.getElementById('code-java').textContent = algo.codeJava;
        document.getElementById('code-cpp').textContent = algo.codeCpp;

        
        if(window.Prism) Prism.highlightAll();
    } else {
        document.querySelector('.content-wrapper').innerHTML = `
            <div style="text-align:center; margin-top: 50px;">
                <h1>404</h1>
                <p>Algorithm ID "<strong>${id}</strong>" not found.</p>
                <a href="index.html" style="color: blue; text-decoration: underline;">Go Home</a>
            </div>
        `;
    }
}

// --- SEARCH LOGIC ---
function executeSearch() {
    const input = document.getElementById('searchInput');
    const query = input.value.trim();
    const errorMsg = document.getElementById('error-msg');
    
    if(errorMsg) errorMsg.classList.add('hidden');
    input.style.borderColor = "#ccc";

    if(!query) return;

    const match = algorithms.find(algo => 
        algo.title.toLowerCase() === query.toLowerCase()
    );
    
    const fuzzy = algorithms.find(algo => 
        algo.title.toLowerCase().includes(query.toLowerCase()) ||
        (algo.tags && algo.tags.includes(query.toLowerCase()))
    );

    const result = match || fuzzy;

    if (result) {
        window.location.href = `view.html?algo=${result.id}`;
    } else {
        if(errorMsg) errorMsg.classList.remove('hidden');
        input.style.borderColor = "red";
    }
}

function handleEnter(e) {
    if (e.key === 'Enter') {
        if(e.target) showSuggestions(e.target); 
        executeSearch();
    }
}

// --- SUGGESTIONS ---
function showSuggestions(inputElement) {
    const query = inputElement.value.toLowerCase().trim();
    
    const wrapper = inputElement.closest('.search-wrapper') || 
                    inputElement.closest('.search-wrapper-home');
    
    const suggestionBox = wrapper.querySelector('.suggestion-box');
    const errorMsg = document.getElementById('error-msg');
    
    if(errorMsg) errorMsg.classList.add('hidden');
    inputElement.style.borderColor = "#ccc";
    
    suggestionBox.innerHTML = '';
    
    if (!query) {
        suggestionBox.classList.add('hidden');
        return;
    }

    const matches = algorithms.filter(algo => {
        return algo.title.toLowerCase().includes(query) || 
               (algo.tags && algo.tags.some(tag => tag.toLowerCase().includes(query)));
    });

    if (matches.length > 0) {
        suggestionBox.classList.remove('hidden');
        matches.forEach(match => {
            const div = document.createElement('div');
            div.className = 'suggestion-item';
            
            div.innerHTML = `
                <span class="suggestion-text">${match.title}</span>
                <span class="suggestion-tag">${match.category}</span>
            `;
            
            div.onclick = () => {
                window.location.href = `view.html?algo=${match.id}`;
            };
            suggestionBox.appendChild(div);
        });
    } else {
        suggestionBox.classList.add('hidden');
    }
}

// --- CLOSE SUGGESTIONS ON CLICK OUTSIDE (FIXED) ---
document.addEventListener('click', (e) => {
    const isInsideSearch = e.target.closest('.search-wrapper') || e.target.closest('.search-wrapper-home');
    
    if (!isInsideSearch) {
        document.querySelectorAll('.suggestion-box').forEach(box => {
            box.classList.add('hidden');
        });
    }
});

// --- TABS & UTILS ---
function openTab(evt, lang) {
    const container = evt.target.closest('.code-box');
    container.querySelectorAll('.tab-content').forEach(el => el.style.display = 'none');
    container.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    
    const target = container.querySelector(`#${lang}`);
    if(target) target.style.display = 'block';
    evt.target.classList.add('active');
}

async function copyCode(btn) {
    const container = btn.closest('.code-box');
    const visibleTab = Array.from(container.querySelectorAll('.tab-content'))
                            .find(el => el.style.display === 'block' || getComputedStyle(el).display === 'block');
    if (!visibleTab) return;
    try {
        await navigator.clipboard.writeText(visibleTab.innerText);
        const originalText = btn.innerHTML;
        btn.innerHTML = '<i class=\"fa-solid fa-check\"></i> Copied!';
        setTimeout(() => { btn.innerHTML = originalText; }, 2000);
    } catch (err) { console.error('Failed to copy', err); }
}

// --- COPY ALL CODE ---
async function copyAllCode() {
    const codeBoxes = document.querySelectorAll('.tab-content');
    let allCode = '';
    codeBoxes.forEach(box => {
        if(box.style.display !== 'none') {
            allCode += box.innerText + '\n\n---\n\n';
        }
    });
    try {
        await navigator.clipboard.writeText(allCode);
        const btn = document.getElementById('copy-all-btn');
        const originalText = btn.innerHTML;
        btn.innerHTML = '<i class=\"fa-solid fa-check\"></i> Copied All!';
        setTimeout(() => { btn.innerHTML = originalText; }, 2000);
    } catch (err) { console.error('Failed to copy all', err); }
}

// --- INIT CATEGORY FILTERS ---
function initCategoryFilters() {
    const filterContainer = document.getElementById('categoryFilters');
    if (!filterContainer || algorithms.length === 0) return;
    
    const categories = [...new Set(algorithms.map(a => a.category))].sort();
    
    filterContainer.innerHTML = '<button class="category-btn active" onclick="filterByCategory(null)">Random</button>';
    categories.forEach(cat => {
        const btn = document.createElement('button');
        btn.className = 'category-btn';
        btn.textContent = cat;
        btn.onclick = () => filterByCategory(cat);
        filterContainer.appendChild(btn);
    });
    
    filterByCategory(null);
}

function filterByCategory(category) {
    const tagsContainer = document.getElementById('tagsContainer');
    if (!tagsContainer) return;
    
    const filtered = category ? algorithms.filter(a => a.category === category) : algorithms;
    
    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.classList.remove('active');
        if ((category === null && btn.textContent === 'Random') || btn.textContent === category) {
            btn.classList.add('active');
        }
    });
    
    const shuffled = [...filtered].sort(() => 0.5 - Math.random()).slice(0, 3);
    
    tagsContainer.innerHTML = shuffled.map(algo => 
        `<a href=\"view.html?algo=${algo.id}\" class=\"tag-btn\">${algo.title}</a>`
    ).join('');
}

// --- KEYBOARD SHORTCUTS ---
function setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey || e.metaKey) {
            if (e.key === '/') {
                e.preventDefault();
                const searchInput = document.getElementById('searchInput');
                if (searchInput) searchInput.focus();
            }
            if (e.key === 'd') {
                e.preventDefault();
                const themeToggle = document.getElementById('theme-toggle') || document.getElementById('theme-toggle-nav');
                if (themeToggle) themeToggle.click();
            }
        }
    });
}

// --- VISIT COUNTER ---
const countContainer = document.getElementById("visit-count");
const NAMESPACE = "algolib.netlify.app";
const KEY = "visits";

if (countContainer) {
    
    fetch(`https://api.counterapi.dev/v1/${NAMESPACE}/${KEY}/up`) 
    .then(res => {
        return res.json();
    })
    .then(res => {
        animateValue(countContainer, 0, res.value, 500);
    })
    .catch(err => {
        console.error("ERROR OCCURRED:", err);
        countContainer.innerText = "Error";
    });
}

function animateValue(obj, start, end, duration) {
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        
        obj.innerHTML = Math.floor(progress * (end - start) + start).toLocaleString();
        
        if (progress < 1) {
            window.requestAnimationFrame(step);
        }
    };
    window.requestAnimationFrame(step);
}