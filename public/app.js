/**
 * Frontend Application Logic
 * Handles user interactions and API communication
 */

const chatMessages = document.getElementById('chatMessages');
const chatForm = document.getElementById('chatForm');
const queryInput = document.getElementById('queryInput');
const sendButton = document.getElementById('sendButton');
const exampleButtons = document.querySelectorAll('.example-btn');

// Add example button handlers
exampleButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        const query = btn.getAttribute('data-query');
        queryInput.value = query;
        queryInput.focus();
        handleSubmit(query);
    });
});

// Handle form submission
chatForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const query = queryInput.value.trim();
    if (query) {
        handleSubmit(query);
        queryInput.value = '';
    }
});

/**
 * Handle query submission
 */
async function handleSubmit(query) {
    // Add user message to chat
    addMessage(query, 'user');
    
    // Disable input while processing
    setInputDisabled(true);
    
    // Show loading message
    const loadingId = addMessage('Thinking...', 'bot', true);
    
    try {
        const response = await fetch('/api/query', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ query })
        });

        const data = await response.json();
        
        // Remove loading message
        removeMessage(loadingId);
        
        if (response.ok) {
            // Show bot response
            if (data.error) {
                addMessage(data.response, 'bot', false, true);
            } else {
                addMessage(data.response, 'bot');
                
                // Optionally show additional data in a collapsible section
                if (data.data && data.data.metrics.totalItems > 0) {
                    showDataSummary(data.data);
                }
            }
        } else {
            // Show error message
            addMessage(
                data.message || 'Sorry, I encountered an error. Please try again.',
                'bot',
                false,
                true
            );
        }
    } catch (error) {
        console.error('Error:', error);
        removeMessage(loadingId);
        addMessage(
            'Sorry, I couldn\'t connect to the server. Please check your connection and try again.',
            'bot',
            false,
            true
        );
    } finally {
        setInputDisabled(false);
        queryInput.focus();
    }
}

/**
 * Add a message to the chat
 */
function addMessage(text, type, isLoading = false, isError = false) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}-message`;
    
    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    
    if (isError) {
        contentDiv.classList.add('error-message');
    }
    
    if (isLoading) {
        contentDiv.classList.add('loading');
        messageDiv.id = `loading-${Date.now()}`;
    }
    
    contentDiv.textContent = text;
    messageDiv.appendChild(contentDiv);
    chatMessages.appendChild(messageDiv);
    
    // Scroll to bottom
    chatMessages.scrollTop = chatMessages.scrollHeight;
    
    return messageDiv.id;
}

/**
 * Remove a message (for loading messages)
 */
function removeMessage(messageId) {
    const message = document.getElementById(messageId);
    if (message) {
        message.remove();
    }
}

/**
 * Show data summary in a collapsible format
 */
function showDataSummary(data) {
    const summaryDiv = document.createElement('div');
    summaryDiv.className = 'message bot-message';
    
    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    contentDiv.style.fontSize = '0.875rem';
    contentDiv.style.opacity = '0.8';
    contentDiv.style.marginTop = '8px';
    
    let summary = '📊 Quick Stats: ';
    const stats = [];
    
    if (data.jira.summary.count > 0) {
        stats.push(`${data.jira.summary.count} JIRA issues`);
    }
    if (data.github.summary.commitCount > 0) {
        stats.push(`${data.github.summary.commitCount} commits`);
    }
    if (data.github.summary.prCount > 0) {
        stats.push(`${data.github.summary.prCount} PRs`);
    }
    
    summary += stats.join(', ');
    contentDiv.textContent = summary;
    summaryDiv.appendChild(contentDiv);
    chatMessages.appendChild(summaryDiv);
    
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

/**
 * Enable/disable input
 */
function setInputDisabled(disabled) {
    queryInput.disabled = disabled;
    sendButton.disabled = disabled;
    
    if (disabled) {
        sendButton.style.opacity = '0.6';
    } else {
        sendButton.style.opacity = '1';
    }
}

// Focus input on load
queryInput.focus();

// Allow Enter to submit (Shift+Enter for new line if needed)
queryInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        chatForm.dispatchEvent(new Event('submit'));
    }
});


