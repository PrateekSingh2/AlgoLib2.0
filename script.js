// --- GLOBAL DATA ---
let algorithms = [];

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
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
        const originalText = btn.innerText;
        btn.innerHTML = 'Copied!';
        setTimeout(() => { btn.innerHTML = originalText; }, 2000);
    } catch (err) { console.error('Failed to copy', err); }
}