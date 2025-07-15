// 游戏状态管理
const gameState = {
    storyBackground: "",
    characters: [],
    currentChapter: 1,
    currentNode: null,
    selectedTheme: "",
    storyTree: [],
    currentChoices: [],
    history: [],
    gameLog: [],
    settings: {
        complexity: "medium",
        chapterCount: 5
    },
    imageSettings: {
        lastDescription: '',
        lastStyle: 'realistic',
        lastColorTone: 'warm',
        lastRequirements: ''
    }
};

// 修改示例故事内容库
const storyContent = {
    chapters: [
        {
            id: 1,
            title: "第一章：命运的开端",
            content: "在一个平凡的早晨，主角收到了一封神秘的信件，上面记载着一个古老的预言...",
            editable: true,
            choices: []
        },
        {
            id: 2,
            title: "第二章：隐秘真相",
            content: "随着调查的深入，主角发现这个城市地下似乎隐藏着一个庞大的秘密组织...",
            editable: true,
            choices: []
        },
        {
            id: 3,
            title: "第三章：命运交织",
            content: "不同的人物命运开始交织，每个人似乎都与这个预言有着千丝万缕的联系...",
            editable: true,
            choices: []
        },
        {
            id: 4,
            title: "第四章：真相浮现",
            content: "随着更多线索的出现，预言背后的真相逐渐浮出水面，一切都指向了那个古老的传说...",
            editable: true,
            choices: []
        },
        {
            id: 5,
            title: "第五章：终极抉择",
            content: "面对最终的真相，主角必须做出选择，这个选择将影响整个世界的命运...",
            editable: true,
            choices: []
        }
    ]
};

// 当前游戏状态
let currentStoryNode = storyContent.chapters[0];

// 初始化游戏
function initializeGame() {
    // 初始化所有章节
    gameState.storyTree = storyContent.chapters;
    
    // 设置当前节点为第一章
    currentStoryNode = storyContent.chapters[0];
    
    // 显示初始内容
    updateStoryDisplay(currentStoryNode);
    
    // 渲染所有章节到剧情树
    const treeContainer = document.getElementById('storyTree');
    treeContainer.innerHTML = ''; // 清空现有内容
    
    storyContent.chapters.forEach(chapter => {
        addToStoryTree(chapter);
    });
    
    // 高亮第一章
    highlightCurrentNode(1);
    
    // 添加初始化记录
    addToHistory({
        title: "初始化",
        content: "故事创建完成，包含五个主要章节"
    });
}

// 更新故事显示
function updateStoryDisplay(node) {
    // 更新标题
    document.getElementById('currentStageTitle').textContent = node.title;
    
    // 更新内容并设置为可编辑
    const storyTextElement = document.getElementById('storyText');
    storyTextElement.textContent = node.content;
    storyTextElement.contentEditable = node.editable || false;
    storyTextElement.dataset.nodeId = node.id;
    
    // 绑定内容变更事件
    storyTextElement.onblur = function() {
        if (parseInt(this.dataset.nodeId) === currentStoryNode.id) {
            currentStoryNode.content = this.textContent;
            addToHistory({
                title: "编辑",
                content: "修改了剧情内容"
            });
        }
    };
    
    // 更新章节信息
    document.getElementById('currentChapter').textContent = node.title;
    
    // 生成新的场景图片
    regenerateImage(node.content);
    
    // 将节点添加到剧情树
    addToStoryTree(node);
    
    // 高亮当前节点
    highlightCurrentNode(node.id);
    
    // 隐藏选择按钮区域
    document.querySelector('.choices-container').style.display = 'none';
}

// 高亮当前节点
function highlightCurrentNode(nodeId) {
    const nodes = document.querySelectorAll('.tree-node');
    nodes.forEach(node => {
        const titleElement = node.querySelector('.tree-node-title');
        if (titleElement && titleElement.dataset.id === String(nodeId)) {
            node.classList.add('active');
        } else {
            node.classList.remove('active');
        }
    });
}

