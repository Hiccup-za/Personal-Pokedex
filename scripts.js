let userGames = [];
let activeMenuGameType = null;
let currentAction = null;

// Function to generate a unique ID
function generateUniqueId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Check if localStorage is available and working
function isLocalStorageAvailable() {
    try {
        const test = 'test';
        localStorage.setItem(test, test);
        localStorage.removeItem(test);
        return true;
    } catch (e) {
        return false;
    }
}

// Function to load games from localStorage
function loadGames() {
    if (!isLocalStorageAvailable()) {
        // If localStorage is not available, just init with empty array
        userGames = [];
        renderContent();
        return;
    }
    
    try {
        const savedGames = localStorage.getItem('userGames');
        if (savedGames) {
            userGames = JSON.parse(savedGames);
            renderContent();
        } else {
            // First time initialization
            initializeGames();
        }
    } catch (error) {
        // Handle error silently
        initializeGames();
    }
}

// Function to save games to localStorage
function saveGames() {
    try {
        localStorage.setItem('userGames', JSON.stringify(userGames));
    } catch (error) {
        // Handle error silently
    }
}

// Function to initialize games for first time
function initializeGames() {
    // Initialize with an empty array instead of default games
    userGames = [];
    
    saveGames();
    renderContent();
}

// Function to initialize stats for each game
function initializeStats(gameType) {
    try {
        let storageKey;
        if (gameType === 'scarlet') {
            storageKey = 'scarletPokemonData';
        } else if (gameType === 'violet') {
            storageKey = 'pokemonData';
        } else if (gameType === 'legends-arceus') {
            storageKey = 'legendsArceusPokemonData';
        } else {
            return null;
        }
        
        const savedData = localStorage.getItem(storageKey);
        if (savedData) {
            const pokemonData = JSON.parse(savedData);
            const seenCount = pokemonData.filter(pokemon => pokemon.seen).length;
            const capturedCount = pokemonData.filter(pokemon => pokemon.captured).length;
            const shinyCount = pokemonData.filter(pokemon => pokemon.shiny).length;
            const alphaCount = pokemonData.filter(pokemon => pokemon.alpha).length || 0;
            const totalCount = pokemonData.length;
            
            return {
                seen: seenCount,
                captured: capturedCount,
                shiny: shinyCount,
                alpha: alphaCount,
                total: totalCount
            };
        }
        
        return null;
    } catch (error) {
        // Handle error silently
        return null;
    }
}

// Function to initialize game stats
function initializeGameStats(game) {
    // Attempt to fetch stats from localStorage
    const stats = initializeStats(game.type);
    if (stats) {
        game.stats = stats;
    }

    // If no stats, set default values based on game type
    if (!game.stats) {
        if (game.type === 'legends-arceus') {
            game.stats = {
                seen: 0,
                captured: 0,
                shiny: 0,
                alpha: 0,
                total: 242
            };
        } else { // scarlet or violet
            game.stats = {
                seen: 0,
                captured: 0,
                shiny: 0,
                total: 0
            };
        }
    }
    
    return game;
}

