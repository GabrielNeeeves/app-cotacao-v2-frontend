// API Configuration
        const API_BASE_URL = 'http://localhost:8080';
        
        // DOM Elements
        const schoolNameInput = document.getElementById('schoolNameInput');
        const searchButton = document.getElementById('searchButton');
        const loadingState = document.getElementById('loadingState');
        const errorState = document.getElementById('errorState');
        const noResultsState = document.getElementById('noResultsState');
        const resultsGrid = document.getElementById('resultsGrid');

        // Check if user is authenticated
        function checkAuthentication() {
            const token = localStorage.getItem('token') || localStorage.getItem('authToken');
            
            if (!token) {
                showError('You need to be logged in to search for school supplies. Please login first.');
                setTimeout(() => {
                    window.location.href = '../login/login.html';
                }, 3000);
                return false;
            }
            
            // Check if token is expired (basic JWT check)
            try {
                const payload = JSON.parse(atob(token.split('.')[1]));
                const currentTime = Math.floor(Date.now() / 1000);
                
                if (payload.exp && payload.exp < currentTime) {
                    localStorage.removeItem('token');
                    localStorage.removeItem('authToken');
                    showError('Your session has expired. Please login again.');
                    setTimeout(() => {
                        window.location.href = '../login/login.html';
                    }, 3000);
                    return false;
                }
            } catch (e) {
                console.error('Error parsing token:', e);
                localStorage.removeItem('token');
                localStorage.removeItem('authToken');
                showError('Invalid authentication token. Please login again.');
                setTimeout(() => {
                    window.location.href = '../login/login.html';
                }, 3000);
                return false;
            }
            
            return true;
        }

        // Handle Enter key press in search input
        function handleKeyPress(event) {
            if (event.key === 'Enter') {
                searchSchoolSupplies();
            }
        }

        // Main search function
        async function searchSchoolSupplies() {
            const schoolName = schoolNameInput.value.trim();
            
            if (!schoolName) {
                showError('Please enter a school name');
                return;
            }

            if (!checkAuthentication()) {
                return;
            }

            // Reset states
            hideAllStates();
            showLoading();
            
            try {
                const token = localStorage.getItem('token') || localStorage.getItem('authToken');
                
                const headers = {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                };

                const encodedSchoolName = encodeURIComponent(schoolName);
                const apiUrl = `${API_BASE_URL}/listas_padrao/por_escola?escolaNome=${encodedSchoolName}`;
                
                // Debug logging
                console.log('Original school name:', schoolName);
                console.log('Encoded school name:', encodedSchoolName);
                console.log('Full API URL:', apiUrl);
                console.log('Token exists:', !!token);
                console.log('Token preview:', token ? token.substring(0, 20) + '...' : 'No token');

                // Make API request
                const response = await fetch(apiUrl, {
                    method: 'GET',
                    headers: headers
                });

                console.log('Response status:', response.status);

                if (response.status === 401) {
                    localStorage.removeItem('token');
                    localStorage.removeItem('authToken');
                    throw new Error('Authentication failed. Please login again.');
                } else if (response.status === 403) {
                    throw new Error('Access denied. You may not have permission to access this resource.');
                } else if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const data = await response.json();
                
                hideLoading();
                
                if (data && data.length > 0) {
                    displayResults(data);
                } else {
                    showNoResults();
                }

            } catch (error) {
                console.error('Error fetching school supplies:', error);
                hideLoading();
                
                if (error.message.includes('Authentication failed') || error.message.includes('login again')) {
                    showError(error.message + ' Redirecting to login...');
                    setTimeout(() => {
                        window.location.href = '../login/login.html';
                    }, 3000);
                } else {
                    showError(`Failed to fetch school supplies: ${error.message}`);
                }
            }
        }

        // Display search results
        function displayResults(supplies) {
            resultsGrid.innerHTML = '';
            
            supplies.forEach(supply => {
                const card = createSupplyCard(supply);
                resultsGrid.appendChild(card);
            });
        }

        // Create individual supply card
        function createSupplyCard(supply) {
            const card = document.createElement('div');
            card.className = 'supply-card';
            
            // Parse material JSON
            let materialInfo = {};
            try {
                materialInfo = JSON.parse(supply.material);
            } catch (e) {
                console.error('Error parsing material JSON:', e);
                materialInfo = { nome: 'Unknown Material' };
            }

            card.innerHTML = `
                <div class="card-header">
                    <div>
                        <div class="school-name">${supply.escolaNome}</div>
                        <div class="year-series">${supply.anoLetivo} - ${supply.serie}</div>
                    </div>
                </div>
                
                <div class="material-info">
                    <div class="material-name">${materialInfo.nome || 'Unknown Material'}</div>
                    <div class="material-details">
                        ${materialInfo.categoria ? `Category: ${materialInfo.categoria}<br>` : ''}
                        ${materialInfo.descricao ? `Description: ${materialInfo.descricao}` : ''}
                    </div>
                </div>
                
                <button class="view-details-btn" onclick="viewSupplyDetails(${supply.listaId})">
                    View Details
                </button>
            `;
            
            return card;
        }

        // View supply details (placeholder function)
        function viewSupplyDetails(listaId) {
            alert(`Viewing details for supply list ID: ${listaId}`);
            // Here you can implement navigation to a detailed view
            // or make another API call to get more details
        }

        // State management functions
        function hideAllStates() {
            loadingState.style.display = 'none';
            errorState.style.display = 'none';
            noResultsState.style.display = 'none';
        }

        function showLoading() {
            loadingState.style.display = 'block';
            searchButton.disabled = true;
        }

        function hideLoading() {
            loadingState.style.display = 'none';
            searchButton.disabled = false;
        }

        function showError(message) {
            errorState.textContent = message;
            errorState.style.display = 'block';
        }

        function showNoResults() {
            noResultsState.style.display = 'block';
        }

        // Navigation functions (placeholders)
        function goToMainPage() {
            window.location.href = '../index/index.html';
        }

        function goToItemDetails() {
            alert('Navigate to Item Details page');
        }

        function goToPriceComparison() {
            alert('Navigate to Price Comparison page');
        }

        function goToAbout() {
            alert('Navigate to About Us page');
        }

        function goToContact() {
            alert('Navigate to Contact page');
        }

        // Initialize page
        document.addEventListener('DOMContentLoaded', function() {
            // Check if user is authenticated
            const token = localStorage.getItem('token') || localStorage.getItem('authToken');
            if (!token) {
                showError('Please login to access this page. Redirecting...');
                setTimeout(() => {
                    window.location.href = '../login/login.html';
                }, 2000);
                return;
            }
            
            // Focus on search input when page loads
            schoolNameInput.focus();
        });