// 添加到剧情树
function addToStoryTree(node) {
    // 检查节点是否已存在
    const existingNode = document.querySelector(`.tree-node-title[data-id="${node.id}"]`);
    if (existingNode) {
        // 如果节点已存在，只更新标题（如果有变化）
        if (existingNode.textContent !== node.title) {
            existingNode.textContent = node.title;
        }
        return;
    }
    
    const treeContainer = document.getElementById('storyTree');
    const nodeElement = document.createElement('div');
    nodeElement.className = 'tree-node';
    
    // 创建标题元素
    const titleElement = document.createElement('div');
    titleElement.className = 'tree-node-title';
    titleElement.textContent = node.title;
    titleElement.dataset.id = node.id; // 添加唯一标识
    
    // 创建生成按钮
    const generateBtn = document.createElement('button');
    generateBtn.className = 'tree-node-generate';
    generateBtn.innerHTML = '<i class="fas fa-magic"></i> 生成内容';
    generateBtn.title = '生成该节点的详细内容';
    
    // 组装节点
    nodeElement.appendChild(titleElement);
    nodeElement.appendChild(generateBtn);
    treeContainer.appendChild(nodeElement);
    
    // 添加点击事件 - 编辑标题
    titleElement.addEventListener('click', function(e) {
        // 如果已经在编辑模式则不重复处理
        if (this.classList.contains('edit-mode')) return;
        
        // 阻止事件冒泡到节点，避免选中节点
        e.stopPropagation();
        
        this.classList.add('edit-mode');
        this.contentEditable = true;
        this.focus();
        
        // 保存原始标题
        const originalTitle = this.textContent;
        
        // 处理编辑完成
        const finishEditing = () => {
            this.classList.remove('edit-mode');
            this.contentEditable = false;
            
            // 如果标题有变化，更新相关内容
            if (this.textContent.trim() && this.textContent !== originalTitle) {
                const newTitle = this.textContent.trim();
                this.textContent = newTitle;
                
                // 如果是当前节点，同步更新故事区域标题
                if (currentStoryNode.id === parseInt(this.dataset.id)) {
                    currentStoryNode.title = newTitle;
                    document.getElementById('currentStageTitle').textContent = newTitle;
                    document.getElementById('currentChapter').textContent = newTitle;
                }
                
                addToHistory({
                    title: "编辑",
                    content: `修改了章节标题：${newTitle}`
                });
            } else {
                // 恢复原始标题
                this.textContent = originalTitle;
            }
        };
        
        // 失去焦点时完成编辑
        this.addEventListener('blur', finishEditing, { once: true });
        
        // 按下Enter键完成编辑，Esc键取消
        this.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                finishEditing();
            } else if (e.key === 'Escape') {
                e.preventDefault();
                this.textContent = originalTitle;
                finishEditing();
            }
        }, { once: true });
    });
    
    // 添加生成按钮点击事件
    generateBtn.addEventListener('click', function(e) {
        e.stopPropagation(); // 防止触发标题编辑
        
        const nodeTitle = titleElement.textContent;
        const nodeId = titleElement.dataset.id;
        
        // 显示生成中提示
        this.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 生成中...';
        this.disabled = true;
        
        // 模拟生成过程
        setTimeout(() => {
            // 恢复按钮状态
            this.innerHTML = '<i class="fas fa-magic"></i> 生成内容';
            this.disabled = false;
            
            // 实际应用中，这里应该调用API生成内容
            // 并更新到对应的节点
            if (parseInt(nodeId) === currentStoryNode.id) {
                // 如果是当前节点，更新内容
                generateDetailedContent(nodeTitle).then(detailedContent => {
                    currentStoryNode.content = detailedContent;
                    document.getElementById('storyText').textContent = detailedContent;
                    
                    // 标记内容为可编辑
                    currentStoryNode.editable = true;
                    
                    addToHistory({
                        title: "生成内容",
                        content: `为"${nodeTitle}"生成了详细内容`
                    });
                });
            } else {
                alert(`已为"${nodeTitle}"生成了详细内容！`);
            }
        }, 1500);
    });
    
    // 添加节点点击事件 - 切换当前节点
    nodeElement.addEventListener('click', function() {
        // 移除其他节点的active类
        document.querySelectorAll('.tree-node').forEach(n => {
            n.classList.remove('active');
        });
        // 为当前点击的节点添加active类
        this.classList.add('active');
        
        // 切换到该节点的内容
        const nodeId = this.querySelector('.tree-node-title').dataset.id;
        if (parseInt(nodeId) !== currentStoryNode.id) {
            // 从storyTree中找到对应节点
            let targetNode = gameState.storyTree.find(node => node.id === parseInt(nodeId));
            
            if (!targetNode) {
                // 如果节点不存在，使用模拟数据
                targetNode = {
                    id: parseInt(nodeId),
                    title: this.querySelector('.tree-node-title').textContent,
                    content: `这是${this.querySelector('.tree-node-title').textContent}的内容...`,
                    editable: true,
                    choices: []
                };
                
                // 添加到storyTree
                gameState.storyTree.push(targetNode);
            }
            
            currentStoryNode = targetNode;
            updateStoryDisplay(targetNode);
            
            addToHistory({
                title: "切换章节",
                content: `切换到"${targetNode.title}"`
            });
        }
    });
    
    // 将节点添加到storyTree
    if (!gameState.storyTree.some(node => node.id === parseInt(node.id))) {
        gameState.storyTree.push(node);
    }
    
    return nodeElement;
}

