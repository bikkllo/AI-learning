/**
 * AI Learning Guide - Main Application
 * 
 * This application provides an AI learning assistant specifically designed for beginners.
 * It integrates with Zhipu AI API and uses Supabase for data storage.
 */

class AILearningGuide {
    constructor() {
        this.isConfigured = false;
        this.currentConversationId = null;
        this.messages = [];
        this.isLoading = false;
        this.supabaseClient = null;
        
        // DOM elements
        this.elements = {};
        
        // Initialize the application
        this.init();
    }

    /**
     * Initialize the application
     */
    async init() {
        this.bindElements();
        this.attachEventListeners();
        this.setupAutoResize();
        await this.initializeSupabase();
        await this.checkConfiguration();
        this.showInitialInterface();
    }

    /**
     * Initialize Supabase client
     * Note: You need to configure your Supabase credentials here
     */
    async initializeSupabase() {
        // TODO: Replace with your actual Supabase configuration
        const SUPABASE_URL = 'YOUR_SUPABASE_PROJECT_URL';
        const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';
        
        try {
            // Initialize Supabase client (you'll need to include the Supabase JS library)
            // this.supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
            console.log('Supabase client initialized');
        } catch (error) {
            console.error('Failed to initialize Supabase:', error);
            this.showToast('数据库连接失败，请检查配置', 'error');
        }
    }

    /**
     * Bind DOM elements to the application
     */
    bindElements() {
        this.elements = {
            // Main containers
            welcomeScreen: document.getElementById('welcomeScreen'),
            chatInterface: document.getElementById('chatInterface'),
            messageList: document.getElementById('messageList'),
            
            // Welcome screen
            startBtn: document.getElementById('startBtn'),
            
            // Input elements
            messageInput: document.getElementById('messageInput'),
            sendBtn: document.getElementById('sendBtn'),
            
            // Quick question buttons
            quickBtns: document.querySelectorAll('.quick-btn'),
            
            // Settings elements
            settingsBtn: document.getElementById('settingsBtn'),
            settingsPanel: document.getElementById('settingsPanel'),
            settingsOverlay: document.getElementById('settingsOverlay'),
            closeSettingsBtn: document.getElementById('closeSettingsBtn'),
            settingsForm: document.getElementById('settingsForm'),
            testConfigBtn: document.getElementById('testConfigBtn'),
            
            // Form inputs
            apiUrl: document.getElementById('apiUrl'),
            apiKey: document.getElementById('apiKey'),
            modelName: document.getElementById('modelName'),
            
            // UI feedback elements
            loadingIndicator: document.getElementById('loadingIndicator'),
            toastContainer: document.getElementById('toastContainer')
        };
    }

