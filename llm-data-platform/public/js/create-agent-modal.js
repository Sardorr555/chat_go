/**
 * Create Agent Modal Functionality
 * This script provides functionality for the Create Agent modal across different pages
 */

// Initialize the Create Agent Modal
function initCreateAgentModal() {
  // Update the source count badge on the Create Agent button
  updateSourceCountBadge();
  
  // Add modal HTML to the page if it doesn't exist
  if (!document.getElementById('createAgentModal')) {
    const modalHTML = `
    <div class="modal fade" id="createAgentModal" tabindex="-1" aria-labelledby="createAgentModalLabel" aria-hidden="true">
      <div class="modal-dialog modal-lg modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="createAgentModalLabel">Create New Agent</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body">
            <form id="createAgentForm">
              <div class="mb-3">
                <label for="agentName" class="form-label">Agent Name</label>
                <input type="text" class="form-control" id="agentName" placeholder="My AI Assistant">
              </div>
              <div class="mb-3">
                <label for="agentDescription" class="form-label">Agent Description</label>
                <textarea class="form-control" id="agentDescription" rows="2" placeholder="A helpful assistant that..."></textarea>
              </div>
              <div class="mb-3">
                <label for="agentWelcomeMessage" class="form-label">Welcome Message</label>
                <textarea class="form-control" id="agentWelcomeMessage" rows="2" placeholder="Hello! How can I assist you today?"></textarea>
              </div>
              <div class="mb-3">
                <label class="form-label">Data Sources</label>
                <div class="card mb-3">
                  <div class="card-body">
                    <div class="d-flex flex-row flex-wrap gap-3">
                      <div class="data-source-count" id="filesCount">
                        <i class="bi bi-file-earmark"></i>
                        <span>0</span>
                        <div>Files</div>
                      </div>
                      <div class="data-source-count" id="textsCount">
                        <i class="bi bi-text-paragraph"></i>
                        <span>0</span>
                        <div>Texts</div>
                      </div>
                      <div class="data-source-count" id="websitesCount">
                        <i class="bi bi-globe"></i>
                        <span>0</span>
                        <div>Websites</div>
                      </div>
                      <div class="data-source-count" id="qasCount">
                        <i class="bi bi-chat-dots"></i>
                        <span>0</span>
                        <div>Q&As</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div class="mb-3">
                <label for="agentModel" class="form-label">Model</label>
                <select class="form-select" id="agentModel">
                  <option value="gemini-pro">Gemini Pro</option>
                  <option value="claude-instant">Claude Instant</option>
                  <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                  <option value="gpt-4" disabled>GPT-4 (Pro Plan)</option>
                  <option value="gpt-4-turbo" disabled>GPT-4 Turbo (Pro Plan)</option>
                </select>
              </div>
              <div class="mb-3">
                <label for="agentLogo" class="form-label">Logo (Optional)</label>
                <input class="form-control" type="file" id="agentLogo" accept="image/*">
                <div id="logoPreviewContainer" class="d-none mt-2">
                  <img id="logoPreview" class="img-thumbnail" style="width: 100px; height: 100px; object-fit: cover;" />
                  <button type="button" id="removeLogo" class="btn btn-sm btn-outline-danger mt-2">Remove Logo</button>
                </div>
              </div>
              <div class="mb-3">
                <label for="agentTemperature" class="form-label">Temperature: <span id="temperatureValue" class="badge bg-primary">0.7</span></label>
                <input type="range" class="form-range" min="0" max="1" step="0.1" value="0.7" id="agentTemperature" oninput="updateTemperatureDisplay(this.value)">
                <div class="d-flex justify-content-between mt-1 temperature-labels">
                  <small class="text-primary"><i class="bi bi-arrow-down-circle"></i> More precise (factual)</small>
                  <small class="text-danger"><i class="bi bi-arrow-up-circle"></i> More creative (varied)</small>
                </div>
              </div>
            </form>
            <!-- Storage Monitor -->
            <div id="storageMonitorPlaceholder" class="mt-4"></div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
            <button type="button" class="btn btn-primary" id="createAgentBtn">Create Agent</button>
          </div>
        </div>
      </div>
    </div>
    `;
    
    // Add modal to the body
    const modalContainer = document.createElement('div');
    modalContainer.innerHTML = modalHTML;
    document.body.appendChild(modalContainer);
    
    // Initialize the modal functionality
    const createAgentBtn = document.getElementById('createAgentBtn');
    if (createAgentBtn) {
      createAgentBtn.addEventListener('click', handleCreateAgent);
    }
    
    // Initialize logo upload functionality
    const agentLogo = document.getElementById('agentLogo');
    if (agentLogo) {
      agentLogo.addEventListener('change', handleLogoUpload);
    }
    
    // Initialize logo removal
    const removeLogo = document.getElementById('removeLogo');
    if (removeLogo) {
      removeLogo.addEventListener('click', handleLogoRemoval);
    }
    
    // Refresh data source counts when modal is opened
    const createAgentModal = document.getElementById('createAgentModal');
    if (createAgentModal) {
      createAgentModal.addEventListener('shown.bs.modal', refreshDataSourceCounts);
    }
  }
}