// 生成详细内容（模拟）
async function generateDetailedContent(title) {
    // 这里应该调用AI API生成详细内容
    return `${title}的详细内容...\n\n这是一段由AI生成的详细描述，讲述了${title}的背景故事和相关情节。这里可以包含更多的细节、环境描写、角色互动等内容，使故事更加丰富生动。你可以直接编辑这段内容来修改剧情。`;
}

// 重新生成图片
function regenerateImage(description) {
    // 这里应该调用 AI API 来生成图片
    // 现在使用随机占位图片模拟
    const randomSize = Math.floor(Math.random() * 200) + 800;
    document.getElementById('storyImage').src = `https://via.placeholder.com/${randomSize}x400`;
}

// 初始化编辑功能
function initializeEditFeatures() {
    // 编辑标题
    document.querySelector('.edit-title-btn').addEventListener('click', () => {
        const modal = document.getElementById('editModal');
        const input = document.getElementById('modalInput');
        input.value = currentStoryNode.title;
        
        modal.classList.add('active');
        document.querySelector('.save-modal-btn').onclick = () => {
            currentStoryNode.title = input.value;
            document.getElementById('currentStageTitle').textContent = input.value;
            document.getElementById('currentChapter').textContent = input.value;
            modal.classList.remove('active');
            addToHistory({
                title: "编辑",
                content: `修改了标题：${input.value}的标题`
            });
        };
    });

    // 编辑剧情
    document.querySelector('.edit-story-btn').addEventListener('click', () => {
        const modal = document.getElementById('editModal');
        const input = document.getElementById('modalInput');
        input.value = currentStoryNode.content;
        
        modal.classList.add('active');
        document.querySelector('.save-modal-btn').onclick = () => {
            currentStoryNode.content = input.value;
            document.getElementById('storyText').textContent = input.value;
            modal.classList.remove('active');
            addToHistory({
                title: "编辑",
                content: "修改了剧情内容"
            });
        };
    });

    // 关闭模态框
    document.querySelector('.close-modal').addEventListener('click', () => {
        document.getElementById('editModal').classList.remove('active');
    });
    
    document.querySelector('.cancel-modal-btn').addEventListener('click', () => {
        document.getElementById('editModal').classList.remove('active');
    });
}