    /**
     * Attach event listeners to DOM elements
     */
    attachEventListeners() {
        // Welcome screen
        this.elements.startBtn.addEventListener('click', () => this.startConfiguration());

        // Message sending
        this.elements.sendBtn.addEventListener('click', () => this.sendMessage());
        this.elements.messageInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });

        // Quick question buttons
        this.elements.quickBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const question = btn.getAttribute('data-question');
                this.sendQuickQuestion(question);
            });
        });

        // Input state management
        this.elements.messageInput.addEventListener('input', () => {
            this.updateSendButtonState();
        });

        // Settings panel
        this.elements.settingsBtn.addEventListener('click', () => this.openSettings());
        this.elements.closeSettingsBtn.addEventListener('click', () => this.closeSettings());
        this.elements.settingsOverlay.addEventListener('click', () => this.closeSettings());
        
        // Settings form
        this.elements.settingsForm.addEventListener('submit', (e) => this.saveConfiguration(e));
        this.elements.testConfigBtn.addEventListener('click', () => this.testConfiguration());

        // Prevent form submission on Enter in input fields
        this.elements.settingsForm.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && e.target.tagName !== 'BUTTON') {
                e.preventDefault();
            }
        });
    }

    /**
     * Setup auto-resize for message input
     */
    setupAutoResize() {
        const input = this.elements.messageInput;
        
        input.addEventListener('input', () => {
            input.style.height = 'auto';
            const newHeight = Math.min(Math.max(input.scrollHeight, 44), 120);
            input.style.height = newHeight + 'px';
            this.updateSendButtonState();
        });
        
        input.addEventListener('paste', () => {
            setTimeout(() => {
                input.style.height = 'auto';
                const newHeight = Math.min(Math.max(input.scrollHeight, 44), 120);
                input.style.height = newHeight + 'px';
                this.updateSendButtonState();
            }, 0);
        });
        
        this.updateSendButtonState();
    }

    /**
     * Check if the application is configured
     */
    async checkConfiguration() {
        try {
            // Check if configuration exists in Supabase
            if (this.supabaseClient) {
                const { data, error } = await this.supabaseClient
                    .from('ai_configurations')
                    .select('*')
                    .limit(1);
                
                if (error) throw error;
                
                this.isConfigured = data && data.length > 0;
            } else {
                // Fallback to localStorage for demo purposes
                const config = localStorage.getItem('aiLearningConfig');
                this.isConfigured = !!config;
            }
        } catch (error) {
            console.error('Failed to check configuration:', error);
            this.isConfigured = false;
        }
    }

    /**
     * Show initial interface based on configuration status
     */
    showInitialInterface() {
        if (this.isConfigured) {
            this.showChatInterface();
            this.showWelcomeMessage();
        } else {
            this.showWelcomeScreen();
        }
    }

    /**
     * Show welcome screen
     */
    showWelcomeScreen() {
        this.elements.welcomeScreen.classList.remove('hidden');
        this.elements.chatInterface.classList.remove('active');
    }

    /**
     * Show chat interface
     */
    showChatInterface() {
        this.elements.welcomeScreen.classList.add('hidden');
        this.elements.chatInterface.classList.add('active');
    }

    /**
     * Start configuration process
     */
    startConfiguration() {
        this.openSettings();
    }

    /**
     * Show welcome message from AI assistant
     */
    showWelcomeMessage() {
        if (this.messages.length === 0) {
            this.addMessage({
                role: 'assistant',
                content: `👋 你好！我是你的AI学习助手！

我专门为AI初学者设计，可以帮助你：

🎯 **了解AI基础概念** - 什么是人工智能、机器学习、深度学习
📚 **制定学习计划** - 根据你的背景推荐合适的学习路径  
🛠️ **推荐实用工具** - 介绍适合初学者的AI工具和平台
💡 **解答疑问** - 回答你在学习过程中遇到的任何问题

你可以：
- 点击左侧的快速问题开始
- 直接在下方输入框提问
- 问我任何关于AI的问题

让我们开始你的AI学习之旅吧！有什么想了解的吗？`,
                timestamp: new Date(),
                status: 'received'
            });
        }
    }

    /**
     * Send a quick question
     */
    async sendQuickQuestion(question) {
        // Add user message
        this.addMessage({
            role: 'user',
            content: question,
            timestamp: new Date(),
            status: 'sent'
        });

        // Clear input if it has content
        this.elements.messageInput.value = '';
        this.elements.messageInput.style.height = 'auto';
        this.updateSendButtonState();

        // Send to AI
        await this.processAIResponse(question);
    }

    /**
     * Send a message
     */
    async sendMessage() {
        const messageText = this.elements.messageInput.value.trim();
        
        if (!messageText || this.isLoading) {
            return;
        }

        if (!this.isConfigured) {
            this.showToast('请先配置API设置', 'warning');
            this.openSettings();
            return;
        }

        // Add user message to UI
        const userMessage = {
            role: 'user',
            content: messageText,
            timestamp: new Date(),
            status: 'sent'
        };
        
        this.addMessage(userMessage);
        
        // Clear input and reset height
        this.elements.messageInput.value = '';
        this.elements.messageInput.style.height = 'auto';
        this.updateSendButtonState();

        // Process AI response
        await this.processAIResponse(messageText);
    }

    /**
     * Process AI response
     */
    async processAIResponse(messageText) {
        // Add typing indicator
        const typingMessage = this.addTypingIndicator();
        
        // Show loading state
        this.setLoading(true);
        
        try {
            // Get configuration
            const config = await this.getConfiguration();
            if (!config) {
                throw new Error('Configuration not found');
            }

            // Prepare messages for context
            const messages = [
                {
                    role: 'system',
                    content: `你是一个专门为AI初学者设计的学习助手。你的任务是：

1. 用简单易懂的语言解释AI概念
2. 提供实用的学习建议和资源
3. 根据用户水平调整回答深度
4. 鼓励用户继续学习
5. 推荐合适的工具和平台

回答要求：
- 语言通俗易懂，避免过于技术性的术语
- 提供具体的例子和类比
- 结构清晰，使用适当的格式
- 积极鼓励，保持友好的语调
- 如果涉及代码，提供简单的解释`
                },
                ...this.messages.slice(-5).map(msg => ({
                    role: msg.role,
                    content: msg.content
                })),
                {
                    role: 'user',
                    content: messageText
                }
            ];

            // Call Zhipu AI API
            const response = await fetch(config.apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${config.apiKey}`
                },
                body: JSON.stringify({
                    model: config.modelName,
                    messages: messages,
                    temperature: 0.7,
                    max_tokens: 2000
                })
            });

            if (!response.ok) {
                throw new Error(`API request failed: ${response.status}`);
            }

            const data = await response.json();
            
            // Remove typing indicator
            this.removeTypingIndicator(typingMessage);
            
            // Add AI response to UI
            const aiMessage = {
                role: 'assistant',
                content: data.choices[0].message.content,
                timestamp: new Date(),
                status: 'received'
            };
            
            this.addMessage(aiMessage);
            
            // Save conversation to database
            await this.saveConversation(messageText, aiMessage.content);
            
        } catch (error) {
            console.error('Failed to get AI response:', error);
            
            // Remove typing indicator
            this.removeTypingIndicator(typingMessage);
            
            this.showToast('获取AI回复失败，请重试', 'error');
            
            // Add error message to UI
            this.addMessage({
                role: 'assistant',
                content: '抱歉，我现在无法回复您的消息。请检查网络连接或API配置，然后重试。',
                timestamp: new Date(),
                status: 'error',
                isError: true
            });
        } finally {
            this.setLoading(false);
        }
    }

    /**
     * Get configuration from database or localStorage
     */
    async getConfiguration() {
        try {
            if (this.supabaseClient) {
                const { data, error } = await this.supabaseClient
                    .from('ai_configurations')
                    .select('*')
                    .limit(1)
                    .single();
                
                if (error) throw error;
                return data;
            } else {
                // Fallback to localStorage
                const config = localStorage.getItem('aiLearningConfig');
                return config ? JSON.parse(config) : null;
            }
        } catch (error) {
            console.error('Failed to get configuration:', error);
            return null;
        }
    }

    /**
     * Save conversation to database
     */
    async saveConversation(userMessage, aiResponse) {
        try {
            if (this.supabaseClient) {
                const { error } = await this.supabaseClient
                    .from('conversations')
                    .insert([
                        {
                            user_message: userMessage,
                            ai_response: aiResponse,
                            created_at: new Date().toISOString()
                        }
                    ]);
                
                if (error) throw error;
            }
        } catch (error) {
            console.error('Failed to save conversation:', error);
        }
    }

    /**
     * Add a message to the chat interface
     */
    addMessage(message) {
        this.messages.push(message);
        
        const messageElement = this.createMessageElement(message);
        this.elements.messageList.appendChild(messageElement);
        
        // Scroll to bottom
        this.scrollToBottom();
    }

    /**
     * Create a message DOM element
     */
    createMessageElement(message) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${message.role}`;
        
        // Add message ID for potential future reference
        messageDiv.setAttribute('data-message-id', Date.now() + Math.random());
        
        // Add status classes
        if (message.status) {
            messageDiv.classList.add(`status-${message.status}`);
        }
        
        const avatar = document.createElement('div');
        avatar.className = 'message-avatar';
        avatar.textContent = message.role === 'user' ? '我' : 'AI';
        
        const content = document.createElement('div');
        content.className = 'message-content';
        
        // Handle error styling
        if (message.isError) {
            content.style.borderColor = 'var(--error-color)';
            content.style.backgroundColor = 'rgba(239, 68, 68, 0.1)';
            messageDiv.classList.add('error');
        }
        
        // Handle typing indicator styling
        if (message.isTyping) {
            content.classList.add('typing-content');
        }
        
        // Create message text container
        const messageText = document.createElement('div');
        messageText.className = 'message-text';
        
        if (message.isTyping) {
            messageText.innerHTML = this.createTypingAnimation();
        } else {
            messageText.innerHTML = this.formatMessageContent(message.content);
        }
        
        // Create timestamp
        const time = document.createElement('div');
        time.className = 'message-time';
        time.textContent = this.formatTime(message.timestamp);
        time.setAttribute('title', message.timestamp.toLocaleString('zh-CN'));
        
        // Add status indicator for user messages
        if (message.role === 'user' && message.status) {
            const statusIndicator = document.createElement('span');
            statusIndicator.className = 'message-status';
            statusIndicator.textContent = this.getStatusText(message.status);
            time.appendChild(statusIndicator);
        }
        
        // Assemble message structure
        content.appendChild(messageText);
        content.appendChild(time);
        messageDiv.appendChild(avatar);
        messageDiv.appendChild(content);
        
        return messageDiv;
    }

    /**
     * Format message content with basic formatting
     */
    formatMessageContent(content) {
        // Basic HTML escaping
        const escaped = content
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
        
        // Convert line breaks to <br>
        return escaped.replace(/\n/g, '<br>');
    }

    /**
     * Create typing animation
     */
    createTypingAnimation() {
        return `
            <div class="typing-dots">
                <span></span>
                <span></span>
                <span></span>
            </div>
        `;
    }

    /**
     * Get status text for messages
     */
    getStatusText(status) {
        const statusMap = {
            'sending': ' 发送中',
            'sent': ' 已发送',
            'received': ' 已接收',
            'error': ' 发送失败',
            'typing': ' 正在输入'
        };
        return statusMap[status] || '';
    }

    /**
     * Format timestamp for display
     */
    formatTime(timestamp) {
        return timestamp.toLocaleTimeString('zh-CN', {
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    /**
     * Add typing indicator
     */
    addTypingIndicator() {
        const typingMessage = {
            role: 'assistant',
            content: 'AI正在思考中...',
            timestamp: new Date(),
            status: 'typing',
            isTyping: true
        };
        
        const messageElement = this.createMessageElement(typingMessage);
        messageElement.classList.add('typing-indicator');
        this.elements.messageList.appendChild(messageElement);
        this.scrollToBottom();
        
        return messageElement;
    }

    /**
     * Remove typing indicator
     */
    removeTypingIndicator(typingElement) {
        if (typingElement && typingElement.parentNode) {
            typingElement.parentNode.removeChild(typingElement);
        }
    }

    /**
     * Scroll chat to bottom with smooth animation
     */
    scrollToBottom() {
        requestAnimationFrame(() => {
            const messageList = this.elements.messageList;
            const isAtBottom = messageList.scrollTop + messageList.clientHeight >= messageList.scrollHeight - 10;
            
            if (isAtBottom || this.messages.length <= 1) {
                messageList.scrollTo({
                    top: messageList.scrollHeight,
                    behavior: 'smooth'
                });
            }
        });
    }

    /**
     * Update send button state based on input content
     */
    updateSendButtonState() {
        const hasContent = this.elements.messageInput.value.trim().length > 0;
        const isEnabled = hasContent && !this.isLoading && this.isConfigured;
        
        this.elements.sendBtn.disabled = !isEnabled;
        this.elements.sendBtn.style.opacity = isEnabled ? '1' : '0.5';
    }

    /**
     * Set loading state
     */
    setLoading(loading) {
        this.isLoading = loading;
        this.updateSendButtonState();
        this.elements.messageInput.disabled = loading;
        
        if (loading) {
            this.elements.loadingIndicator.classList.add('show');
            this.elements.messageInput.placeholder = 'AI正在思考中...';
        } else {
            this.elements.loadingIndicator.classList.remove('show');
            this.elements.messageInput.placeholder = '输入您的AI学习问题...';
        }
    }

    /**
     * Open settings panel
     */
    openSettings() {
        this.elements.settingsPanel.classList.add('open');
        this.elements.settingsOverlay.classList.add('open');
        document.body.style.overflow = 'hidden';
        
        // Focus first input
        setTimeout(() => {
            this.elements.apiUrl.focus();
        }, 300);
    }

    /**
     * Close settings panel
     */
    closeSettings() {
        this.elements.settingsPanel.classList.remove('open');
        this.elements.settingsOverlay.classList.remove('open');
        document.body.style.overflow = '';
    }

    /**
     * Save configuration
     */
    async saveConfiguration(event) {
        event.preventDefault();
        
        const formData = new FormData(this.elements.settingsForm);
        const config = {
            apiUrl: formData.get('apiUrl'),
            apiKey: formData.get('apiKey'),
            modelName: formData.get('modelName')
        };

        // Basic validation
        if (!config.apiUrl || !config.apiKey || !config.modelName) {
            this.showToast('请填写所有必填字段', 'error');
            return;
        }

        try {
            this.setLoading(true);
            
            if (this.supabaseClient) {
                // Save to Supabase
                const { error } = await this.supabaseClient
                    .from('ai_configurations')
                    .upsert([{
                        api_url: config.apiUrl,
                        api_key: config.apiKey,
                        model_name: config.modelName,
                        updated_at: new Date().toISOString()
                    }]);
                
                if (error) throw error;
            } else {
                // Fallback to localStorage
                localStorage.setItem('aiLearningConfig', JSON.stringify(config));
            }
            
            this.isConfigured = true;
            this.showToast('配置保存成功！', 'success');
            this.closeSettings();
            
            // Show chat interface and welcome message
            this.showChatInterface();
            if (this.messages.length === 0) {
                this.showWelcomeMessage();
            }
            
        } catch (error) {
            console.error('Failed to save configuration:', error);
            this.showToast('保存配置失败，请重试', 'error');
        } finally {
            this.setLoading(false);
        }
    }

    /**
     * Test configuration
     */
    async testConfiguration() {
        const formData = new FormData(this.elements.settingsForm);
        const config = {
            apiUrl: formData.get('apiUrl'),
            apiKey: formData.get('apiKey'),
            modelName: formData.get('modelName')
        };

        // Basic validation
        if (!config.apiUrl || !config.apiKey || !config.modelName) {
            this.showToast('请填写所有字段以测试配置', 'error');
            return;
        }

        try {
            this.setLoading(true);
            
            // Test API call
            const response = await fetch(config.apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${config.apiKey}`
                },
                body: JSON.stringify({
                    model: config.modelName,
                    messages: [
                        {
                            role: 'user',
                            content: '你好，这是一个测试消息。'
                        }
                    ],
                    max_tokens: 10
                })
            });

            if (response.ok) {
                this.showToast('配置测试成功！API连接正常', 'success');
            } else {
                throw new Error(`API test failed: ${response.status}`);
            }
            
        } catch (error) {
            console.error('Failed to test configuration:', error);
            this.showToast('配置测试失败，请检查API设置', 'error');
        } finally {
            this.setLoading(false);
        }
    }

    /**
     * Show toast notification
     */
    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        
        this.elements.toastContainer.appendChild(toast);
        
        // Auto remove after 4 seconds
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 4000);
    }

    /**
     * Handle window resize
     */
    handleResize() {
        // Adjust chat interface height on mobile
        if (window.innerWidth <= 768) {
            const header = document.querySelector('.header');
            const inputArea = document.querySelector('.input-area');
            const headerHeight = header ? header.offsetHeight : 0;
            const inputHeight = inputArea ? inputArea.offsetHeight : 0;
            
            this.elements.chatInterface.style.height = `calc(100vh - ${headerHeight + inputHeight}px)`;
        }
    }
}

// Utility functions
const Utils = {
    /**
     * Debounce function calls
     */
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    /**
     * Check if device is mobile
     */
    isMobile() {
        return window.innerWidth <= 768;
    },

    /**
     * Format file size
     */
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
};

// Initialize application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Create global app instance
    window.aiLearningGuide = new AILearningGuide();
    
    // Handle window resize
    window.addEventListener('resize', Utils.debounce(() => {
        window.aiLearningGuide.handleResize();
    }, 250));
    
    // Handle online/offline status
    window.addEventListener('online', () => {
        window.aiLearningGuide.showToast('网络连接已恢复', 'success');
    });
    
    window.addEventListener('offline', () => {
        window.aiLearningGuide.showToast('网络连接已断开', 'warning');
    });
});

// Export for potential module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { AILearningGuide, Utils };
}