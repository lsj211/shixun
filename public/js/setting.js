document.addEventListener('DOMContentLoaded', () => {

    const steps = document.querySelectorAll('.setting-step');
    const nextButtons = document.querySelectorAll('.next-btn');
    const prevButtons = document.querySelectorAll('.prev-btn');
    const progressContainer = document.querySelector('.progress-container');
    const progressSteps = document.querySelectorAll('.progress-step');
    let currentMode = '';
    // 更新进度条状态
    function updateProgress(currentStep) {
        console.log('更新进度条，当前步骤:', currentStep);
        // 重置所有状态
        progressSteps.forEach(step => {
            step.classList.remove('completed', 'active');
        });
        
        // 设置已完成步骤
        for (let i = 0; i < currentStep - 1; i++) {
            if (progressSteps[i]) {
                progressSteps[i].classList.add('completed');
            }
        }
        
        // 设置当前步骤
        if (progressSteps[currentStep - 1]) {
            console.log('progressSteps 长度:', progressSteps.length);
            console.log('currentStep 值:', currentStep);
            console.log('设置当前步骤:', currentStep);
            // progressSteps[currentStep - 1].classList.add('active');
            console.log('设置当前步骤:', currentStep);
            progressSteps[currentStep - 1].classList.add('active');
        }
        
        // 更新连接线状态
        progressContainer.className = 'progress-container';
        if (currentStep > 1) {
            progressContainer.classList.add(`completed-step-${currentStep - 1}`);
        }
    }
    
    // 显示指定步骤
    function showStep(stepIndex) {
        steps.forEach((step, index) => {
            if (index === stepIndex) {
                step.classList.remove('hidden');
            } else {
                step.classList.add('hidden');
            }
        });
        updateProgress(stepIndex + 1); // 步骤索引从0开始，进度从1开始
    }
    
    // 下一步按钮事件
    nextButtons.forEach(button => {
        button.addEventListener('click', function() {
            let currentStep;
            if (currentMode === 'game') {
                currentStep = parseInt(this.closest('.setting-step').id.split('-')[2]);
            } else {
                console.log('当前模式:', currentMode);
                currentStep = parseInt(this.closest('.setting-step').id.split('-')[3]) + 4;
                console.log('当前步骤:', currentStep);
            }
            if (currentStep < steps.length) {
                showStep(currentStep);
            }
        });
    });
    
    // 上一步按钮事件
    prevButtons.forEach(button => {
        button.addEventListener('click', function() {
            let currentStep;
            if (currentMode === 'game') {
                currentStep = parseInt(this.closest('.setting-step').id.split('-')[2]);
            } else {
                currentStep = parseInt(this.closest('.setting-step').id.split('-')[3]) + 4;
            }
            if (currentStep > 1) {
                if (currentMode === 'game') {
                    showStep(currentStep - 2);
                } else {
                    showStep(currentStep - 3);
                }
            }
        });
    });

    // nextButtons.forEach(button => {
    //     button.addEventListener('click', function() {
    //         console.log('Next button clicked');
    //         const currentStep = parseInt(this.closest('.setting-step').id.split('-')[3]);
    //         console.log('Current step:', currentStep);
    //         if (currentStep < steps.length) {
    //             console.log('Showing step:', currentStep + 1);
    //             showStep(currentStep);
    //         }
    //     });
    // });
    
    // // 上一步按钮事件
    // prevButtons.forEach(button => {
    //     button.addEventListener('click', function() {
    //         const currentStep = parseInt(this.closest('.setting-step').id.split('-')[3]);
    //         if (currentStep > 1) {
    //             showStep(currentStep - 3);
    //         }
    //     });
    // });
    // 初始化显示第一步
    showStep(0);



        // 模式选择按钮
        const playModeBtn = document.getElementById('play-mode-btn');
        const createModeBtn = document.getElementById('create-mode-btn');
        const modeSelection = document.getElementById('mode-selection');
        const playModeSettings = document.getElementById('play-mode-settings');
        const createModeSettings = document.getElementById('create-mode-settings');
        const archiveSection = document.getElementById('archive-selection');
        const archiveSelect = document.getElementById('archive-select');
        const useArchiveBtn = document.getElementById('use-archive-btn');
        const newArchiveBtn = document.getElementById('new-archive-btn');

        // 当前模式标记
        // let currentMode = '';

        // 初始只显示模式选择区
        archiveSection.classList.add('hidden');
        modeSelection.classList.remove('hidden');

        playModeBtn.addEventListener('click', () => {
            currentMode = 'game';
            modeSelection.classList.add('hidden');
            archiveSection.classList.remove('hidden');
            renderArchiveList();
        });

        createModeBtn.addEventListener('click', () => {
            currentMode = 'create';
            modeSelection.classList.add('hidden');
            console.log('切换到创作模式');  
            archiveSection.classList.add('hidden');
           
        });

        // 渲染存档列表，按模式区分key
        function renderArchiveList() {
            const userId = JSON.parse(localStorage.getItem('token')).userId;
            let keyName = currentMode === 'game' ? `gameSettings_keys_${userId}` : 'creatorSettings_keys';
            const allKeys = JSON.parse(localStorage.getItem(keyName) || '[]');
            archiveSelect.innerHTML = '';
            if (allKeys.length > 0) {
                archiveSection.classList.remove('hidden');
                allKeys.forEach(key => {
                    const data = JSON.parse(localStorage.getItem(key) || '{}');
                    console.log(key)
                    const date = new Date(Number(key.replace(/.*_/, '')));
                    console.log(data)
                    const label = `${date.toLocaleString()} - ${data.title ? data.title : data.background.slice(0, 10)}`;
                    const option = document.createElement('option');
                    option.value = key;
                    option.textContent = label;
                    archiveSelect.appendChild(option);
                });
                useArchiveBtn.disabled = false;
                // 添加删除存档按钮（只添加一次）
                let deleteBtn = document.getElementById('delete-archive-btn');
                if (!deleteBtn) {
                    deleteBtn = document.createElement('button');
                    deleteBtn.id = 'delete-archive-btn';
                    deleteBtn.textContent = '删除当前存档';
                    deleteBtn.style.marginLeft = '12px';
                    useArchiveBtn.parentNode.appendChild(deleteBtn);

                    deleteBtn.onclick = () => {
                        const selectedKey = archiveSelect.value;
                        if (selectedKey && confirm('确定要删除该存档吗？')) {
                            // 删除存档
                            localStorage.removeItem(selectedKey);
                            // 更新key列表
                            let allKeys = JSON.parse(localStorage.getItem(keyName) || '[]');
                            allKeys = allKeys.filter(k => k !== selectedKey);
                            localStorage.setItem(keyName, JSON.stringify(allKeys));
                            // 如果当前存档被删，清除current
                            const currentKey = currentMode === 'game' ? `gameSettings_current_${userId}`: 'creatorSettings_current';
                            if (localStorage.getItem(currentKey) === selectedKey) {
                                localStorage.removeItem(currentKey);
                            }
                            // 刷新存档列表
                            renderArchiveList();
                        }
                    };
                } else {
                    deleteBtn.style.display = '';
                }
            } else {
                archiveSection.classList.remove('hidden');
                const emptyOption = document.createElement('option');
                emptyOption.textContent = '暂无存档';
                emptyOption.disabled = true;
                emptyOption.selected = true;
                archiveSelect.appendChild(emptyOption);
                useArchiveBtn.disabled = true;
                // 隐藏删除按钮
                const deleteBtn = document.getElementById('delete-archive-btn');
                if (deleteBtn) deleteBtn.style.display = 'none';
            }
        }

        // 使用所选存档
        useArchiveBtn.onclick = () => {
            const selectedKey = archiveSelect.value;
            if (selectedKey) {
                if (currentMode === 'game') {
                    const userId = JSON.parse(localStorage.getItem('token')).userId;
                    localStorage.setItem(`gameSettings_current_${userId}`, selectedKey);
                    window.location.href = `game.html?userId=${userId}&archive=${encodeURIComponent(selectedKey)}`;
                    // window.location.href = 'game.html?archive=' + encodeURIComponent(selectedKey);
                } else if (currentMode === 'create') {
                    localStorage.setItem('creatorSettings_current', selectedKey);
                    window.location.href = 'create.html?archive=' + encodeURIComponent(selectedKey);
                }
            }
        };

        // 创建新存档
        newArchiveBtn.onclick = () => {
            archiveSection.classList.add('hidden');
            if (currentMode === 'game') {
                playModeSettings.classList.remove('hidden');
                initPlayMode(gameSettings);
            } else if (currentMode === 'create') {
                createModeSettings.classList.remove('hidden');
                // 可在此处初始化创作模式
            }
        };

    // 模式选择按钮
    // const playModeBtn = document.getElementById('play-mode-btn');
    // const createModeBtn = document.getElementById('create-mode-btn');
    // const modeSelection = document.getElementById('mode-selection');
    // const playModeSettings = document.getElementById('play-mode-settings');
    // const createModeSettings = document.getElementById('create-mode-settings');
    
    // 创作模式类型选择
    const textBasedBtn = document.getElementById('create-mode-btn');
    const imageBasedBtn = document.getElementById('image-based-btn');
    const textBasedSettings = document.getElementById('text-based-settings');
    const imageBasedSettings = document.getElementById('image-based-settings');
    
    // API相关变量
    // const API_BASE_URL = 'http://localhost:3000/api';
    let isGeneratingBackground = false;
    let isGeneratingCharacters = false;
    
    // 游戏设置对象
    const gameSettings = {
        background: '',
        characters: [],
        complexity: 'medium',
        chapterCount: 5
    };
    


    // 封装游玩模式初始化为函数
    function initPlayMode(gameSettings) {
        // =================== 游玩模式设定步骤逻辑 ===================
        const playSteps = [
            document.getElementById('play-step-1'),
            document.getElementById('play-step-2'),
            document.getElementById('play-step-3'),
            document.getElementById('play-step-4')
        ];

        // 下一步按钮逻辑
        playSteps.forEach((step, index) => {
            if (index < playSteps.length - 1) {
                const nextBtn = step.querySelector('.next-btn');
                nextBtn.addEventListener('click', async () => {
                    // 当从第1步进入第2步时，生成角色
                    if (index === 0) {
                        // 保存背景设定
                        const backgroundText = document.getElementById('play-story-background').value.trim();
                        if (!backgroundText) {
                            alert('请输入故事背景');
                            return;
                        }

                        gameSettings.background = backgroundText;

                        // 尝试自动生成角色
                        try {
                            await generateCharactersFromBackground(backgroundText);
                        } catch (error) {
                            console.error('角色生成失败:', error);
                            // 即使生成失败也继续，用户可以手动输入
                        }
                    }

                    step.classList.add('hidden');
                    playSteps[index + 1].classList.remove('hidden');
                });
            }
        });

        // 上一步按钮逻辑
        playSteps.forEach((step, index) => {
            if (index > 0) {
                const prevBtn = step.querySelector('.prev-btn');
                prevBtn.addEventListener('click', () => {
                    step.classList.add('hidden');
                    playSteps[index - 1].classList.remove('hidden');
                });
            }
        });

        // 章节数滑块逻辑
        const playChapterCount = document.getElementById('play-chapter-count');
        const playChapterDisplay = document.getElementById('play-chapter-display');

        playChapterCount.addEventListener('input', () => {
            const count = playChapterCount.value;
            playChapterDisplay.textContent = `${count} 章`;
            gameSettings.chapterCount = parseInt(count);
        });

        // 复杂度选择逻辑
        const playComplexityOptions = document.getElementsByName('play-complexity');
        playComplexityOptions.forEach(option => {
            option.addEventListener('change', () => {
                if (option.checked) {
                    gameSettings.complexity = option.value;
                }
            });
        });

        // 添加角色按钮逻辑
        const playAddCharacterBtn = document.querySelector('#play-mode-settings .add-character-btn');
        const playCharactersContainer = document.getElementById('play-characters-container');

        playAddCharacterBtn.addEventListener('click', () => {
            addCharacterInput(playCharactersContainer);
        });

        // const userId = JSON.parse(localStorage.getItem('token')).userId;
        const tokenStr = localStorage.getItem('token');
        if (!tokenStr) {
            throw new Error('未找到 token，请重新登录');
        }
        
        const token = JSON.parse(tokenStr);
        console.log('token:', token);
        if (!token.userId) {
            throw new Error('token 格式错误，缺少 userId');
        }
        
        const userId = token.userId;
        // 开始游戏按钮逻辑
        const startGameBtn = document.querySelector('.start-game-btn');
        startGameBtn.addEventListener('click', () => {
            // 收集所有设置
            collectGameSettings();

            // 生成唯一key（如用时间戳）
            // const key = 'gameSettings_' + Date.now();
            // localStorage.setItem(key, JSON.stringify(gameSettings));

            // // 设置当前存档键
            // localStorage.setItem('gameSettings_current', key); // 添加此行
            
            // // 可选：记录所有key，方便管理
            // let allKeys = JSON.parse(localStorage.getItem('gameSettings_keys') || '[]');
            // allKeys.push(key);
            // localStorage.setItem('gameSettings_keys', JSON.stringify(allKeys));

            // // 跳转到游戏页面
            // window.location.href = 'game.html?archive=' + encodeURIComponent(key);

            // 生成带用户ID前缀的唯一key
            const key = `gameSettings_${userId}_${Date.now()}`;
            localStorage.setItem(key, JSON.stringify(gameSettings));

            // 设置当前存档键（带用户ID）
            localStorage.setItem(`gameSettings_current_${userId}`, key);
            
            // 只存储当前用户的存档键列表
            let userKeys = JSON.parse(localStorage.getItem(`gameSettings_keys_${userId}`) || '[]');
            userKeys.push(key);
            localStorage.setItem(`gameSettings_keys_${userId}`, JSON.stringify(userKeys));

            // 跳转到游戏页面，携带用户ID和存档key
            window.location.href = `game.html?userId=${userId}&archive=${encodeURIComponent(key)}`;
        });
    }
    


const createSteps = [
        document.getElementById('create-text-step-1'),
        document.getElementById('create-text-step-2'),
        // document.getElementById('create-text-step-3'),
        document.getElementById('create-text-step-4')
    ];

    // 下一步按钮逻辑
    createSteps.forEach((step, index) => {
        if (index < createSteps.length - 1) {
            const nextBtn = step.querySelector('.next-btn');
            if (!nextBtn) return;
            nextBtn.addEventListener('click', async () => {
                // 步骤1校验
                if (index === 0) {
                    const backgroundText = document.getElementById('create-story-background').value.trim();
                    if (!backgroundText) {
                        alert('请输入故事背景');
                        return;
                    }
                    
                    // 在创作模式的步骤1进入步骤2时，生成角色
                    if (index === 0) {
                        try {
                            await generateCharactersForCreation(backgroundText);
                        } catch (error) {
                            console.error('创作模式角色生成失败:', error);
                        }
                    }
                }
                
                step.classList.add('hidden');
                createSteps[index + 1].classList.remove('hidden');
            });
        }
    });

     nextButtons.forEach(button => {
        button.addEventListener('click', function() {
            const currentStep = parseInt(this.closest('.setting-step').id.split('-')[2]);
            if (currentStep < steps.length) {
                showStep(currentStep);
            }
        });
    });
    // 上一步按钮逻辑
    createSteps.forEach((step, index) => {
        if (index > 0) {
            const prevBtn = step.querySelector('.prev-btn');
            if (!prevBtn) return;
            prevBtn.addEventListener('click', () => {
                step.classList.add('hidden');
                createSteps[index - 1].classList.remove('hidden');
            });
        }
    });

    // 章节数滑块逻辑
    const createChapterCount = document.getElementById('create-chapter-count');
    const createChapterDisplay = document.getElementById('create-chapter-display');
    if (createChapterCount && createChapterDisplay) {
        createChapterCount.addEventListener('input', () => {
            createChapterDisplay.textContent = `${createChapterCount.value} 章`;
            console.log(`章节数设置为: ${createChapterCount.value}`);
        });
    }

    // 复杂度选择逻辑
    const createComplexityOptions = document.getElementsByName('create-complexity');
    createComplexityOptions.forEach(option => {
        option.addEventListener('change', () => {
            if (option.checked) {
                // 可存储到全局设置
            }
        });
    });

    // 添加角色按钮
    const addCharacterBtn = document.querySelector('#create-text-step-2 .add-character-btn');
    const createCharactersContainer = document.getElementById('create-characters-container');
    if (addCharacterBtn && createCharactersContainer) {
        addCharacterBtn.addEventListener('click', () => {
            addCharacterInput(createCharactersContainer);
        });
    }

    // 生成角色按钮（新增）
    const generateCharactersBtn = document.querySelector('#create-text-step-1 .generate-characters-btn');
    if (generateCharactersBtn && createCharactersContainer) {
        generateCharactersBtn.addEventListener('click', async () => {
            const backgroundText = document.getElementById('create-story-background').value.trim();
            if (!backgroundText) {
                alert('请先输入故事背景');
                return;
            }
            
            try {
                await generateCharactersForCreation(backgroundText);
            } catch (error) {
                console.error('创作模式角色生成失败:', error);
                alert('角色生成失败，请重试');
            }
        });
    }

    
   // 开始创作按钮
// const startBtn = document.querySelector('#create-text-step-4 .start-creation-btn');
// if (startBtn) {
//     startBtn.addEventListener('click', async () => {
//         console.log('开始创作按钮被点击');
//         // 收集所有设置
//         const settings = {
//             mode: 'creative',
//             type: 'text',
//             background: document.getElementById('create-story-background').value,
//             complexity: document.querySelector('input[name="create-complexity"]:checked').value,
//             chapterCount: document.getElementById('create-chapter-count').value, // 获取章节数
//             characters: []
//         };
//         document.querySelectorAll('#create-characters-container .character-input').forEach(input => {
//             const name = input.querySelector('.character-name').value.trim();
//             const desc = input.querySelector('.character-desc').value.trim();
//             if (name || desc) {
//                 settings.characters.push({ name: name || '未命名角色', description: desc });
//             }
//         });

        
//     });
// }
 const startBtn = document.querySelector('#create-text-step-4 .start-creation-btn');
    if (startBtn) {
        startBtn.addEventListener('click', () => {
            // 收集所有设置
            const settings = {
                mode: 'creative',
                type: 'text',
                background: document.getElementById('create-story-background').value,
                // complexity: document.querySelector('input[name="create-complexity"]:checked').value,
                chapterCount: document.getElementById('create-chapter-count').value,
                characters: []
            };
            document.querySelectorAll('#create-characters-container .character-input').forEach(input => {
                const name = input.querySelector('.character-name').value.trim();
                const desc = input.querySelector('.character-desc').value.trim();
                if (name || desc) {
                    settings.characters.push({ name: name || '未命名角色', description: desc });
                }
            });
            // 存储设置
            localStorage.setItem('creatorsettings', JSON.stringify(settings));
            // 跳转
            window.location.href = 'creator.html';
        });
        
    }

    // 进入创作模式时显示第1步
    if (createModeBtn) {
        createModeBtn.addEventListener('click', () => {
            document.getElementById('mode-selection').classList.add('hidden');
            document.getElementById('create-mode-settings').classList.remove('hidden');
            // 显示第1步，隐藏其他
            createSteps.forEach((step, idx) => {
                if (idx === 0) step.classList.remove('hidden');
                else step.classList.add('hidden');
            });
            // 初始化角色区
            if (createCharactersContainer) createCharactersContainer.innerHTML = '';
        });
    }



    // =================== 辅助函数 ===================
    
    // 添加角色输入框
    function addCharacterInput(container, name = '', description = '') {
        // 处理可能是对象的description
        const formattedDescription = formatCharacterDescription(description);
        
        const characterInput = document.createElement('div');
        characterInput.className = 'character-input';
        
        characterInput.innerHTML = `
            <div class="character-header">
                <input type="text" class="character-name" placeholder="角色名称" value="${name ? escapeHtml(name) : ''}">
                <button class="remove-character-btn"><i class="fas fa-times"></i></button>
            </div>
            <textarea class="character-desc" placeholder="角色描述...">${formattedDescription ? escapeHtml(formattedDescription) : ''}</textarea>
        `;
        
        container.appendChild(characterInput);
        
        // 删除角色按钮逻辑
        const removeBtn = characterInput.querySelector('.remove-character-btn');
        removeBtn.addEventListener('click', () => {
            container.removeChild(characterInput);
        });
    }
    
    // 转义HTML特殊字符，防止XSS
    function escapeHtml(text) {
        if (!text) return '';
        return String(text)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }
    
    // 收集游戏设置
    function collectGameSettings() {
        // 收集背景
        gameSettings.background = document.getElementById('play-story-background').value;
        
        // 收集复杂度
        document.getElementsByName('play-complexity').forEach(option => {
            if (option.checked) {
                gameSettings.complexity = option.value;
            }
        });
        
        // 收集章节数
        gameSettings.chapterCount = parseInt(document.getElementById('play-chapter-count').value);
        
        // 收集角色
        gameSettings.characters = [];
        const characterInputs = document.querySelectorAll('#play-characters-container .character-input');
        characterInputs.forEach(input => {
            const name = input.querySelector('.character-name').value.trim();
            const description = input.querySelector('.character-desc').value.trim();
            
            if (name || description) {
                gameSettings.characters.push({
                    name: name || '未命名角色',
                    description: description
                });
            }
        });
    }
    
    // =================== API调用函数 ===================
    
    // 从背景自动生成角色
    async function generateCharactersFromBackground(background) {
        // 防止重复生成
        if (isGeneratingCharacters) return;
        
        try {
            isGeneratingCharacters = true;
            console.log("开始生成角色，背景:", background); // 添加调试日志
            
            // 清空现有角色输入框，添加一个"正在生成"的提示
            const charactersContainer = document.getElementById('play-characters-container');
            charactersContainer.innerHTML = `
                <div class="generating-message">
                    <i class="fas fa-spinner fa-spin"></i> 正在根据故事背景生成角色...
                </div>
            `;
            
            // 基本错误检查
            if (!background || background.trim().length < 5) {
                throw new Error('故事背景太短，无法生成有意义的角色');
            }
            
            // // 添加默认角色作为备用
            // const timeoutId = setTimeout(() => {
            //     // 先检查是否已经完成生成
            //     if (!isGeneratingCharacters) return;
                
            //     console.log("生成超时，创建默认角色..."); // 调试日志
                
            //     // 如果30秒后还在生成中，则使用默认角色
            //     charactersContainer.innerHTML = '';
            //     addCharacterInput(charactersContainer, "主角", "这是故事的主角，你可以编辑名称和描述。");
            //     addCharacterInput(charactersContainer, "配角", "这是故事的配角，你可以编辑名称和描述。");
                
            //     // 标记为已完成，避免重复处理
            //     isGeneratingCharacters = false;
            // }, 300000); // 30秒超时
            
            console.log("准备调用API..."); // 调试日志
            
            try {
                // 调用API获取角色
                const response = await fetch('/api/generate-characters', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        background: background,
                        complexity: gameSettings.complexity || 'medium',
                        characterCount: 3 // 默认生成3个角色
                    })
                });
                
                // 检查响应状态
                if (!response.ok) {
                    const errorText = await response.text();
                    console.error(`API请求失败，状态码: ${response.status}，错误: ${errorText}`);
                    throw new Error(`API请求失败，状态码: ${response.status}`);
                }
                
                // 检查响应类型，是否为SSE
                const contentType = response.headers.get('Content-Type');
                
                if (contentType && contentType.includes('text/event-stream')) {
                    // 是SSE流，需要逐行处理
                    console.log("收到SSE流响应，开始处理...");
                    
                    // 清除超时计时器
                    clearTimeout(timeoutId);
                    
                    // 创建临时容器来显示生成过程
                    const tempContainer = document.createElement('div');
                    tempContainer.className = 'character-stream-container';
                    tempContainer.style.backgroundColor = '#f9f9f9';
                    tempContainer.style.border = '1px solid #ddd';
                    tempContainer.style.borderRadius = '5px';
                    tempContainer.style.padding = '10px';
                    tempContainer.style.margin = '10px 0';
                    tempContainer.style.maxHeight = '300px';
                    tempContainer.style.overflowY = 'auto';
                    tempContainer.innerHTML = '<div class="stream-title">正在生成角色：</div><div class="stream-content"></div>';
                    
                    // 替换原有的生成消息
                    charactersContainer.innerHTML = '';
                    charactersContainer.appendChild(tempContainer);
                    
                    const streamContent = tempContainer.querySelector('.stream-content');
                    
                    // 处理流数据
                    const reader = response.body.getReader();
                    const decoder = new TextDecoder('utf-8');
                    let completeText = '';
                    let buffer = '';
                    
                    while (true) {
                        const { done, value } = await reader.read();
                        
                        if (done) {
                            console.log("SSE流读取完成");
                            break;
                        }
                        
                        // 解码收到的数据
                        const chunk = decoder.decode(value, { stream: true });
                        buffer += chunk;
                        
                        // 处理缓冲区中的完整行
                        const lines = buffer.split('\n');
                        // 保留最后一个可能不完整的行
                        buffer = lines.pop() || '';
                        
                        for (const line of lines) {
                            if (line.trim() === '') continue; // 忽略空行
                            
                            if (line.startsWith('data: ')) {
                                try {
                                    // 解析事件数据
                                    const eventData = JSON.parse(line.substring(6));
                                    
                                    if (eventData.text) {
                                        completeText += eventData.text;
                                        streamContent.textContent = completeText;
                                        // 自动滚动到底部
                                        tempContainer.scrollTop = tempContainer.scrollHeight;
                                    }
                                    
                                    if (eventData.done) {
                                        console.log("收到流结束标记");
                                    }
                                } catch (parseError) {
                                    console.error("解析事件数据失败:", parseError, line);
                                }
                            }
                        }
                    }
                    
                    // 流处理完成，移除临时容器
                    tempContainer.remove();
                    
                    // 解析生成的文本，提取角色
                    console.log("开始从文本中解析角色:", completeText);
                    let characters;
                    
                    try {
                        characters = extractCharactersFromText(completeText);
                        
                        // 验证提取的角色
                        if (characters && Array.isArray(characters) && characters.length > 0) {
                            console.log("成功提取角色:", characters);
                            
                            // 验证角色数据的有效性
                            characters = characters.filter(char => {
                                const hasName = char && char.name && typeof char.name === 'string' && char.name.length > 0;
                                const hasDesc = char && char.description && typeof char.description === 'string';
                                return hasName || hasDesc; // 至少有名字或描述
                            });
                        }
                        
                        // 确保至少有一个角色
                        if (!characters || !Array.isArray(characters) || characters.length === 0) {
                            console.warn("无有效角色数据，使用默认角色");
                            characters = [
                                { name: "主角", description: "这是故事的主角，请编辑描述。" },
                                { name: "配角", description: "这是故事的配角，请编辑描述。" }
                            ];
                        }
                    } catch (parseError) {
                        console.error("解析角色数据失败:", parseError);
                        characters = [
                            { name: "主角", description: "这是故事的主角，请编辑描述。" },
                            { name: "配角", description: "这是故事的配角，请编辑描述。" }
                        ];
                    }
                    
                    // 为每个角色添加输入框
                    characters.forEach(char => {
                        addCharacterInput(charactersContainer, char.name, char.description);
                    });
                } else {
                    // 尝试作为JSON解析
                    try {
                        console.log("尝试作为JSON解析响应");
                        const data = await response.json();
                        console.log("API响应成功:", data); // 调试日志
                        
                        // 清除超时计时器
                        clearTimeout(timeoutId);
                        
                        // 清除生成中消息
                        charactersContainer.innerHTML = '';
                        
                        // 处理返回的角色
                        if (data && data.characters && Array.isArray(data.characters)) {
                            // 有效的角色数据
                            data.characters.forEach(char => {
                                addCharacterInput(
                                    charactersContainer, 
                                    char.name || '未命名角色', 
                                    char.description || '请描述这个角色...'
                                );
                            });
                        } else {
                            // 无有效数据，创建默认角色
                            addCharacterInput(charactersContainer, "主角", "请描述主角...");
                            addCharacterInput(charactersContainer, "配角", "请描述配角...");
                        }
                    } catch (jsonError) {
                        console.error("JSON解析失败，尝试作为文本处理:", jsonError);
                        
                        // 清除超时计时器
                        clearTimeout(timeoutId);
                        
                        // 尝试作为纯文本处理
                        const text = await response.text();
                        console.log("收到的原始响应:", text);
                        
                        // 尝试提取文本中的角色
                        const characters = extractCharactersFromText(text);
                        
                        // 清除生成中消息
                        charactersContainer.innerHTML = '';
                        
                        if (characters && characters.length > 0) {
                            // 添加提取到的角色
                            characters.forEach(char => {
                                addCharacterInput(charactersContainer, char.name, char.description);
                            });
                        } else {
                            // 无法提取，使用默认角色
                            addCharacterInput(charactersContainer, "主角", "请描述主角...");
                            addCharacterInput(charactersContainer, "配角", "请描述配角...");
                        }
                    }
                }
            } catch (apiError) {
                console.error("API调用失败:", apiError); // 调试日志
                
                // 清除超时计时器
                clearTimeout(timeoutId);
                
                // API调用失败，添加默认角色
                charactersContainer.innerHTML = '';
                addCharacterInput(charactersContainer, "主角", "这是故事的主角，你可以编辑名称和描述。");
                addCharacterInput(charactersContainer, "配角", "这是故事的配角，你可以编辑名称和描述。");
                
                // 显示友好的错误信息
                const errorMsg = document.createElement('div');
                errorMsg.className = 'error-message';
                errorMsg.style.color = 'red';
                errorMsg.style.marginBottom = '10px';
                errorMsg.textContent = '自动生成角色失败，已添加默认角色，您可以手动编辑。';
                charactersContainer.insertBefore(errorMsg, charactersContainer.firstChild);
            }
        } catch (error) {
            console.error('生成角色失败:', error); // 调试日志
            
            // 移除生成消息，添加默认角色
            const charactersContainer = document.getElementById('play-characters-container');
            charactersContainer.innerHTML = '';
            addCharacterInput(charactersContainer, "主角", "这是故事的主角，你可以编辑名称和描述。");
            addCharacterInput(charactersContainer, "配角", "这是故事的配角，你可以编辑名称和描述。");
            
            // 显示错误信息
            alert('自动生成角色失败，已添加默认角色，您可以手动编辑。');
        } finally {
            isGeneratingCharacters = false;
        }
    }

    // 从图片生成背景和角色设定
    async function generateContentFromImages(imageFiles) {
        // 实际项目中，这里应该上传图片到服务器，然后调用AI进行分析
        // 这里我们只是简单模拟一下
        
        document.getElementById('image-background').value = '根据上传的图片生成的背景故事...';
        document.getElementById('image-characters').value = '根据上传的图片生成的角色设定...';
    }





    async function generateCharactersForCreation(background) {
        // 防止重复生成
        if (isGeneratingCharacters) return;
        
        try {
            isGeneratingCharacters = true;
            console.log("创作模式开始生成角色，背景:", background);
            
            // 清空现有角色输入框，添加一个"正在生成"的提示
            const charactersContainer = document.getElementById('create-characters-container');
            charactersContainer.innerHTML = `
                <div class="generating-message">
                    <i class="fas fa-spinner fa-spin"></i> 正在根据故事背景生成角色...
                </div>
            `;
            
            // 基本错误检查
            if (!background || background.trim().length < 5) {
                throw new Error('故事背景太短，无法生成有意义的角色');
            }
            
            // 添加默认角色作为备用
            const timeoutId = setTimeout(() => {
                // 先检查是否已经完成生成
                if (!isGeneratingCharacters) return;
                
                console.log("创作模式生成超时，创建默认角色...");
                
                // 如果30秒后还在生成中，则使用默认角色
                charactersContainer.innerHTML = '';
                addCharacterInput(charactersContainer, "主角", "这是故事的主角，你可以编辑名称和描述。");
                addCharacterInput(charactersContainer, "配角", "这是故事的配角，你可以编辑名称和描述。");
                
                // 标记为已完成，避免重复处理
                isGeneratingCharacters = false;
            }, 30000); // 30秒超时
            
            try {
                // 调用API获取角色 - 与游玩模式相同的API
                const response = await fetch('/api/generate-characters', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        background: background,
                        complexity: document.querySelector('input[name="create-complexity"]:checked')?.value || 'medium',
                        characterCount: 3 // 默认生成3个角色
                    })
                });
                
                // 检查响应状态
                if (!response.ok) {
                    const errorText = await response.text();
                    console.error(`创作模式API请求失败，状态码: ${response.status}，错误: ${errorText}`);
                    throw new Error(`API请求失败，状态码: ${response.status}`);
                }
                
                // 检查响应类型，是否为SSE
                const contentType = response.headers.get('Content-Type');
                
                if (contentType && contentType.includes('text/event-stream')) {
                    // 是SSE流，需要逐行处理
                    console.log("创作模式收到SSE流响应，开始处理...");
                    
                    // 清除超时计时器
                    clearTimeout(timeoutId);
                    
                    // 创建临时容器来显示生成过程
                    const tempContainer = document.createElement('div');
                    tempContainer.className = 'character-stream-container';
                    tempContainer.style.backgroundColor = '#f9f9f9';
                    tempContainer.style.border = '1px solid #ddd';
                    tempContainer.style.borderRadius = '5px';
                    tempContainer.style.padding = '10px';
                    tempContainer.style.margin = '10px 0';
                    tempContainer.style.maxHeight = '300px';
                    tempContainer.style.overflowY = 'auto';
                    tempContainer.innerHTML = '<div class="stream-title">正在生成角色：</div><div class="stream-content"></div>';
                    
                    // 替换原有的生成消息
                    charactersContainer.innerHTML = '';
                    charactersContainer.appendChild(tempContainer);
                    
                    const streamContent = tempContainer.querySelector('.stream-content');
                    
                    // 处理流数据
                    const reader = response.body.getReader();
                    const decoder = new TextDecoder('utf-8');
                    let completeText = '';
                    let buffer = '';
                    
                    while (true) {
                        const { done, value } = await reader.read();
                        
                        if (done) {
                            console.log("创作模式SSE流读取完成");
                            break;
                        }
                        
                        // 解码收到的数据
                        const chunk = decoder.decode(value, { stream: true });
                        buffer += chunk;
                        
                        // 处理缓冲区中的完整行
                        const lines = buffer.split('\n');
                        // 保留最后一个可能不完整的行
                        buffer = lines.pop() || '';
                        
                        for (const line of lines) {
                            if (line.trim() === '') continue; // 忽略空行
                            
                            if (line.startsWith('data: ')) {
                                try {
                                    // 解析事件数据
                                    const eventData = JSON.parse(line.substring(6));
                                    
                                    if (eventData.text) {
                                        completeText += eventData.text;
                                        streamContent.textContent = completeText;
                                        // 自动滚动到底部
                                        tempContainer.scrollTop = tempContainer.scrollHeight;
                                    }
                                    
                                    if (eventData.done) {
                                        console.log("收到流结束标记");
                                    }
                                } catch (parseError) {
                                    console.error("创作模式解析事件数据失败:", parseError, line);
                                }
                            }
                        }
                    }
                    
                    // 流处理完成，移除临时容器
                    tempContainer.remove();
                    
                    // 解析生成的文本，提取角色
                    console.log("创作模式开始从文本中解析角色:", completeText);
                    let characters;
                    
                    try {
                        characters = extractCharactersFromText(completeText);
                        
                        // 验证提取的角色
                        if (characters && Array.isArray(characters) && characters.length > 0) {
                            console.log("创作模式成功提取角色:", characters);
                            
                            // 验证角色数据的有效性
                            characters = characters.filter(char => {
                                const hasName = char && char.name && typeof char.name === 'string' && char.name.length > 0;
                                const hasDesc = char && char.description && typeof char.description === 'string';
                                return hasName || hasDesc; // 至少有名字或描述
                            });
                        }
                        
                        // 确保至少有一个角色
                        if (!characters || !Array.isArray(characters) || characters.length === 0) {
                            console.warn("创作模式无有效角色数据，使用默认角色");
                            characters = [
                                { name: "主角", description: "这是故事的主角，请编辑描述。" },
                                { name: "配角", description: "这是故事的配角，请编辑描述。" }
                            ];
                        }
                    } catch (parseError) {
                        console.error("创作模式解析角色数据失败:", parseError);
                        characters = [
                            { name: "主角", description: "这是故事的主角，请编辑描述。" },
                            { name: "配角", description: "这是故事的配角，请编辑描述。" }
                        ];
                    }
                    
                    // 为每个角色添加输入框
                    characters.forEach(char => {
                        addCharacterInput(charactersContainer, char.name, char.description);
                    });
                } else {
                    // 尝试作为JSON解析
                    try {
                        console.log("创作模式尝试作为JSON解析响应");
                        const data = await response.json();
                        console.log("创作模式API响应成功:", data);
                        
                        // 清除超时计时器
                        clearTimeout(timeoutId);
                        
                        // 清除生成中消息
                        charactersContainer.innerHTML = '';
                        
                        // 处理返回的角色
                        if (data && data.characters && Array.isArray(data.characters)) {
                            // 有效的角色数据
                            data.characters.forEach(char => {
                                addCharacterInput(
                                    charactersContainer, 
                                    char.name || '未命名角色', 
                                    char.description || '请描述这个角色...'
                                );
                            });
                        } else {
                            // 无有效数据，创建默认角色
                            addCharacterInput(charactersContainer, "主角", "请描述主角...");
                            addCharacterInput(charactersContainer, "配角", "请描述配角...");
                        }
                    } catch (jsonError) {
                        console.error("创作模式JSON解析失败，尝试作为文本处理:", jsonError);
                        
                        // 清除超时计时器
                        clearTimeout(timeoutId);
                        
                        // 尝试作为纯文本处理
                        const text = await response.text();
                        console.log("创作模式收到的原始响应:", text);
                        
                        // 尝试提取文本中的角色
                        const characters = extractCharactersFromText(text);
                        
                        // 清除生成中消息
                        charactersContainer.innerHTML = '';
                        
                        if (characters && characters.length > 0) {
                            // 添加提取到的角色
                            characters.forEach(char => {
                                addCharacterInput(charactersContainer, char.name, char.description);
                            });
                        } else {
                            // 无法提取，使用默认角色
                            addCharacterInput(charactersContainer, "主角", "请描述主角...");
                            addCharacterInput(charactersContainer, "配角", "请描述配角...");
                        }
                    }
                }
            } catch (apiError) {
                console.error("创作模式API调用失败:", apiError);
                
                // 清除超时计时器
                clearTimeout(timeoutId);
                
                // API调用失败，添加默认角色
                charactersContainer.innerHTML = '';
                addCharacterInput(charactersContainer, "主角", "这是故事的主角，你可以编辑名称和描述。");
                addCharacterInput(charactersContainer, "配角", "这是故事的配角，你可以编辑名称和描述。");
                
                // 显示友好的错误信息
                const errorMsg = document.createElement('div');
                errorMsg.className = 'error-message';
                errorMsg.style.color = 'red';
                errorMsg.style.marginBottom = '10px';
                errorMsg.textContent = '自动生成角色失败，已添加默认角色，您可以手动编辑。';
                charactersContainer.insertBefore(errorMsg, charactersContainer.firstChild);
            }
        } catch (error) {
            console.error('创作模式生成角色失败:', error);
            
            // 移除生成消息，添加默认角色
            const charactersContainer = document.getElementById('create-characters-container');
            charactersContainer.innerHTML = '';
            addCharacterInput(charactersContainer, "主角", "这是故事的主角，你可以编辑名称和描述。");
            addCharacterInput(charactersContainer, "配角", "这是故事的配角，你可以编辑名称和描述。");
            
            // 显示错误信息
            alert('自动生成角色失败，已添加默认角色，您可以手动编辑。');
        } finally {
            isGeneratingCharacters = false;
        }
    }






    // =================== 图片上传逻辑 ===================
    const imageUpload = document.getElementById('image-upload');
    const imagePreviewContainer = document.getElementById('image-preview-container');
    
    imageUpload.addEventListener('change', (e) => {
        const files = e.target.files;
        
        // 清空预览容器
        imagePreviewContainer.innerHTML = '';
        
        // 为每个文件创建预览
        Array.from(files).forEach(file => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                const preview = document.createElement('div');
                preview.className = 'image-preview';
                preview.innerHTML = `
                    <img src="${e.target.result}" alt="预览">
                    <div class="image-name">${file.name}</div>
                `;
                imagePreviewContainer.appendChild(preview);
            };
            
            reader.readAsDataURL(file);
        });
    });

    // =================== 创作模式类型选择逻辑 ===================
    textBasedBtn.addEventListener('click', () => {
        textBasedSettings.classList.remove('hidden');
        imageBasedSettings.classList.add('hidden');
        
        // 显示第一步
        document.getElementById('create-text-step-1').classList.remove('hidden');
        
        // 移除可能存在的重复结构，避免冲突
        const oldModeSettings = document.getElementById('createModeSettings');
        if (oldModeSettings) {
            oldModeSettings.classList.add('hidden');
        }
    });
    
    // 添加类似的逻辑处理创作模式的步骤导航和数据收集
    // 这部分代码与游玩模式类似，这里省略...
    
    // 如果有第一次进入，则自动生成更丰富的背景描述
    const backgroundInputs = document.querySelectorAll('#play-story-background, #create-story-background');
    backgroundInputs.forEach(input => {
        input.dataset.firstGenerated = "false";
        input.addEventListener('blur', async function() {
            const text = this.value.trim();
            if (text.length > 0&& this.dataset.firstGenerated === "false"&& currentMode=="game") {
                try {
                    const enhancedBackground = await generateEnhancedBackground(text);
                    if (enhancedBackground && confirm('我们生成了更详细的背景描述，是否替换当前内容？')) {
                        this.value = enhancedBackground;
                        this.dataset.firstGenerated = "true"; // 标记为已生成
                    }
                } catch (error) {
                    console.error('生成增强背景失败:', error);
                    // 如果失败，不做任何操作，保留用户输入的内容
                }
            }
        });
    });
    
    // 生成增强的背景描述 - 简化版，只拓展初始输入