// 初始化故事信息按钮
function initializeStoryInfoButtons() {
    // 故事背景按钮
    const storyInfoBtn = document.querySelector('.story-info-btn');
    const storyInfoModal = document.getElementById('storyInfoModal');
    
    storyInfoBtn.addEventListener('click', () => {
        updateStoryInfoContent();
        storyInfoModal.classList.add('active');
    });

    // 角色设定按钮
    const characterInfoBtn = document.querySelector('.character-info-btn');
    const characterInfoModal = document.getElementById('characterInfoModal');
    
    characterInfoBtn.addEventListener('click', () => {
        updateCharacterInfoContent();
        characterInfoModal.classList.add('active');
    });

    // 关闭按钮
    document.querySelectorAll('.close-modal').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.target.closest('.modal').classList.remove('active');
        });
    });
}

// 更新故事背景内容
function updateStoryInfoContent() {
    // 更新世界观设定
    document.getElementById('worldBackground').textContent = gameState.storyBackground || "这是一个充满奇幻与神秘的世界，各种超自然现象时有发生...";

    // 更新时间线
    const timeline = document.getElementById('storyTimeline');
    timeline.innerHTML = gameState.history.map(event => `
        <div class="timeline-event">
            <h4>${event.title}</h4>
            <p>${event.content}</p>
        </div>
    `).join('');

    // 更新重要地点
    const locations = document.getElementById('importantLocations');
    // 这里应该从游戏状态中获取地点信息
    locations.innerHTML = [
        {
            name: "神秘房间",
            description: "故事开始的地方，充满了未解之谜..."
        },
        {
            name: "空旷街道",
            description: "被雾气笼罩的街道，似乎隐藏着什么..."
        },
        {
            name: "废弃工厂",
            description: "传闻中发生过神秘事件的地方，弥漫着诡异的气息..."
        }
    ].map(location => `
        <div class="location-card">
            <h4>${location.name}</h4>
            <p>${location.description}</p>
        </div>
    `).join('');
}

// 更新角色设定内容
function updateCharacterInfoContent() {
    const characterGrid = document.getElementById('characterGrid');
    
    // 如果没有角色数据，添加一些示例角色
    if (gameState.characters.length === 0) {
        gameState.characters = [
            {
                name: "主角",
                description: "一位好奇心旺盛的年轻探险家，对神秘事件充满兴趣...",
                traits: ["勇敢", "机智", "好奇心强"]
            },
            {
                name: "神秘陌生人",
                description: "在街道上遇到的神秘人物，似乎知道很多关于这个世界的秘密...",
                traits: ["神秘", "沉默寡言", "观察力敏锐"]
            }
        ];
    }
    
    characterGrid.innerHTML = gameState.characters.map(char => `
        <div class="character-info-card">
            <img class="character-info-image" src="https://via.placeholder.com/250x200" alt="${char.name}">
            <div class="character-info-details">
                <h3>${char.name}</h3>
                <p>${char.description}</p>
                <div class="character-traits">
                    ${generateCharacterTraits(char)}
                </div>
            </div>
        </div>
    `).join('');
}

// 生成角色特征标签
function generateCharacterTraits(character) {
    return (character.traits || []).map(trait => `
        <span class="character-trait">${trait}</span>
    `).join('');
}

// 修改添加历史记录的函数
function addToHistory(action) {
    const historyContainer = document.getElementById('storyHistory');
    const timestamp = new Date().toLocaleTimeString();
    
    // 创建新的历史记录条目
    const entryElement = document.createElement('div');
    entryElement.className = 'history-entry';
    
    // 根据操作类型设置不同的提示文本
    let actionText = '';
    if (action.type === 'edit' && currentStoryNode) {
        actionText = `修改了 ${currentStoryNode.title} 的内容`;
    } else if (action.type === 'image') {
        actionText = `为 ${currentStoryNode.title} 生成了新的场景图片`;
    } else if (action.type === 'title') {
        actionText = `修改了章节标题为：${currentStoryNode.title}`;
    } else {
        actionText = action.content;
    }
    
    // 设置历史记录内容
    entryElement.innerHTML = `
        <span class="history-time">[${timestamp}]</span>
        <span class="history-text">${actionText}</span>
    `;
    
    // 将新记录添加到容器中
    historyContainer.insertBefore(entryElement, historyContainer.firstChild);
    
    // 自动滚动到最新记录
    historyContainer.scrollTop = historyContainer.scrollHeight;
}

