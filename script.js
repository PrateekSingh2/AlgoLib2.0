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
    // 1. Determine correct path to JSON
    // If we are inside 'library/' folder (which we shouldn't be, but just in case), go up one level
    const jsonPath = window.location.pathname.includes('/library/') ? '../algorithms.json' : 'algorithms.json';

    fetch(jsonPath)
        .then(response => {
            if (!response.ok) throw new Error("Failed to load algorithms.json");
            return response.json();
        })
        .then(data => {
            algorithms = data;
            console.log("Algorithms loaded:", algorithms.length);

            // 2. Check if we are on 'view.html' and need to load content
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
                document.getElementById('algo-desc').innerHTML = `Could not load <b>${jsonPath}</b>. <br>Check if the file exists in the root folder.`;
            }
        });
    
    // Initialize category filters on home page (after algorithms are loaded)
    setTimeout(() => {
        if (algorithms.length > 0) {
            initCategoryFilters();
        }
    }, 100);
    
    // Keyboard shortcuts
    setupKeyboardShortcuts();
});

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
    
    // Reset UI
    if(errorMsg) errorMsg.classList.add('hidden');
    input.style.borderColor = "#ccc";

    if(!query) return;

    // Search
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
        // Pass the input element context if available, else standard search
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
            
            // --- UPDATED HTML HERE ---
            // Shows Title on left, Category on right
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
    // Check if we clicked inside ANY search wrapper
    const isInsideSearch = e.target.closest('.search-wrapper') || e.target.closest('.search-wrapper-home');
    
    if (!isInsideSearch) {
        // Hide ALL suggestion boxes
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
    
    // Clear and add "All" button
    filterContainer.innerHTML = '<button class="category-btn active" onclick="filterByCategory(null)">All</button>';
    
    // Add category buttons
    categories.forEach(cat => {
        const btn = document.createElement('button');
        btn.className = 'category-btn';
        btn.textContent = cat;
        btn.onclick = () => filterByCategory(cat);
        filterContainer.appendChild(btn);
    });
}

function filterByCategory(category) {
    const tagsContainer = document.getElementById('tagsContainer');
    if (!tagsContainer) return;
    
    const filtered = category ? algorithms.filter(a => a.category === category) : algorithms;
    
    // Update active button
    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.classList.remove('active');
        if ((category === null && btn.textContent === 'All') || btn.textContent === category) {
            btn.classList.add('active');
        }
    });
    
    // Show 3 random algorithms from filtered list
    const shuffled = [...filtered].sort(() => 0.5 - Math.random()).slice(0, 3);
    
    tagsContainer.innerHTML = shuffled.map(algo => 
        `<a href=\"view.html?algo=${algo.id}\" class=\"tag-btn\">${algo.title}</a>`
    ).join('');
}

// --- KEYBOARD SHORTCUTS ---
function setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey || e.metaKey) {
            if (e.key === 'k') {
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