// Render the page content based on current state
function renderContent() {
    const contentDiv = document.getElementById('content');
    // Get available game types from the modal (for dynamic validation)
    const allGameTypes = ['scarlet', 'violet', 'legends-arceus'];
    const addedGameTypes = userGames.map(game => game.type);
    const hasMoreGamesToAdd = allGameTypes.some(type => !addedGameTypes.includes(type));
    
    let buttonHTML = `
        <div class="fixed-button-position ${hasMoreGamesToAdd ? '' : 'hidden'}">
            <div class="add-button" id="addButton">
                <span class="plus-icon">+</span>
                <span class="add-text">Add Game</span>
            </div>
        </div>
    `;
    
    if (userGames.length === 0) {
        // State 1: No user data
        contentDiv.innerHTML = `
            <div class="main-content">
                <div class="empty-state">
                    <!-- Empty state content -->
                </div>
            </div>
            ${buttonHTML}
        `;
    } else {
        // State 2: User has games
        let gamesHTML = '';
        
        userGames.forEach(game => {
            let statsHTML = `
                <div class="stat-item">
                    <span class="stat-value">${game.stats.seen}</span>
                    <span class="stat-label">Seen</span>
                </div>
                <div class="stat-item">
                    <span class="stat-value">${game.stats.captured} / ${game.stats.total || '?'}</span>
                    <span class="stat-label">Captured</span>
                </div>
                <div class="stat-item">
                    <span class="stat-value">${game.stats.shiny || 0}</span>
                    <span class="stat-label">Shiny</span>
                </div>
            `;
            
            gamesHTML += `
                <div class="game-container" data-game="${game.type}">
                    <div class="game-card" data-game="${game.type}">
                        <div class="menu-button" data-game="${game.type}">
                            <div class="menu-dots">⋮</div>
                            <div class="dropdown-menu" id="dropdown-${game.type}">
                                <div class="dropdown-item warning" data-action="reset" data-game="${game.type}">Reset data</div>
                                <div class="dropdown-item danger" data-action="remove" data-game="${game.type}">Remove game</div>
                                <div class="dropdown-item danger" data-action="remove-reset" data-game="${game.type}">Remove game & Reset data</div>
                            </div>
                        </div>
                    </div>
                    <div class="game-stats">
                        ${statsHTML}
                    </div>
                </div>
            `;
        });

        // Create HTML structure with Add Button
        contentDiv.innerHTML = `
            <div class="main-content">
                <div class="games-grid">
                    ${gamesHTML}
                </div>
            </div>
            ${buttonHTML}
        `;
    }
    
    // Add click event for add button if it exists and more games can be added
    if (hasMoreGamesToAdd) {
        const addButton = document.getElementById('addButton');
        if (addButton) {
            addButton.addEventListener('click', openModal);
        }
    }
    
    // Add event handlers for game containers
    document.querySelectorAll('.game-container').forEach(container => {
        container.addEventListener('click', (e) => {
            // Only navigate if the click wasn't on the menu button or dropdown
            if (!e.target.closest('.menu-button') && !e.target.closest('.dropdown-menu')) {
                const gameType = container.dataset.game;
                navigateToGame(gameType);
            }
        });
    });
    
    // Add click events for menu buttons
    document.querySelectorAll('.menu-button').forEach(button => {
        button.addEventListener('click', (e) => {
            e.stopPropagation();
            const gameType = button.dataset.game;
            toggleDropdown(gameType);
        });
    });
    
    // Add click events for dropdown items
    document.querySelectorAll('.dropdown-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.stopPropagation();
            const action = item.dataset.action;
            const gameType = item.dataset.game;
            handleAction(action, gameType);
        });
    });
}

// Toggle dropdown visibility
function toggleDropdown(gameType) {
    // Check if this dropdown is already open
    const dropdown = document.getElementById(`dropdown-${gameType}`);
    const isCurrentlyOpen = dropdown && dropdown.classList.contains('active');
    
    // Close any open dropdowns first
    document.querySelectorAll('.dropdown-menu').forEach(dropdown => {
        dropdown.classList.remove('active');
    });
    
    // If the dropdown was already open, just close it and return
    if (isCurrentlyOpen) {
        activeMenuGameType = null;
        document.removeEventListener('click', closeDropdowns);
        return;
    }
    
    // Toggle the dropdown for this game
    if (dropdown) {
        dropdown.classList.add('active');
        activeMenuGameType = gameType;
        
        // Add global click event to close dropdown when clicking elsewhere
        setTimeout(() => {
            document.addEventListener('click', closeDropdowns);
        }, 0);
    }
}

// Close all dropdowns
function closeDropdowns() {
    document.querySelectorAll('.dropdown-menu').forEach(dropdown => {
        dropdown.classList.remove('active');
    });
    document.removeEventListener('click', closeDropdowns);
    activeMenuGameType = null;
}