// Handle logo upload
async function handleLogoUpload(e) {
  const fileInput = e.target;
  const logoPreviewContainer = document.getElementById('logoPreviewContainer');
  const logoPreview = document.getElementById('logoPreview');
  
  if (fileInput.files && fileInput.files[0]) {
    // Show loading state
    logoPreviewContainer.classList.remove('d-none');
    logoPreview.src = '/img/loading.svg';
    
    // Create form data for upload
    const formData = new FormData();
    formData.append('logo', fileInput.files[0]);
    formData.append('userId', userId || localStorage.getItem('userId') || 'anonymous');
    
    try {
      // Upload the logo
      const response = await fetch('http://localhost:3002/api/upload-logo', {
        method: 'POST',
        body: formData
      });
      
      const result = await response.json();
      console.log('Logo upload response:', result);
      
      if (response.ok) {
        // Store the logo URL for later use
        window.uploadedLogoUrl = result.logoUrl;
        
        // Show preview
        logoPreview.src = window.uploadedLogoUrl;
        console.log('Logo uploaded successfully:', window.uploadedLogoUrl);
      } else {
        console.error('Logo upload failed:', result.error);
        logoPreviewContainer.classList.add('d-none');
        alert('Failed to upload logo: ' + (result.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Logo upload error:', error);
      logoPreviewContainer.classList.add('d-none');
      alert('Error uploading logo: ' + error.message);
    }
  } else {
    // No file selected, hide preview
    logoPreviewContainer.classList.add('d-none');
  }
}

// Handle logo removal
function handleLogoRemoval() {
  const logoPreviewContainer = document.getElementById('logoPreviewContainer');
  const agentLogo = document.getElementById('agentLogo');
  
  if (logoPreviewContainer) {
    logoPreviewContainer.classList.add('d-none');
  }
  
  if (agentLogo) {
    agentLogo.value = '';
  }
  
  window.uploadedLogoUrl = null;
}

// Handle agent creation
async function handleCreateAgent() {
  const agentName = document.getElementById('agentName').value;
  const agentDescription = document.getElementById('agentDescription').value;
  const agentWelcomeMessage = document.getElementById('agentWelcomeMessage').value;
  const agentModel = document.getElementById('agentModel').value;
  const agentTemperature = document.getElementById('agentTemperature').value;
  
  if (!agentName) {
    alert('Please provide a name for your agent');
    return;
  }
  
  try {
    // Disable the create button and show loading state
    const createAgentBtn = document.getElementById('createAgentBtn');
    const originalBtnText = createAgentBtn.innerHTML;
    createAgentBtn.disabled = true;
    createAgentBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Creating...';
    
    // Create agent data
    const agentData = {
      name: agentName,
      description: agentDescription || 'A helpful AI assistant',
      welcomeMessage: agentWelcomeMessage || 'Hello! How can I help you today?',
      model: agentModel,
      temperature: parseFloat(agentTemperature),
      logoUrl: window.uploadedLogoUrl || '',
      userId: userId || localStorage.getItem('userId') || 'anonymous',
      createdAt: new Date().toISOString()
    };
    
    // Send the data to the server
    const response = await fetch('http://localhost:3002/api/agents', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(agentData)
    });
    
    const result = await response.json();
    
    if (response.ok) {
      // Show success message
      alert('Agent created successfully!');
      
      // Close the modal
      const modal = bootstrap.Modal.getInstance(document.getElementById('createAgentModal'));
      if (modal) {
        modal.hide();
      }
      
      // Redirect to bots page
      window.location.href = 'bots.html';
    } else {
      // Show error message
      alert('Failed to create agent: ' + (result.error || 'Unknown error'));
      
      // Reset button state
      createAgentBtn.disabled = false;
      createAgentBtn.innerHTML = originalBtnText;
    }
  } catch (error) {
    console.error('Error creating agent:', error);
    alert('Error creating agent: ' + error.message);
    
    // Reset button state
    const createAgentBtn = document.getElementById('createAgentBtn');
    if (createAgentBtn) {
      createAgentBtn.disabled = false;
      createAgentBtn.innerHTML = 'Create Agent';
    }
  }
}

// Refresh data source counts
async function refreshDataSourceCounts() {
  try {
    const userIdToUse = userId || localStorage.getItem('userId') || 'anonymous';
    const response = await fetch(`http://localhost:3002/api/data-sources?userId=${userIdToUse}`);
    const data = await response.json();
    
    if (response.ok) {
      // Update counts in the modal
      document.getElementById('filesCount').querySelector('span').textContent = data.uploads.length;
      document.getElementById('textsCount').querySelector('span').textContent = data.textInputs.length;
      document.getElementById('websitesCount').querySelector('span').textContent = data.websiteContent.length;
      document.getElementById('qasCount').querySelector('span').textContent = data.conversations ? data.conversations.length : 0;
      
      // Also update the source count badge on the button
      updateSourceCountDisplay(data);
    }
  } catch (error) {
    console.error('Error fetching data source counts:', error);
  }
}

// Update the source count badge on the Create Agent button
async function updateSourceCountBadge() {
  try {
    const userIdToUse = userId || localStorage.getItem('userId') || 'anonymous';
    const response = await fetch(`http://localhost:3002/api/data-sources?userId=${userIdToUse}`);
    
    if (response.ok) {
      const data = await response.json();
      updateSourceCountDisplay(data);
    }
  } catch (error) {
    console.error('Error updating source count badge:', error);
  }
}

// Update the source count display on the button
function updateSourceCountDisplay(data) {
  // Get the total count of all sources
  const totalSources = (
    (data.uploads ? data.uploads.length : 0) + 
    (data.textInputs ? data.textInputs.length : 0) + 
    (data.websiteContent ? data.websiteContent.length : 0) + 
    (data.conversations ? data.conversations.length : 0)
  );
  
  // Update the count on the badge
  const totalSourcesCount = document.getElementById('totalSourcesCount');
  if (totalSourcesCount) {
    totalSourcesCount.textContent = totalSources;
  }
}

// Update temperature display with color coding
function updateTemperatureDisplay(value) {
  const temperatureValue = document.getElementById('temperatureValue');
  if (temperatureValue) {
    // Update the text
    temperatureValue.textContent = value;
    
    // Update the color based on temperature value
    temperatureValue.className = 'badge'; // Reset class
    
    // Add color class based on temperature range
    if (value <= 0.3) {
      temperatureValue.classList.add('bg-primary'); // Cool blue for low temperature (precise)
    } else if (value <= 0.6) {
      temperatureValue.classList.add('bg-info'); // Medium blue for medium-low temperature
    } else if (value <= 0.8) {
      temperatureValue.classList.add('bg-warning'); // Warm orange for medium-high temperature
    } else {
      temperatureValue.classList.add('bg-danger'); // Hot red for high temperature (creative)
    }
  }
}

// Export functions for use in other files
window.initCreateAgentModal = initCreateAgentModal;
window.updateSourceCountBadge = updateSourceCountBadge;
window.updateTemperatureDisplay = updateTemperatureDisplay;
