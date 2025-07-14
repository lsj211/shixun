document.addEventListener('DOMContentLoaded', () => {
    // 获取所有模式按钮元素
    const playModeBtn = document.getElementById('play-mode-btn');
    const createModeBtn = document.getElementById('create-mode-btn');
    const modeSelection = document.getElementById('mode-selection');
    const playModeSettings = document.getElementById('play-mode-settings');
    const createModeSettings = document.getElementById('create-mode-settings');
    
    // 创作模式选择元素
    const textBasedBtn = document.getElementById('text-based-btn');
    const imageBasedBtn = document.getElementById('image-based-btn');
    const textBasedSettings = document.getElementById('text-based-settings');
    const imageBasedSettings = document.getElementById('image-based-settings');
    
    // 章节数滑块相关元素
    const playChapterCount = document.getElementById('play-chapter-count');
    const playChapterDisplay = document.getElementById('play-chapter-display');
    const createChapterCount = document.getElementById('create-chapter-count');
    const createChapterDisplay = document.getElementById('create-chapter-display');
    const createImageChapterCount = document.getElementById('create-image-chapter-count');
    const createImageChapterDisplay = document.getElementById('create-image-chapter-display');
    
    // 模式选择事件处理
    playModeBtn.addEventListener('click', () => {
        modeSelection.classList.add('hidden');
        playModeSettings.classList.remove('hidden');
    });
    
    createModeBtn.addEventListener('click', () => {
        modeSelection.classList.add('hidden');
        createModeSettings.classList.remove('hidden');
    });
    
    // 创作模式类型选择事件
    textBasedBtn.addEventListener('click', () => {
        textBasedSettings.classList.remove('hidden');
        imageBasedSettings.classList.add('hidden');
    });
    
    imageBasedBtn.addEventListener('click', () => {
        textBasedSettings.classList.add('hidden');
        imageBasedSettings.classList.remove('hidden');
    });
    
    // 章节数滑块事件处理
    playChapterCount.addEventListener('input', () => {
        playChapterDisplay.textContent = `${playChapterCount.value} 章`;
    });
    
    createChapterCount.addEventListener('input', () => {
        createChapterDisplay.textContent = `${createChapterCount.value} 章`;
    });
    
    createImageChapterCount.addEventListener('input', () => {
        createImageChapterDisplay.textContent = `${createImageChapterCount.value} 章`;
    });
    
    // 添加角色按钮事件处理
    const addCharacterButtons = document.querySelectorAll('.add-character-btn');
    addCharacterButtons.forEach(btn => {
        btn.addEventListener('click', (event) => {
            // 获取当前角色容器
            let charactersContainer;
            if (event.target.closest('#play-mode-settings')) {
                charactersContainer = document.getElementById('play-characters-container');
            } else {
                charactersContainer = document.getElementById('create-characters-container');
            }
            
            // 创建新角色输入框
            const characterInput = document.createElement('div');
            characterInput.className = 'character-input';
            characterInput.innerHTML = `
                <input type="text" class="character-name" placeholder="角色名称">
                <textarea class="character-desc" placeholder="角色描述..."></textarea>
                <button class="remove-character-btn"><i class="fas fa-times"></i> 删除</button>
            `;
            
            // 添加到容器
            charactersContainer.appendChild(characterInput);
            
            // 添加删除角色事件
            const removeBtn = characterInput.querySelector('.remove-character-btn');
            removeBtn.addEventListener('click', () => {
                characterInput.remove();
            });
        });
    });
    
    // 步骤导航处理
    setupStepNavigation('play-step-', 4);
    setupStepNavigation('create-text-step-', 4);
    setupStepNavigation('create-image-step-', 4);
    
    // 图片上传处理
    const imageUploadInput = document.getElementById('image-upload');
    const imageUploadArea = document.querySelector('.image-upload-area');
    const imagePreviewContainer = document.getElementById('image-preview-container');
    
    // 点击上传区域触发文件选择
    imageUploadArea.addEventListener('click', () => {
        imageUploadInput.click();
    });
    
    // 处理拖放上传
    imageUploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        imageUploadArea.style.borderColor = '#3498db';
        imageUploadArea.style.backgroundColor = 'rgba(52, 152, 219, 0.05)';
    });
    
    imageUploadArea.addEventListener('dragleave', () => {
        imageUploadArea.style.borderColor = '#ddd';
        imageUploadArea.style.backgroundColor = 'transparent';
    });
    
    imageUploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        imageUploadArea.style.borderColor = '#ddd';
        imageUploadArea.style.backgroundColor = 'transparent';
        
        if (e.dataTransfer.files) {
            handleImageFiles(e.dataTransfer.files);
        }
    });
    
    // 处理选择文件
    imageUploadInput.addEventListener('change', () => {
        if (imageUploadInput.files) {
            handleImageFiles(imageUploadInput.files);
        }
    });
    
    // 处理图片文件预览
    function handleImageFiles(files) {
        for (const file of files) {
            if (!file.type.startsWith('image/')) continue;
            
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = document.createElement('img');
                img.src = e.target.result;
                img.className = 'image-preview';
                img.title = file.name;
                imagePreviewContainer.appendChild(img);
                
                // 添加点击删除功能
                img.addEventListener('click', () => {
                    img.remove();
                });
            };
            reader.readAsDataURL(file);
        }
    }
    
    // 游戏/创作开始按钮处理
    const startGameBtn = document.querySelector('.start-game-btn');
    const startCreationBtn = document.querySelector('.start-creation-btn');
    const startImageCreationBtn = document.querySelector('.start-image-creation-btn');
    
    startGameBtn.addEventListener('click', startGame);
    startCreationBtn.addEventListener('click', startTextCreation);
    startImageCreationBtn.addEventListener('click', startImageCreation);
    
    // 功能处理函数
    function setupStepNavigation(stepIdPrefix, totalSteps) {
        for (let i = 1; i <= totalSteps; i++) {
            const currentStep = document.getElementById(`${stepIdPrefix}${i}`);
            
            if (!currentStep) continue;
            
            const nextBtn = currentStep.querySelector('.next-btn');
            const prevBtn = currentStep.querySelector('.prev-btn');
            
            if (nextBtn && i < totalSteps) {
                nextBtn.addEventListener('click', () => {
                    currentStep.classList.add('hidden');
                    document.getElementById(`${stepIdPrefix}${i+1}`).classList.remove('hidden');
                });
            }
            
            if (prevBtn && i > 1) {
                prevBtn.addEventListener('click', () => {
                    currentStep.classList.add('hidden');
                    document.getElementById(`${stepIdPrefix}${i-1}`).classList.remove('hidden');
                });
            }
        }
    }
    
    function startGame() {
        // 收集游玩模式的所有设定数据
        const gameData = collectGameData();
        
        // 这里可以将数据保存到本地存储或发送到服务器
        localStorage.setItem('gameSettings', JSON.stringify(gameData));
        
        // 重定向到游戏页面
        window.location.href = 'game.html';
    }
    
    function startTextCreation() {
        // 收集文字创作模式的设定数据
        const creationData = collectTextCreationData();
        
        // 保存数据
        localStorage.setItem('creationSettings', JSON.stringify(creationData));
        
        // 重定向到创作页面
        window.location.href = 'creator.html';
    }
    
    function startImageCreation() {
        // 收集图片创作模式的设定数据
        const imageCreationData = collectImageCreationData();
        
        // 保存数据
        localStorage.setItem('imageCreationSettings', JSON.stringify(imageCreationData));
        
        // 重定向到创作页面
        window.location.href = 'creator.html?mode=image';
    }
    
    function collectGameData() {
        // 收集游戏模式的所有设定
        const background = document.getElementById('play-story-background').value;
        
        // 收集所有角色
        const characters = [];
        const characterInputs = document.querySelectorAll('#play-characters-container .character-input');
        characterInputs.forEach(input => {
            const name = input.querySelector('.character-name').value;
            const desc = input.querySelector('.character-desc').value;
            if (name.trim() !== '') {
                characters.push({ name, description: desc });
            }
        });
        
        // 获取分支复杂度
        let complexity;
        document.querySelectorAll('input[name="play-complexity"]').forEach(input => {
            if (input.checked) {
                complexity = input.value;
            }
        });
        
        // 获取章节数
        const chapterCount = parseInt(playChapterCount.value);
        
        return {
            mode: 'play',
            background,
            characters,
            complexity,
            chapterCount
        };
    }
    
    function collectTextCreationData() {
        // 收集文字创作模式的所有设定
        const background = document.getElementById('create-story-background').value;
        
        // 收集所有角色
        const characters = [];
        const characterInputs = document.querySelectorAll('#create-characters-container .character-input');
        characterInputs.forEach(input => {
            const name = input.querySelector('.character-name').value;
            const desc = input.querySelector('.character-desc').value;
            if (name.trim() !== '') {
                characters.push({ name, description: desc });
            }
        });
        
        // 获取分支复杂度
        let complexity;
        document.querySelectorAll('input[name="create-complexity"]').forEach(input => {
            if (input.checked) {
                complexity = input.value;
            }
        });
        
        // 获取章节数
        const chapterCount = parseInt(createChapterCount.value);
        
        return {
            mode: 'create',
            creationType: 'text',
            background,
            characters,
            complexity,
            chapterCount
        };
    }
    
    function collectImageCreationData() {
        // 收集图片创作模式的所有设定
        
        // 获取上传的图片数据（这里只存储预览URL，实际项目中可能需要上传到服务器）
        const images = [];
        document.querySelectorAll('.image-preview').forEach(img => {
            images.push(img.src);
        });
        
        // 获取从图片提取的元素
        const background = document.getElementById('image-background').value;
        const charactersText = document.getElementById('image-characters').value;
        
        // 获取分支复杂度
        let complexity;
        document.querySelectorAll('input[name="create-image-complexity"]').forEach(input => {
            if (input.checked) {
                complexity = input.value;
            }
        });
        
        // 获取章节数
        const chapterCount = parseInt(createImageChapterCount.value);
        
        return {
            mode: 'create',
            creationType: 'image',
            images,
            background,
            charactersText,
            complexity,
            chapterCount
        };
    }
});