// Handle dropdown actions
function handleAction(action, gameType) {
    closeDropdowns();
    
    currentAction = { action, gameType };
    
    let title, message;
    
    switch (action) {
        case 'reset':
            title = 'Reset Game Data?';
            message = 'This will reset all seen and captured Pokémon for this game. This action cannot be undone.';
            break;
        case 'remove':
            title = 'Remove Game?';
            message = 'This will remove the game from your Personal Pokedex. Your Pokémon data will not be deleted.';
            break;
        case 'remove-reset':
            title = 'Remove Game & Reset Data?';
            message = 'This will remove the game from your Personal Pokedex AND reset all seen and captured Pokémon. This action cannot be undone.';
            break;
    }
    
    // Show confirmation modal
    document.getElementById('confirmTitle').textContent = title;
    document.getElementById('confirmMessage').textContent = message;
    document.getElementById('confirmModal').style.display = 'flex';
}

// Perform the confirmed action
function confirmAction() {
    if (!currentAction) return;
    
    const { action, gameType } = currentAction;
    
    switch (action) {
        case 'reset':
            resetGameData(gameType);
            break;
        case 'remove':
            removeGame(gameType, false);
            break;
        case 'remove-reset':
            removeGame(gameType, true);
            break;
    }
    
    closeConfirmModal();
    currentAction = null;
}

// Reset game data
function resetGameData(gameType) {
    try {
        if (gameType === 'scarlet') {
            // Reset Scarlet data
            localStorage.removeItem('scarletPokemonData');
            
            // Try to load the JSON data
            fetch('./data/scarlet-violet.json')
                .then(response => response.json())
                .then(data => {
                    // Reset all flags to false
                    const pokemon = data.pokemon.map(p => {
                        return {
                            ...p,
                            seen: false,
                            captured: false,
                            shiny: false
                        };
                    });
                    
                    // Save the reset data
                    localStorage.setItem('scarletPokemonData', JSON.stringify(pokemon));
                    
                    // Update game stats
                    updateGameStats('scarlet', {
                        seen: 0,
                        captured: 0,
                        shiny: 0,
                        total: pokemon.length
                    });
                })
                .catch(error => {
                    console.error('Error resetting Scarlet data:', error);
                });
        } else if (gameType === 'violet') {
            // Reset Violet data
            localStorage.removeItem('pokemonData');
            
            // Try to load the JSON data
            fetch('./data/scarlet-violet.json')
                .then(response => response.json())
                .then(data => {
                    // Reset all flags to false
                    const pokemon = data.pokemon.map(p => {
                        return {
                            ...p,
                            seen: false,
                            captured: false,
                            shiny: false
                        };
                    });
                    
                    // Save the reset data
                    localStorage.setItem('pokemonData', JSON.stringify(pokemon));
                    
                    // Update game stats
                    updateGameStats('violet', {
                        seen: 0,
                        captured: 0,
                        shiny: 0,
                        total: pokemon.length
                    });
                })
                .catch(error => {
                    console.error('Error resetting Violet data:', error);
                });
        } else if (gameType === 'legends-arceus') {
            // Reset Legends Arceus data
            localStorage.removeItem('legendsArceusPokemonData');
            
            // Create basic dataset with 242 Pokémon
            const pokemon = Array.from({ length: 242 }, (_, index) => {
                const id = (index + 1).toString().padStart(3, '0');
                return {
                    id: id,
                    name: `Pokémon #${id}`,
                    seen: false,
                    captured: false,
                    shiny: false,
                    alpha: false,
                    evolution_level: null,
                    evolution_criteria: null
                };
            });
            
            // Save the reset data
            localStorage.setItem('legendsArceusPokemonData', JSON.stringify(pokemon));
            
            // Update game stats
            updateGameStats('legends-arceus', {
                seen: 0,
                captured: 0,
                shiny: 0,
                alpha: 0,
                total: pokemon.length
            });
        }
        
        // Close the confirmation modal
        closeConfirmModal();
        
        // Reset active menu
        activeMenuGameType = null;
        
        return true;
    } catch (error) {
        console.error('Error resetting game data:', error);
        return false;
    }
}