// 在相关操作处调用 addToHistory
function editStoryContent() {
    if (!currentStoryNode) return;
    
    const modal = document.getElementById('editModal');
    const input = document.getElementById('modalInput');
    input.value = currentStoryNode.content;
    modal.classList.add('active');
    
    document.querySelector('.save-modal-btn').onclick = () => {
        currentStoryNode.content = input.value;
        document.getElementById('storyText').textContent = input.value;
        modal.classList.remove('active');
        
        // 添加修改记录
        addToHistory({
            type: 'edit',
            content: `修改了 ${currentStoryNode.title} 的内容`
        });
    };
}

// 图片生成相关初始化
function initializeImageGeneration() {
    const regenerateBtn = document.querySelector('.regenerate-image-btn');
    const imageModal = document.getElementById('imageGenerateModal');
    
    regenerateBtn.addEventListener('click', (e) => {
        e.preventDefault();
        
        // 填充上次的设置
        document.getElementById('sceneDescription').value = gameState.imageSettings.lastDescription;
        document.getElementById('artStyle').value = gameState.imageSettings.lastStyle;
        document.getElementById('colorTone').value = gameState.imageSettings.lastColorTone;
        document.getElementById('additionalRequirements').value = gameState.imageSettings.lastRequirements;
        
        imageModal.classList.add('active');
    });

    // 设置生成按钮事件
    document.querySelector('.generate-image-btn').addEventListener('click', async () => {
        const description = document.getElementById('sceneDescription').value;
        const style = document.getElementById('artStyle').value;
        const colorTone = document.getElementById('colorTone').value;
        const requirements = document.getElementById('additionalRequirements').value;
        
        // 保存设置
        gameState.imageSettings = {
            lastDescription: description,
            lastStyle: style,
            lastColorTone: colorTone,
            lastRequirements: requirements
        };
        
        // 显示加载状态
        const imgElement = document.getElementById('storyImage');
        imgElement.style.opacity = '0.5';
        
        try {
            // 这里调用AI图片生成API
            const newImageUrl = await generateImage({
                description,
                style,
                colorTone,
                requirements
            });
            
            // 更新图片
            imgElement.src = newImageUrl;
            imgElement.style.opacity = '1';
            
            // 添加到历史记录
            addToHistory({
                title: "生成插画",
                content: `使用${style}风格生成了新的场景插画`
            });
            
            // 关闭模态框
            imageModal.classList.remove('active');
        } catch (error) {
            console.error('生成图片失败:', error);
            alert('生成图片失败，请稍后重试');
        }
    });
}

// 添加图片生成函数
async function generateImage(settings) {
    // 这里应该是实际的AI API调用
    // 现在用随机占位图片模拟
    const styles = {
        realistic: '写实',
        anime: '动漫',
        watercolor: '水彩',
        oil: '油画',
        pixel: '像素'
    };
    
    console.log('生成图片设置:', settings);
    
    // 模拟API调用延迟
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // 返回随机大小的占位图片
    const width = Math.floor(Math.random() * 200) + 800;
    const height = 400;
    return `https://via.placeholder.com/${width}x${height}?text=${styles[settings.style]}风格`;
}

// 在文档加载完成后初始化游戏
document.addEventListener('DOMContentLoaded', () => {
    initializeGame();
    initializeEditFeatures();
    initializeStoryInfoButtons();
    initializeImageGeneration();
    
    // 设置一些初始故事背景
    gameState.storyBackground = "这是一个充满奇幻与神秘的世界，各种超自然现象时有发生。最近，一个小镇上发生了一系列离奇事件，引起了人们的恐慌和好奇...";
});