async function generateEnhancedBackground(basicBackground) {
    // 防止重复生成
    if (isGeneratingBackground) return null;
    
    try {
        isGeneratingBackground = true;
        
        // 显示加载指示器
        const backgroundInput = document.getElementById('play-story-background');
        const streamContainer = document.createElement('div');
        streamContainer.className = 'background-stream-container';
        streamContainer.style.backgroundColor = '#f9f9f9';
        streamContainer.style.border = '1px solid #ddd';
        streamContainer.style.borderRadius = '5px';
        streamContainer.style.padding = '10px';
        streamContainer.style.margin = '10px 0';
        streamContainer.style.maxHeight = '300px';
        streamContainer.style.overflowY = 'auto';
        streamContainer.innerHTML = '<div class="stream-title">正在拓展背景描述：</div><div class="stream-content"></div>';
        
        backgroundInput.parentNode.insertBefore(streamContainer, backgroundInput.nextSibling);
        const streamContent = streamContainer.querySelector('.stream-content');
        
        // 修改请求体，添加必要的 chapterCount 参数
        const response = await fetch('/api/enhance-background', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                background: basicBackground,
                complexity: gameSettings.complexity || 'medium',
                chapterCount: gameSettings.chapterCount || 5, // 添加章节数参数
                enhance_only: true // 标记仅做简单拓展
            })
        });
        if (!response.body) {
            throw new Error('ReadableStream not supported in this browser.');
        }
        
        const reader = response.body.getReader();
        const decoder = new TextDecoder('utf-8');
        let generatedText = '';
        
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            
            const chunkText = decoder.decode(value, { stream: true });
            const lines = chunkText.split('\n');
            
            lines.forEach(line => {
                if (line.startsWith('data: ')) {
                    try {
                        const data = JSON.parse(line.substring(6));
                        if (!data.done) {
                            generatedText += data.text;
                            streamContent.textContent = generatedText;
                            // 自动滚动到底部
                            streamContainer.scrollTop = streamContainer.scrollHeight;
                        }
                    } catch (e) {
                        console.error('解析流数据失败:', e);
                    }
                }
            });
        }
        
        // 移除流式显示容器
        streamContainer.remove();
        
        return generatedText;
        
    } catch (error) {
        console.error('生成增强背景失败:', error);
        
        // 移除流式显示容器
        const streamContainer = document.querySelector('.background-stream-container');
        if (streamContainer) streamContainer.remove();
        
        alert('背景拓展失败，请稍后重试');
        return null;
        
    } finally {
        isGeneratingBackground = false;
    }
}

    // 添加CSS样式
    const style = document.createElement('style');
    style.textContent = `
        .generating-message, .generating-background {
            padding: 15px;
            background-color: #f5f5f5;
            border: 1px solid #ddd;
            border-radius: 5px;
            margin: 10px 0;
            text-align: center;
            color: #666;
        }
        
        .generating-message i, .generating-background i {
            margin-right: 10px;
            color: #4CAF50;
        }
    `;
    document.head.appendChild(style);
    
    // 格式化角色描述
    function formatCharacterDescription(description) {
        if (!description) return "";
        
        // 如果是字符串，直接返回
        if (typeof description === 'string') {
            return description;
        }
        
        // 如果是对象，尝试格式化
        if (typeof description === 'object') {
            try {
                // 如果是数组，转换为字符串
                if (Array.isArray(description)) {
                    return description.join("\n");
                }
                
                // 处理对象格式
                let result = '';
                
                // 如果有常见字段，尝试结构化展示
                if (description.name || description.身份 || description.性格 || description.背景) {
                    // 处理常见的角色描述字段
                    const fields = {
                        '角色名称': description['角色名称'] || description['name'],
                        '角色身份/职业': description['角色身份'] || description['职业'] || description['身份/职业'] || description['身份'],
                        '性格特点': description['性格特点'] || description['性格'] || description['特点'],
                        '背景故事': description['背景故事'] || description['背景'] || description['故事'],
                        '关系': description['关系'] || description['与其他角色的关系']
                    };
                    
                    // 构建格式化文本
                    for (const [key, value] of Object.entries(fields)) {
                        if (value) {
                            result += `${key}：${value}\n`;
                        }
                    }
                } else {
                    // 通用对象展示
                    for (const [key, value] of Object.entries(description)) {
                        if (value && key !== 'name') { // 跳过name字段，因为它已在角色名中使用
                            result += `${key}：${value}\n`;
                        }
                    }
                }
                
                // 如果以上处理没有提取到内容，则使用JSON字符串
                return result.trim() || JSON.stringify(description, null, 2);
                
            } catch (e) {
                console.error('格式化角色描述失败:', e);
                // 尝试JSON字符串化
                try {
                    return JSON.stringify(description);
                } catch (jsonError) {
                    return "无法解析的角色描述";
                }
            }
        }
        
        // 其他类型，尝试转为字符串
        return String(description);
    }
    
    // 开发环境添加调试功能
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        const debugButton = document.createElement('button');
        debugButton.textContent = '添加默认角色';
        debugButton.style.backgroundColor = '#ff9800';
        debugButton.style.color = 'white';
        debugButton.style.border = 'none';
        debugButton.style.borderRadius = '4px';
        debugButton.style.padding = '8px 12px';
        debugButton.style.margin = '10px 0';
        debugButton.style.cursor = 'pointer';
        
        debugButton.onclick = function() {
            const charactersContainer = document.getElementById('play-characters-container');
            addCharacterInput(charactersContainer, "主角", "这是故事的主角，可编辑此描述。");
            addCharacterInput(charactersContainer, "配角", "这是故事的配角，可编辑此描述。");
            addCharacterInput(charactersContainer, "反派", "这是故事的反派，可编辑此描述。");
        };
        
        // 添加到DOM中
        const charactersContainer = document.getElementById('play-characters-container');
        if (charactersContainer) {
            charactersContainer.parentNode.insertBefore(debugButton, charactersContainer);
        }
    }
    
    // 从文本中提取角色
    function extractCharactersFromText(text) {
        console.log("尝试从文本中提取角色");
        let characters = [];
        
        try {
            // 先尝试清理文本，修复常见格式问题
            let cleanedText = text.replace(/,(\s*\})/g, '$1') // 移除对象末尾多余的逗号
                            .replace(/\},\s*,\s*\{/g, '},{') // 修复多余的逗号
                            .replace(/,\s*,/g, ','); // 修复连续逗号
        
            // 尝试方法1：查找完整的JSON数组
            const jsonMatch = cleanedText.match(/\[\s*\{[\s\S]*\}\s*\]/);
            if (jsonMatch) {
                try {
                    characters = JSON.parse(jsonMatch[0]);
                    console.log("从JSON数组中提取角色成功:", characters);
                    return characters;
                } catch (e) {
                    console.error("解析JSON数组失败:", e);
                    // 继续尝试其他方法
                }
            }
            
            // 尝试方法2：单个JSON对象集合
            if (cleanedText.includes('{') && cleanedText.includes('}')) {
                // 尝试直接提取每个角色对象
                try {
                    // 更智能地处理通义千问的特殊格式
                    // 匹配每个角色对象，处理多行描述
                    const objectMatches = cleanedText.match(/\{\s*"name"[\s\S]*?("description"[\s\S]*?\})/g);
                    
                    if (objectMatches && objectMatches.length > 0) {
                        // 单独解析每个对象，以避免一个错误影响所有解析
                        objectMatches.forEach(objText => {
                            try {
                                // 修复可能的格式问题
                                let fixedObjText = objText.trim();
                                // 确保对象以}结束
                                if (!fixedObjText.endsWith('}')) {
                                    fixedObjText += '}';
                                }
                                // 移除对象末尾多余的逗号
                                fixedObjText = fixedObjText.replace(/,(\s*\})/g, '$1');
                                
                                const charObj = JSON.parse(fixedObjText);
                                if (charObj && charObj.name) {
                                    characters.push(charObj);
                                }
                            } catch (objError) {
                                console.warn("解析单个对象失败:", objError);
                            }
                        });
                        
                        if (characters.length > 0) {
                            console.log("通过单独解析每个对象成功提取角色:", characters);
                            return characters;
                        }
                    }
                } catch (e) {
                    console.error("解析JSON对象集合失败:", e);
                    // 继续尝试其他方法
                }
            }
            
            // 尝试方法3：解析通义千问格式的输出
            // 如果文本包含多个角色对象（没有被包裹在数组中）
            if (cleanedText.includes('"name":') && cleanedText.includes('"description":')) {
                try {
                    // 修复格式，将文本转换为有效JSON
                    let formattedText = '[' + cleanedText.replace(/\}\s*\{/g, '},{')
                                    .replace(/\},\s*\{/g, '},{')
                                    .replace(/,(\s*\})/g, '$1') + ']';
                    
                    // 处理可能的格式问题
                    formattedText = formattedText.replace(/,\s*\]/g, ']');
                    formattedText = formattedText.replace(/\[\s*,/g, '[');
                    
                    try {
                        characters = JSON.parse(formattedText);
                        console.log("从修复的JSON格式提取角色成功:", characters);
                        return characters;
                    } catch (parseError) {
                        console.warn("修复后仍无法解析，尝试更严格的清理:", parseError);
                        
                        // 更严格的清理，只保留有效的JSON对象
                        let objectTexts = [];
                        const regex = /\{\s*"name"\s*:\s*"[^"]+"\s*,\s*"description"\s*:\s*"[^"]*"\s*\}/g;
                        let match;
                        
                        while ((match = regex.exec(cleanedText)) !== null) {
                            objectTexts.push(match[0]);
                        }
                        
                        if (objectTexts.length > 0) {
                            let strictFormattedText = '[' + objectTexts.join(',') + ']';
                            characters = JSON.parse(strictFormattedText);
                            console.log("通过严格清理提取角色成功:", characters);
                            return characters;
                        }
                    }
                } catch (e) {
                    console.error("修复并解析JSON失败:", e);
                    // 继续尝试其他方法
                }
            }
            
            // 尝试方法4：从文本中提取角色结构
            return extractCharactersFromPlainText(cleanedText);
        } catch (error) {
            console.error("提取角色时出错:", error);
            return [
                { name: "主角", description: "请描述这个角色..." },
                { name: "配角", description: "请描述这个角色..." }
            ];
        }
    }

    // 从纯文本中解析角色
    function extractCharactersFromPlainText(text) {
        console.log("从纯文本解析角色");
        
        // 如果文本看起来像是JSON但解析失败，尝试手动提取
        if (text.includes('"name":') && text.includes('"description":')) {
            try {
                const characters = [];
                
                // 尝试提取每个角色
                const nameMatches = text.match(/"name"\s*:\s*"([^"]*)"/g);
                const descMatches = text.match(/"description"\s*:\s*"([^"]*)"/g);
                
                if (nameMatches && descMatches && nameMatches.length === descMatches.length) {
                    for (let i = 0; i < nameMatches.length; i++) {
                        const name = nameMatches[i].match(/"name"\s*:\s*"([^"]*)"/)[1];
                        const desc = descMatches[i].match(/"description"\s*:\s*"([^"]*)"/)[1];
                        characters.push({ name, description: desc });
                    }
                    
                    console.log("通过正则提取JSON角色成功:", characters);
                    return characters;
                }
                
                // 更复杂的情况：description可能包含多行文本和特殊字符
                const parts = text.split(/\{\s*"name"/);
                if (parts.length > 1) {
                    for (let i = 1; i < parts.length; i++) {
                        const part = '{' + '"name"' + parts[i];
                        const nameMatch = part.match(/"name"\s*:\s*"([^"]*)"/);
                        
                        if (nameMatch) {
                            const name = nameMatch[1];
                            
                            // 提取描述 - 可能跨越多行
                            let description = "";
                            const descMatch = part.match(/"description"\s*:\s*"([\s\S]*?)(?:"\s*\}|"(?=\s*,\s*"))/);
                            
                            if (descMatch) {
                                description = descMatch[1];
                            }
                            
                            characters.push({ name, description });
                        }
                    }
                    
                    if (characters.length > 0) {
                        console.log("通过拆分提取角色成功:", characters);
                        return characters;
                    }
                }
            } catch (e) {
                console.error("手动提取JSON失败:", e);
            }
        }
        
        // 尝试识别角色块
        const characterBlocks = text.split(/(?=角色\s*\d+:|角色名称:|名称:|姓名:|1\.|2\.|3\.)/i)
            .filter(block => block && block.trim().length > 10);
        
        if (characterBlocks.length === 0) {
            // 尝试直接从文本中提取信息
            // 如果文本不是很长，可能整个就是一个角色的描述
            if (text.length < 1000) {
                return [{ name: "主角", description: text.trim() }];
            }
            
            // 尝试将文本分成几部分
            const paragraphs = text.split(/\n\n+/);
            if (paragraphs.length >= 2) {
                return [
                    { name: "主角", description: paragraphs[0] },
                    { name: "配角", description: paragraphs.slice(1).join('\n\n') }
                ];
            }
            
            // 最后的备选方案
            return [
                { name: "主角", description: "这是故事的主角，请根据文本编辑描述。" },
                { name: "配角", description: "这是故事的配角，请根据文本编辑描述。" }
            ];
        }
        
        return characterBlocks.map((block, index) => {
            // 尝试从块中提取角色名
            const nameMatch = block.match(/(?:角色\s*\d+:|角色名称:|名称:|姓名:|1\.|2\.|3\.)\s*([^:\n]+)/i) ||
                            block.match(/^([^:\n]{1,20})[:\n]/);
            
            const name = nameMatch ? nameMatch[1].trim() : `角色${index + 1}`;
            
            // 提取描述 - 移除名称部分
            let description = block;
            if (nameMatch) {
                description = block.replace(nameMatch[0], '').trim();
            }
            
            return { name, description };
        });
    }
});