// Remove game
function removeGame(gameType, resetData) {
    // Remove from userGames
    userGames = userGames.filter(game => game.type !== gameType);
    saveGames();
    
    // Reset data if requested
    if (resetData) {
        if (gameType === 'violet') {
            try {
                const savedData = localStorage.getItem('pokemonData');
                if (savedData) {
                    const pokemonData = JSON.parse(savedData);
                    
                    // Reset all Pokémon data
                    pokemonData.forEach(pokemon => {
                        pokemon.seen = false;
                        pokemon.captured = false;
                        pokemon.shiny = false;
                    });
                    
                    // Save back to localStorage
                    localStorage.setItem('pokemonData', JSON.stringify(pokemonData));
                }
            } catch (error) {
                console.error('Error resetting game data:', error);
            }
        } else if (gameType === 'scarlet') {
            try {
                const savedData = localStorage.getItem('scarletPokemonData');
                if (savedData) {
                    const pokemonData = JSON.parse(savedData);
                    
                    // Reset all Pokémon data
                    pokemonData.forEach(pokemon => {
                        pokemon.seen = false;
                        pokemon.captured = false;
                        pokemon.shiny = false;
                    });
                    
                    // Save back to localStorage
                    localStorage.setItem('scarletPokemonData', JSON.stringify(pokemonData));
                }
            } catch (error) {
                console.error('Error resetting game data:', error);
            }
        } else if (gameType === 'legends-arceus') {
            try {
                const savedData = localStorage.getItem('legendsArceusPokemonData');
                if (savedData) {
                    const pokemonData = JSON.parse(savedData);
                    
                    // Reset all Pokémon data
                    pokemonData.forEach(pokemon => {
                        pokemon.seen = false;
                        pokemon.captured = false;
                        pokemon.shiny = false;
                        pokemon.alpha = false;
                    });
                    
                    // Save back to localStorage
                    localStorage.setItem('legendsArceusPokemonData', JSON.stringify(pokemonData));
                }
            } catch (error) {
                console.error('Error resetting game data:', error);
            }
        }
    }
    
    renderContent();
}

// Navigate to the game page
function navigateToGame(gameType) {
    if (gameType === 'scarlet') {
        window.location.href = 'scarlet.html';
    } else if (gameType === 'violet') {
        window.location.href = 'violet.html';
    } else if (gameType === 'legends-arceus') {
        window.location.href = 'legends-arceus.html';
    }
}

// Add a new game
function addGame(gameType) {
    if (!gameType) return;
    
    // Check if this game already exists
    const existingGame = userGames.find(game => game.type === gameType);
    if (existingGame) {
        return; // Game already exists
    }
    
    // Create new game entry
    let newGame = {
        id: generateUniqueId(),
        dateAdded: new Date().toISOString(),
        type: gameType
    };
    
    // Set name and icon based on type
    if (gameType === 'scarlet') {
        newGame.name = 'Scarlet';
    } else if (gameType === 'violet') {
        newGame.name = 'Violet';
    } else if (gameType === 'legends-arceus') {
        newGame.name = 'Legends Arceus';
    }
    
    // Initialize game stats
    newGame = initializeGameStats(newGame);
    
    // Add to games array
    userGames.push(newGame);
    
    // Save and refresh
    saveGames();
    renderContent();
    
    // Close modal
    closeModal();
}

// Open the add game modal
function openModal() {
    // Get available game types that haven't been added yet
    const allGameTypes = ['scarlet', 'violet', 'legends-arceus'];
    const addedGameTypes = userGames.map(game => game.type);
    const hasMoreGamesToAdd = allGameTypes.some(type => !addedGameTypes.includes(type));
    
    // If no more games to add, don't open modal
    if (!hasMoreGamesToAdd) {
        return;
    }

    const modal = document.getElementById('addGameModal');
    
    // Check which games are already added and hide their options
    const scarletOption = modal.querySelector('.game-option[data-game="scarlet"]');
    const violetOption = modal.querySelector('.game-option[data-game="violet"]');
    const legendsArceusOption = modal.querySelector('.game-option[data-game="legends-arceus"]');
    
    // Reset visibility first
    scarletOption.style.display = 'flex';
    violetOption.style.display = 'flex';
    legendsArceusOption.style.display = 'flex';
    
    // Hide options for games that are already added
    const scarletExists = userGames.some(game => game.type === 'scarlet');
    const violetExists = userGames.some(game => game.type === 'violet');
    const legendsArceusExists = userGames.some(game => game.type === 'legends-arceus');
    
    if (scarletExists) {
        scarletOption.style.display = 'none';
    }
    
    if (violetExists) {
        violetOption.style.display = 'none';
    }
    
    if (legendsArceusExists) {
        legendsArceusOption.style.display = 'none';
    }
    
    // Check if there are any games to add
    const gameOptions = modal.querySelector('.game-options');
    
    // Remove existing message if it exists
    const noGamesMessage = modal.querySelector('.no-games-message');
    if (noGamesMessage) {
        noGamesMessage.remove();
    }
    
    // If all games are already added, show a message
    if (!hasMoreGamesToAdd) {
        const message = document.createElement('div');
        message.className = 'no-games-message';
        message.textContent = 'You have already added all available games.';
        gameOptions.appendChild(message);
    }
    
    modal.style.display = 'flex';
}

// Close the add game modal
function closeModal() {
    const modal = document.getElementById('addGameModal');
    modal.style.display = 'none';
}

// Close the confirmation modal
function closeConfirmModal() {
    document.getElementById('confirmModal').style.display = 'none';
    currentAction = null;
}

// Add event listeners when the page loads
document.addEventListener('DOMContentLoaded', () => {
    loadGames();
    
    // Modal close button
    document.getElementById('closeModal').addEventListener('click', closeModal);
    
    // Game options in modal
    document.querySelectorAll('.game-option').forEach(option => {
        option.addEventListener('click', () => {
            const gameType = option.dataset.game;
            addGame(gameType);
        });
    });

    // Close modal when clicking outside
    window.addEventListener('click', (event) => {
        const modal = document.getElementById('addGameModal');
        if (event.target === modal) {
            closeModal();
        }
    });
    
    // Confirmation modal buttons
    document.getElementById('confirmCancel').addEventListener('click', closeConfirmModal);
    document.getElementById('confirmOk').addEventListener('click', confirmAction);
    
    // Close confirmation modal when clicking outside
    document.getElementById('confirmModal').addEventListener('click', (event) => {
        if (event.target === document.getElementById('confirmModal')) {
            closeConfirmModal();
        }
    });
});

// Vercel Analytics
window.va = window.va || function () { (window.vaq = window.vaq || []).push(arguments); };

// Function to update game stats in the userGames array
function updateGameStats(gameType, stats) {
    // Find the game
    const gameIndex = userGames.findIndex(game => game.type === gameType);
    if (gameIndex !== -1) {
        // Update the stats
        userGames[gameIndex].stats = stats;
        
        // Save changes
        saveGames();
        
        // Render updated content
        renderContent();
    }
}

// Add CSS for the Legends Arceus game card
document.addEventListener('DOMContentLoaded', function() {
    // Create a style element
    const style = document.createElement('style');
    
    // Add the CSS for the Legends Arceus game card
    style.textContent = `
        .game-card[data-game="legends-arceus"] {
            background-image: url('./assets/Arceus_BoxArt.jpg');
            background-size: cover;
            background-position: center;
        }
        
        .game-card[data-game="legends-arceus"]:hover {
            transform: translateY(-5px);
            box-shadow: 0 8px 16px rgba(0, 0, 0, 0.4), 0 0 20px rgba(99, 102, 241, 0.3);
            border-color: rgba(99, 102, 241, 0.6);
        }
    `;
    
    // Append the style to the head
    document.head.appendChild(style);
    
    // Continue with other initialization
    loadGames();
}); 