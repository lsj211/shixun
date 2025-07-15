// 修改游戏状态，添加已探索节点记录
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
    // 添加已探索节点记录
    exploredNodes: new Set(), // 用于记录已经探索过的节点
    currentPath: [] // 用于记录当前路径上的所有节点
    
};
// 添加更新进度条的函数
function updateChapterProgress() {
    // 从游戏设置获取总章节数，默认为5
    const totalChapters = gameState.settings.chapterCount || 5;
    
    // 从当前节点标题提取章节数
    let currentChapter = 1;
    if (currentStoryNode && currentStoryNode.title) {
        const chapterMatch = currentStoryNode.title.match(/第(\d+)章/);
        if (chapterMatch && chapterMatch[1]) {
            currentChapter = parseInt(chapterMatch[1]);
        }
    }
    
    // 确保当前章节不超过总章节数
    currentChapter = Math.min(currentChapter, totalChapters);
    
    // 更新进度条文本
    const currentChapterElem = document.querySelector('.current-chapter-num');
    const totalChaptersElem = document.querySelector('.total-chapters');
    
    if (currentChapterElem) {
        currentChapterElem.textContent = `第${currentChapter}章`;
    }
    
    if (totalChaptersElem) {
        totalChaptersElem.textContent = `共${totalChapters}章`;
    }
    
    // 更新进度条
    const progressBar = document.getElementById('chapterProgress');
    if (progressBar) {
        const progressPercent = (currentChapter / totalChapters) * 100;
        progressBar.style.width = `${progressPercent}%`;
        
        // 检查是否到达最终章节
        if (currentChapter >= totalChapters) {
            showGameCompleteMessage();
        }
    }
}

// 显示游戏完成消息
function showGameCompleteMessage() {
    // 检查是否已经显示了游戏完成消息
    if (document.querySelector('.game-complete')) {
        return;
    }
    
    const gameCompleteDiv = document.createElement('div');
    gameCompleteDiv.className = 'game-complete';
    gameCompleteDiv.innerHTML = `
        <h3>恭喜，你已完成本游戏!</h3>
        <p>你已经到达了故事的最终章节。你可以继续探索不同的剧情分支，或重新开始游戏。</p>
        <button class="restart-btn">重新开始</button>
    `;
    
    // 插入到选择按钮之前
    const choicesContainer = document.querySelector('.choices-container');
    choicesContainer.parentNode.insertBefore(gameCompleteDiv, choicesContainer);
    
    // 禁用生成新节点的功能
    disableNewBranches();
    
    // 添加重新开始按钮的点击事件
    gameCompleteDiv.querySelector('.restart-btn').addEventListener('click', () => {
        if (confirm('确定要重新开始游戏吗？当前进度将被重置。')) {
            resetGame();
        }
    });
}

// 禁用生成新节点的功能
function disableNewBranches() {
    // 标记游戏已完成
    gameState.gameCompleted = true;
}

// 重置游戏
function resetGame() {
    // 重置游戏状态
    gameState.exploredNodes = new Set();
    gameState.currentPath = [];
    gameState.gameCompleted = false;
    
    // 恢复初始节点
    currentStoryNode = storyContent.opening;
    
    // 记录初始节点已被探索
    gameState.exploredNodes.add(currentStoryNode.id);
    gameState.currentPath.push(currentStoryNode.id);
    
    // 更新显示
    updateStoryDisplay(currentStoryNode);
    updateChoices(currentStoryNode.choices);
    updateSidePanelStoryTree();
    
    // 移除游戏完成消息
    const gameCompleteDiv = document.querySelector('.game-complete');
    if (gameCompleteDiv) {
        gameCompleteDiv.remove();
    }
    
    // 重置历史记录
    document.getElementById('storyHistory').innerHTML = '';
    addToHistory({
        title: "游戏重置",
        content: "开始新的游戏"
    });
    
    // 滚动到顶部
    window.scrollTo({ top: 0, behavior: 'smooth' });
}
// 更新示例故事内容库，提供更具体的场景描述和选项
const storyContent = {
    opening: {
        id: 'node-1',
        title: "第一章：神秘的开始",
        content: "这是一个平静的早晨，你推开窗户，发现街道上空无一人。昨晚的暴雨似乎冲刷走了城市的喧嚣，留下的只有潮湿的空气和若有若无的雾气。整个城市像是被按下了暂停键，没有行人，没有车辆，甚至连鸟叫声都听不到。",
        choices: [
            {
                text: "走出门外调查街道情况",
                effect: "直接面对未知环境",
                nextContent: "你决定走出门外一探究竟。踏上湿漉漉的街道，水洼倒映着灰蒙蒙的天空。街道两侧的店铺都紧闭着门窗，仿佛一夜之间所有人都消失了。在街角处，你注意到一处不寻常的痕迹，像是有什么东西被拖拽过的痕迹，通向一条小巷。"
            },
            {
                text: "先收集更多信息再行动",
                effect: "谨慎获取情报",
                nextContent: "你决定先收集更多信息。打开手机，发现网络信号异常微弱，社交媒体上没有任何更新，新闻频道播放的都是昨天的内容。你拨打了几个紧急电话，但都无人接听。当你望向窗外时，注意到远处一座高楼的顶层有一个闪烁的光点。"
            }
        ]
    }
};

// 当前游戏状态
let currentStoryNode = storyContent.opening;

// 修改初始化游戏函数，确保初始节点被记录
function initializeGame() {
    // 确保初始节点有ID
    if (!currentStoryNode.id) {
        currentStoryNode.id = 'node-1';
    }
    
    // 记录初始节点已被探索
    gameState.exploredNodes.add(currentStoryNode.id);
    gameState.currentPath.push(currentStoryNode.id);
    
    // 显示初始内容
    updateStoryDisplay(currentStoryNode);
    // 显示初始选项
    updateChoices(currentStoryNode.choices);

    // 更新侧边栏剧情树
    updateSidePanelStoryTree();

    // 确保进度条初始化
    updateChapterProgress();
}

// 更新故事显示
function updateStoryDisplay(node) {
    // 更新标题
    document.getElementById('currentStageTitle').textContent = node.title;
    // 更新内容
    document.getElementById('storyText').textContent = node.content;
    // 更新章节信息
    document.getElementById('currentChapter').textContent = node.title;
    
    // 生成新的场景图片
    regenerateImage(node.content);
    
    // 将节点添加到剧情树
    addToStoryTree(node);
     
    // 更新进度条
    updateChapterProgress();
}

// 修改updateChoices函数，增加防御性检查
function updateChoices(choices) {
    const choicesContainer = document.getElementById('choiceButtons');
    
    // 防御性检查：确保choices是一个数组且不为空
    if (!choices || !Array.isArray(choices) || choices.length === 0) {
        console.warn('未提供有效选项，使用默认选项');
        choices = [
            {
                text: "继续探索",
                effect: "寻找更多线索",
                nextContent: "你决定继续前进，希望能找到更多线索..."
            },
            {
                text: "尝试不同方向",
                effect: "开辟新路径",
                nextContent: "你决定换一个方向探索，也许会有新的发现..."
            }
        ];
    }
    
    // 更新选择按钮HTML
    choicesContainer.innerHTML = choices.map((choice, index) => `
        <button class="choice-btn" data-choice-index="${index}">
            <span class="choice-text">${choice.text}</span>
            <span class="choice-effect">${choice.effect || '未知效果'}</span>
        </button>
    `).join('');

    // 添加选择按钮的点击事件
    const choiceButtons = choicesContainer.querySelectorAll('.choice-btn');
    choiceButtons.forEach(btn => {
        btn.addEventListener('click', handleChoiceClick);
    });
}
// 修改handleChoiceClick函数，考虑游戏完成状态
function handleChoiceClick(event) {
    const button = event.currentTarget;
    const choiceIndex = parseInt(button.dataset.choiceIndex);
    
    // 防御性检查
    if (!currentStoryNode || !currentStoryNode.choices || currentStoryNode.choices.length === 0) {
        console.error('当前节点没有有效的选择项');
        currentStoryNode.choices = generateChoicesForRevertedNode(currentStoryNode);
        updateChoices(currentStoryNode.choices);
        return;
    }
    
    const currentChoice = currentStoryNode.choices[choiceIndex];
    
    // 再次确认currentChoice存在
    if (!currentChoice) {
        console.error('无效的选择索引:', choiceIndex);
        return;
    }

    // 保存当前状态到历史记录
    addToHistory({
        title: currentStoryNode.title,
        content: `选择了：${currentChoice.text}`
    });
    
    // 确保当前节点有ID
    if (!currentStoryNode.id) {
        currentStoryNode.id = 'node-' + Date.now();
    }
    
    // 记录当前节点已被探索
    gameState.exploredNodes.add(currentStoryNode.id);
    
    // 更新当前路径
    if (!gameState.currentPath.includes(currentStoryNode.id)) {
        gameState.currentPath.push(currentStoryNode.id);
    }

    // 显示加载状态
    document.getElementById('loadingIndicator').classList.remove('hidden');
    document.querySelector('.choices-container').classList.add('disabled');

    // 如果游戏已完成，只允许使用已有分支，不创建新分支
    if (gameState.gameCompleted) {
        // 查找现有分支
        const parentNode = findNodeInStoryTree(currentStoryNode.id);
        let existingChildForChoice = null;
        
        if (parentNode && parentNode.children) {
            existingChildForChoice = parentNode.children.find(child => {
                return child.title.includes(currentChoice.text) || 
                       child.content.includes(currentChoice.nextContent);
            });
        }
        
        if (existingChildForChoice) {
            // 如果找到匹配的分支，使用现有分支
            updateStoryWithExistingNode(existingChildForChoice);
            
            // 隐藏加载状态
            document.getElementById('loadingIndicator').classList.add('hidden');
            document.querySelector('.choices-container').classList.remove('disabled');
            
            // 更新进度条
            updateChapterProgress();
            return;
        } else {
            // 如果没有找到匹配的分支，显示提示
            alert('游戏已结束，只能探索现有的剧情分支。');
            
            // 隐藏加载状态
            document.getElementById('loadingIndicator').classList.add('hidden');
            document.querySelector('.choices-container').classList.remove('disabled');
            return;
        }
    }

    // 检查是否是回溯后的选择
    if (gameState.lastRevertedNodeId) {
        // 现有的回溯处理代码...
    }

    // 生成新的故事内容
    generateNextContent(currentChoice).then(newContent => {
        // 更新故事显示
        updateStoryWithNewContent(newContent);
        
        // 隐藏加载状态
        document.getElementById('loadingIndicator').classList.add('hidden');
        document.querySelector('.choices-container').classList.remove('disabled');
        
        // 清除回溯标记
        gameState.lastRevertedNodeId = null;
        
        // 更新进度条
        updateChapterProgress();
    });
    
    console.log("选择后已探索节点:", Array.from(gameState.exploredNodes));
}

// 添加使用现有节点更新故事的函数
function updateStoryWithExistingNode(node) {
    // 记住当前节点ID作为父节点ID
    const parentNodeId = currentStoryNode.id;
    
    // 更新当前节点
    currentStoryNode = {
        id: node.id,
        title: node.title,
        content: node.content,
        choices: node.choices,
        parentId: parentNodeId
    };

    // 记录节点已被探索
    gameState.exploredNodes.add(currentStoryNode.id);
    gameState.currentPath.push(currentStoryNode.id);
    
    // 更新显示
    updateStoryDisplay(currentStoryNode);
    updateChoices(node.choices);
}

// 初始化主题选择功能
function initializeThemeSelection(choice) {
    const themeButtons = document.querySelectorAll('.theme-btn');
    const confirmButton = document.querySelector('.confirm-theme-btn');
    let selectedTheme = null;

    // 重置主题按钮状态
    themeButtons.forEach(btn => {
        btn.classList.remove('active');
        btn.addEventListener('click', () => {
            themeButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            selectedTheme = btn.dataset.theme;
            confirmButton.disabled = false;
        });
    });

    // 确认按钮点击事件
    confirmButton.disabled = true;
    confirmButton.onclick = () => {
        if (!selectedTheme) return;

        // 生成新的故事内容
        generateNextContent(choice, selectedTheme).then(newContent => {
            // 更新故事显示
            updateStoryWithNewContent(newContent);
            
            // 隐藏主题选择界面
            document.getElementById('themeSelection').classList.add('hidden');
            
            // 恢复选择按钮区域
            document.querySelector('.choices-container').style.opacity = '1';
            document.querySelectorAll('.choice-btn').forEach(btn => {
                btn.disabled = false;
            });
            
            // 更新已选主题显示
            document.getElementById('selectedTheme').textContent = 
                document.querySelector(`[data-theme="${selectedTheme}"]`).textContent;
        });
    };
}

// 修改生成下一段故事内容函数，提供具体的剧情选项
async function generateNextContent(choice) {
    // 这里应该调用 AI API 来生成基于选择的新内容
    // 模拟故事进展，基于当前选择提供有关联的具体剧情选项
    
    // 获取当前剧情关键词
    const keywords = extractKeywords(currentStoryNode.content + ' ' + choice.nextContent);
    
    // 根据剧情内容和关键词，生成更具体的选项
    let newContent = {
        title: `${currentStoryNode.title} - 延展`,
        content: `${choice.nextContent}\n\n故事继续发展...\n\n在这条昏暗的街道上，你感受到了某种异样的气息。远处隐约传来低沉的声音，而路边的灯光闪烁不定。`,
        choices: generateSpecificChoices(choice.nextContent, keywords)
    };
    
    return newContent;
}

// 提取剧情关键词
function extractKeywords(text) {
    // 简单实现，将来可以用NLP技术提取更精准的关键词
    const commonWords = ['的', '了', '你', '我', '他', '她', '它', '是', '在', '有', '和', '与', '这', '那', '将', '被'];
    const words = text.split(/\s+|[,.!?;，。！？；]/);
    
    // 过滤掉常见词和短词，按出现频率排序
    return words.filter(word => 
        word.length > 1 && !commonWords.includes(word)
    ).reduce((acc, word) => {
        acc[word] = (acc[word] || 0) + 1;
        return acc;
    }, {});
}

// 生成具体的剧情选项
function generateSpecificChoices(currentContent, keywords) {
    // 基于当前剧情和关键词，生成2个具体的选择
    
    // 这里是模拟生成，将来可以通过API调用获取真实的选项
    const scenarioMap = {
        '街道': ['调查可疑的声响', '寻找附近的安全地点'],
        '声音': ['循着声音靠近查看', '保持距离并观察动静'],
        '薄雾': ['穿过薄雾继续前行', '绕道避开迷雾区域'],
        '痕迹': ['仔细检查地上的痕迹', '拍照记录并寻求帮助'],
        '建筑': ['进入建筑内部探索', '从外部观察建筑情况'],
        '身影': ['悄悄跟踪神秘身影', '出声呼唤引起注意'],
        '咖啡馆': ['进入咖啡馆寻找线索', '观察咖啡馆周围环境'],
        '标记': ['触摸奇怪的标记', '记录标记并研究其含义'],
        '高处': ['爬上高处寻找出路', '在地面寻找其他线索']
    };
    
    // 提取当前内容中匹配的场景关键词
    let matchedScenarios = [];
    for (const key in scenarioMap) {
        if (currentContent.includes(key)) {
            matchedScenarios.push(key);
        }
    }
    
    // 如果没有匹配的场景，使用默认选项
    if (matchedScenarios.length === 0) {
        return [
            {
                text: "深入调查周围环境",
                effect: "可能发现重要线索",
                nextContent: "你小心翼翼地查看四周，注意到一些不寻常的细节..."
            },
            {
                text: "寻找可能的出路",
                effect: "找到安全路径",
                nextContent: "你决定先确保自己的安全，开始寻找可能的离开路径..."
            }
        ];
    }
    
    // 随机选择一个匹配的场景
    const selectedScenario = matchedScenarios[Math.floor(Math.random() * matchedScenarios.length)];
    const options = scenarioMap[selectedScenario];
    
    // 根据选定的场景生成具体选项
    return [
        {
            text: options[0],
            effect: "探索未知的风险",
            nextContent: `你决定${options[0]}。这可能带来意想不到的发现...`
        },
        {
            text: options[1],
            effect: "更加谨慎的方法",
            nextContent: `你选择${options[1]}，希望能以更安全的方式了解情况...`
        }
    ];
}

// 修改更新故事内容的函数，记录新节点ID和路径，维护父子关系
function updateStoryWithNewContent(newContent) {
    // 记住当前节点ID作为父节点ID
    const parentNodeId = currentStoryNode.id;
    
    // 生成新节点ID (如果没有的话)
    if (!newContent.id) {
        newContent.id = 'node-' + Date.now();
    }
    
    // 更新当前节点
    currentStoryNode = {
        id: newContent.id,
        title: newContent.title,
        content: newContent.content,
        choices: newContent.choices,
        parentId: parentNodeId  // 重要：记录父节点关系
    };

    // 记录新节点已被探索
    gameState.exploredNodes.add(currentStoryNode.id);
    gameState.currentPath.push(currentStoryNode.id);
    
    // 更新游戏状态中的树结构
    updateStoryTreeStructure(parentNodeId, currentStoryNode);

    // 更新显示
    updateStoryDisplay(currentStoryNode);
    updateChoices(newContent.choices);

    // 更新侧边栏剧情树
    updateSidePanelStoryTree();
}

// 更新游戏状态中的树结构
function updateStoryTreeStructure(parentNodeId, childNode) {
    // 如果游戏状态没有树，则初始化
    if (gameState.storyTree.length === 0) {
        gameState.storyTree = buildTempStoryTree();
    }
    
    // 查找父节点
    const parentNode = findNodeInStoryTree(parentNodeId);
    
    if (parentNode) {
        // 如果找到父节点，将子节点添加到其子节点列表
        if (!parentNode.children) {
            parentNode.children = [];
        }
        
        // 检查是否已存在该子节点
        const existingIndex = parentNode.children.findIndex(node => node.id === childNode.id);
        if (existingIndex >= 0) {
            // 更新现有节点
            parentNode.children[existingIndex] = {...childNode};
        } else {
            // 添加新节点
            parentNode.children.push({...childNode});
        }
    } else {
        // 如果找不到父节点，将此节点作为根节点添加
        const existingIndex = gameState.storyTree.findIndex(node => node.id === childNode.id);
        if (existingIndex >= 0) {
            gameState.storyTree[existingIndex] = {...childNode};
        } else {
            gameState.storyTree.push({...childNode});
        }
    }
}

// 添加到剧情树
function addToStoryTree(node) {
    const treeContainer = document.getElementById('storyTree');
    const nodeElement = document.createElement('div');
    nodeElement.className = 'tree-node';
    nodeElement.textContent = node.title;
    treeContainer.appendChild(nodeElement);
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
            modal.classList.remove('active');
            addToHistory({
                title: "编辑",
                content: `修改了标题：${input.value}`
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
    document.getElementById('worldBackground').textContent = gameState.storyBackground;

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
    // 这里应该从角色数据中获取特征
    const traits = ["神秘", "聪明", "勇敢"]; // 示例特征
    return traits.map(trait => `
        <span class="character-trait">${trait}</span>
    `).join('');
}

// 添加到历史记录
function addToHistory(entry) {
    const historyContainer = document.getElementById('storyHistory');
    const historyEntry = document.createElement('p');
    historyEntry.textContent = `- ${entry.content}`;
    historyContainer.insertBefore(historyEntry, historyContainer.firstChild);
}

// 初始化剧情树功能
function initializeStoryTreeFeatures() {
    const viewTreeBtn = document.querySelector('.view-tree-btn');
    const storyTreeModal = document.getElementById('storyTreeModal');
    const closeModal = storyTreeModal.querySelector('.close-modal');
    
    // 打开剧情树模态框
    viewTreeBtn.addEventListener('click', () => {
        renderFullStoryTree();
        storyTreeModal.classList.add('active');
        
        // 确保模态框显示后再调整大小
        setTimeout(() => {
            adjustContainerSize();
        }, 100);
    });
    
    // 关闭模态框
    closeModal.addEventListener('click', () => {
        storyTreeModal.classList.remove('active');
    });
    
    // 初始化剧情树编辑工具
    initializeTreeEditTools();
}

// 修改渲染完整剧情树函数，添加调试信息
function renderFullStoryTree() {
    const fullStoryTree = document.getElementById('fullStoryTree');
    fullStoryTree.innerHTML = '';
    
    // 打印调试信息
    console.log("已探索节点:", Array.from(gameState.exploredNodes));
    console.log("当前路径:", gameState.currentPath);
    
    // 根据已探索节点构建剧情树
    const exploredTree = buildExploredStoryTree();
    console.log("构建的剧情树:", exploredTree);
    
    // 渲染剧情树
    if (exploredTree.length > 0) {
        renderStoryTreeNodes(exploredTree, fullStoryTree);
        
        // 添加节点之间的连接线
        drawNodeConnections();
        
        // 高亮当前路径
        highlightCurrentPath();
    } else {
        // 如果没有探索过的节点，显示提示
        const emptyTreeMessage = document.createElement('div');
        emptyTreeMessage.className = 'empty-tree-message';
        emptyTreeMessage.textContent = '游戏刚刚开始，尚未形成剧情树。继续游戏以探索更多分支！';
        fullStoryTree.appendChild(emptyTreeMessage);
    }
    
    // 初始自动调整容器大小以适应内容
    adjustContainerSize();

    // 添加拖动功能
    initializeDraggableTree();
}

// 修改buildExploredStoryTree函数，确保显示所有已探索节点
function buildExploredStoryTree() {
    // 确保当前节点已被记录
    if (currentStoryNode && currentStoryNode.id) {
        gameState.exploredNodes.add(currentStoryNode.id);
    }
    
    console.log("构建树前的已探索节点:", Array.from(gameState.exploredNodes));
    
    // 创建一个包含所有已探索节点的新树
    const exploredTree = [];
    const nodeMap = {};
    
    // 第一步：创建所有已探索节点的浅拷贝
    Array.from(gameState.exploredNodes).forEach(nodeId => {
        // 查找节点数据
        const nodeData = findExistingNodeData(nodeId);
        if (nodeData) {
            // 创建节点浅拷贝
            const nodeCopy = { ...nodeData, children: [] };
            nodeMap[nodeId] = nodeCopy;
        } else {
            // 如果找不到节点数据，则使用基本信息创建一个
            const nodeCopy = { 
                id: nodeId, 
                title: `节点 ${nodeId}`, 
                content: '内容未知',
                children: [] 
            };
            nodeMap[nodeId] = nodeCopy;
        }
    });
    
    // 第二步：重建节点关系
    Array.from(gameState.exploredNodes).forEach(nodeId => {
        const nodeData = findExistingNodeData(nodeId);
        if (nodeData && nodeData.parentId) {
            // 如果节点有父节点且父节点也在已探索集合中
            if (gameState.exploredNodes.has(nodeData.parentId)) {
                const parentNode = nodeMap[nodeData.parentId];
                const childNode = nodeMap[nodeId];
                
                // 将子节点添加到父节点的children数组中
                if (parentNode && childNode && !parentNode.children.some(n => n.id === childNode.id)) {
                    parentNode.children.push(childNode);
                }
            } else {
                // 如果父节点未探索，将此节点视为根节点
                if (!exploredTree.some(n => n.id === nodeId)) {
                    exploredTree.push(nodeMap[nodeId]);
                }
            }
        } else {
            // 没有父节点的节点都是根节点
            if (!exploredTree.some(n => n.id === nodeId)) {
                exploredTree.push(nodeMap[nodeId]);
            }
        }
    });
    
    // 如果找不到任何根节点，至少显示当前节点
    if (exploredTree.length === 0 && currentStoryNode) {
        exploredTree.push({
            id: currentStoryNode.id || 'node-1',
            title: currentStoryNode.title,
            content: currentStoryNode.content,
            children: []
        });
    }
    
    console.log("重构后的探索树:", exploredTree);
    return exploredTree;
}
// 添加高亮当前路径的功能
function highlightCurrentPath() {
    // 清除所有高亮
    document.querySelectorAll('.tree-node').forEach(node => {
        node.classList.remove('current-path');
    });
    
    // 高亮当前路径上的所有节点
    gameState.currentPath.forEach(nodeId => {
        const nodeElement = document.getElementById(nodeId);
        if (nodeElement) {
            nodeElement.classList.add('current-path');
        }
    });
}

// 在游戏状态和临时树中查找节点数据
function findExistingNodeData(nodeId) {
    // 首先在游戏状态中查找
    if (gameState.storyTree && gameState.storyTree.length > 0) {
        const result = findNodeInTree(gameState.storyTree, nodeId);
        if (result) return result;
    }
    
    // 然后在临时树中查找
    const tempTree = buildTempStoryTree();
    return findNodeInTree(tempTree, nodeId);
}

// 在树中递归查找节点
function findNodeInTree(tree, nodeId) {
    if (!tree) return null;
    
    // 遍历树中的每个节点
    for (const node of tree) {
        if (node.id === nodeId) {
            return node;
        }
        
        // 递归搜索子节点
        if (node.children && node.children.length > 0) {
            const result = findNodeInTree(node.children, nodeId);
            if (result) return result;
        }
    }
    
    return null;
}

// 初始化可拖动树功能
function initializeDraggableTree() {
    const treeContainer = document.querySelector('.full-story-tree-container');
    const fullStoryTree = document.getElementById('fullStoryTree');
    
    let isDragging = false;
    let startX, startY, scrollLeft, scrollTop;
    
    // 阻止默认的选择行为
    treeContainer.addEventListener('mousedown', (e) => {
        // 如果点击的是节点或按钮，不启动拖动
        if (e.target.closest('.tree-node') || e.target.closest('button')) {
            return;
        }
        
        isDragging = true;
        treeContainer.style.cursor = 'grabbing';
        startX = e.pageX - treeContainer.offsetLeft;
        startY = e.pageY - treeContainer.offsetTop;
        scrollLeft = treeContainer.scrollLeft;
        scrollTop = treeContainer.scrollTop;
        
        // 防止选择文本
        e.preventDefault();
    });
    
    treeContainer.addEventListener('mouseleave', () => {
        isDragging = false;
        treeContainer.style.cursor = 'grab';
    });
    
    treeContainer.addEventListener('mouseup', () => {
        isDragging = false;
        treeContainer.style.cursor = 'grab';
    });
    
    treeContainer.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        
        const x = e.pageX - treeContainer.offsetLeft;
        const y = e.pageY - treeContainer.offsetTop;
        
        // 计算鼠标移动距离
        const moveX = x - startX;
        const moveY = y - startY;
        
        // 更新滚动位置
        treeContainer.scrollLeft = scrollLeft - moveX;
        treeContainer.scrollTop = scrollTop - moveY;
    });
    
    // 设置初始的grab光标样式
    treeContainer.style.cursor = 'grab';
}



// 自动调整容器大小
function adjustContainerSize() {
    // 获取所有节点的位置
    const nodes = document.querySelectorAll('.tree-node');
    if (nodes.length === 0) return;
    
    let maxX = 0;
    let maxY = 0;
    
    nodes.forEach(node => {
        const x = parseFloat(node.style.left) + parseFloat(node.dataset.width);
        const y = parseFloat(node.style.top) + parseFloat(node.dataset.height);
        
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
    });
    
    // 获取可见区域高度
    const treeContainer = document.querySelector('.full-story-tree-container');
    const containerHeight = treeContainer.clientHeight;
    
    // 设置容器最小大小 - 但不超过可视区域高度
    const container = document.getElementById('fullStoryTree');
    container.style.minWidth = `${maxX + 100}px`; // 减少右边距
    
    // 如果内容高度小于容器高度，就设置为容器高度减去一点空间，避免出现滚动条
    // 否则设置为内容高度加上一点额外空间
    if (maxY + 100 < containerHeight) {
        container.style.minHeight = `${containerHeight - 50}px`;
    } else {
        container.style.minHeight = `${maxY + 100}px`;
    }
}

// 构建临时剧情树（用于演示）
function buildTempStoryTree() {
    // 从当前故事内容构建一个简单的树结构
    const root = {
        id: 'node-1',
        title: storyContent.opening.title,
        content: storyContent.opening.content.substring(0, 50) + '...',
        children: []
    };
    
    // 为每个选择添加一个子节点
    storyContent.opening.choices.forEach((choice, index) => {
        const childNode = {
            id: `node-${index + 2}`,
            title: `选择: ${choice.text}`,
            content: choice.nextContent.substring(0, 50) + '...',
            parentId: 'node-1',
            children: []
        };
        
        // 如果有下一步选择，为其添加子节点
        if (choice.nextChoices) {
            choice.nextChoices.forEach((nextChoice, nextIndex) => {
                childNode.children.push({
                    id: `node-${index + 2}-${nextIndex + 1}`,
                    title: `下一步: ${nextChoice.text}`,
                    content: nextChoice.nextContent.substring(0, 50) + '...',
                    parentId: childNode.id,
                    children: []
                });
            });
        }
        
        root.children.push(childNode);
    });
    
    return [root];
}

// 递归渲染剧情树节点 - 采用自下而上的计算方式
function renderStoryTreeNodes(nodes, container, level = 0, horizontalPosition = 0, totalWidth = null, isFirstCall = true) {
    const nodeWidth = 200;  // 节点宽度
    const horizontalGap = 80;  // 水平间隙
    const verticalGap = 100;  // 垂直间隙
    
    // 首次调用时，先计算树的结构和各层布局
    if (isFirstCall) {
        // 确定树的最大深度
        let maxDepth = 0;
        
        // 计算树的最大深度
        function getTreeDepth(nodes, currentDepth = 0) {
            if (nodes.length === 0) return currentDepth;
            maxDepth = Math.max(maxDepth, currentDepth);
            nodes.forEach(node => {
                if (node.children && node.children.length > 0) {
                    getTreeDepth(node.children, currentDepth + 1);
                }
            });
            return maxDepth;
        }
        
        // 获取树的最大深度
        maxDepth = getTreeDepth(nodes);
        
        // 从最后一层向上计算节点的理想位置
        const nodePositions = {};
        
        // 计算每个节点下方所有叶子节点的数量
        function countLeafNodesBelow(node, depth = 0) {
            if (!node.children || node.children.length === 0) {
                return 1; // 叶子节点返回1
            }
            
            let leafCount = 0;
            node.children.forEach(child => {
                leafCount += countLeafNodesBelow(child, depth + 1);
            });
            
            // 如果是最后一层的父节点，我们按满节点计算
            if (depth === maxDepth - 1) {
                // 计算应该的满叶子节点数量
                const fullLeafCount = Math.pow(2, node.children.length);
                leafCount = Math.max(leafCount, fullLeafCount);
            }
            
            return leafCount;
        }
        
        // 计算每个节点的水平位置 - 修复节点布局问题
function calculateNodePositions(nodes, level = 0, startPos = 0) {
    if (nodes.length === 0) return;
    
    const nodeWidth = 200;    // 节点宽度
    const horizontalGap = 80; // 水平间隙
    
    // 特殊处理根节点层，确保居中
    if (level === 0) {
        // 获取容器宽度
        const containerWidth = document.querySelector('.full-story-tree-container').clientWidth;
        
        // 如果只有一个根节点，直接居中
        if (nodes.length === 1) {
            const rootNode = nodes[0];
            
            // 计算根节点下所有子树的总宽度
            let childrenWidth = 0;
            let childStartPos = 0;
            
            if (rootNode.children && rootNode.children.length > 0) {
                const totalLeafNodes = countLeafNodesBelow(rootNode);
                childrenWidth = totalLeafNodes * nodeWidth + (totalLeafNodes - 1) * horizontalGap;
            }
            
            // 确保根节点居中于容器
            const rootNodePos = Math.max((containerWidth - nodeWidth) / 2, 20);
            nodePositions[rootNode.id] = rootNodePos;
            
            // 计算子节点的起始位置，使其整体居中于容器
            if (rootNode.children && rootNode.children.length > 0) {
                childStartPos = Math.max((containerWidth - childrenWidth) / 2, 20);
                calculateNodePositions(rootNode.children, level + 1, childStartPos);
            }
        } else {
            // 多个根节点的处理
            // 计算所有根节点占用的总宽度
            const totalWidth = nodes.length * nodeWidth + (nodes.length - 1) * horizontalGap;
            let currentPos = (containerWidth - totalWidth) / 2;
            
            // 分配每个根节点的位置
            nodes.forEach(node => {
                nodePositions[node.id] = currentPos;
                
                // 为每个根节点的子树分配位置
                if (node.children && node.children.length > 0) {
                    calculateNodePositions(node.children, level + 1, currentPos);
                }
                
                // 移动到下一个根节点位置
                currentPos += nodeWidth + horizontalGap;
            });
        }
        
        return;
    }
    
    // 非根节点的处理逻辑
    let currentPos = startPos;
    
    nodes.forEach(node => {
        if (node.children && node.children.length > 0) {
            // 有子节点的节点
            const leafCount = countLeafNodesBelow(node);
            const width = leafCount * nodeWidth + (leafCount - 1) * horizontalGap;
            
            // 父节点应该居中于其所有子节点
            const childCenterPos = currentPos + width / 2;
            nodePositions[node.id] = childCenterPos - nodeWidth / 2;
            
            // 递归计算子节点位置
            calculateNodePositions(node.children, level + 1, currentPos);
            
            // 更新下一个节点的起始位置
            currentPos += width;
        } else {
            // 没有子节点的节点 (叶子节点)
            nodePositions[node.id] = currentPos;
            currentPos += nodeWidth + horizontalGap;
        }
    });
}
        // 计算节点位置
        calculateNodePositions(nodes, 0, 0);
        
        // 渲染节点
        renderNodesWithPositions(nodes, container, level, nodePositions);
        
        // 绘制连接线
        drawNodeConnections();
        
        // 调整容器大小
        setTimeout(adjustContainerSize, 50);
        
        return;
    }
    
    nodes.forEach((node, index) => {
        // 计算节点位置
        const nodeElement = document.createElement('div');
        nodeElement.className = 'tree-node';
        nodeElement.id = node.id;
        nodeElement.dataset.level = level;
        
        // 第一层节点居中，后续层节点根据子节点数量均匀分布
        let nodeLeft = horizontalPosition;
        if (level === 0 && index === 0) {
            // 第一个节点居中
            nodeLeft = totalWidth  / 2;
        } else if (nodes.length > 1) {
            // 多个同级节点，均匀分布
            const levelWidth = (nodes.length- 1.2) * nodeWidth + (nodes.length - 2) * horizontalGap;
            const startPos = horizontalPosition - levelWidth / 2 + nodeWidth / 2;
            nodeLeft = startPos + index * (nodeWidth + horizontalGap);
        }
        
        const nodeTop = level * (verticalGap + 30);
        
        nodeElement.style.position = 'absolute';
        nodeElement.style.width = `${nodeWidth}px`;
        nodeElement.style.left = `${nodeLeft}px`;
        nodeElement.style.top = `${nodeTop}px`;
        
        nodeElement.innerHTML = `
            <div class="node-title">${node.title}</div>
            <div class="node-content">${node.content}</div>
        `;
        
        // 记录节点位置信息，用于绘制连接线
        nodeElement.dataset.x = nodeLeft;
        nodeElement.dataset.y = nodeTop + 30;
        nodeElement.dataset.width = nodeWidth;
        nodeElement.dataset.height = '60';
        
        // 点击选择节点
        nodeElement.addEventListener('click', (e) => {
            // 清除其他选中节点
            document.querySelectorAll('.tree-node.selected').forEach(el => {
                el.classList.remove('selected');
            });
            
            // 选中当前节点
            nodeElement.classList.add('selected');
            
            // 启用编辑和删除按钮
            document.querySelector('.edit-node-btn').disabled = false;
            document.querySelector('.delete-node-btn').disabled = false;
            
            // 防止事件冒泡到容器
            e.stopPropagation();
        });
        
        container.appendChild(nodeElement);
        
        // 计算子节点布局
        if (node.children && node.children.length > 0) {
            // 子节点应该在父节点下方，水平居中排列
            const childWidth = node.children.length * nodeWidth + (node.children.length - 1) * horizontalGap;
            const childStartPos = nodeLeft + nodeWidth/2 - childWidth/2;
            
            // 递归渲染子节点
            renderStoryTreeNodes(node.children, container, level + 1, childStartPos, totalWidth);
        }
    });
}
// 修改renderNodesWithPositions函数，移除内嵌的回溯按钮
function renderNodesWithPositions(nodes, container, level = 0, nodePositions) {
    const nodeWidth = 200;  // 节点宽度
    const verticalGap = 100;  // 垂直间隙
    
    // 递归渲染节点
    function renderNode(node, level) {
        const nodeElement = document.createElement('div');
        nodeElement.className = 'tree-node';
        nodeElement.id = node.id;
        nodeElement.dataset.level = level;
        
        // 使用计算好的水平位置
        let nodeLeft = nodePositions[node.id];
        
        // 确保节点位置有效，避免NaN或undefined
        if (nodeLeft === undefined) {
            // 默认位置计算
            nodeLeft = 0;
        }
        
        const nodeTop = level * (verticalGap + 30);
        
        nodeElement.style.position = 'absolute';
        nodeElement.style.width = `${nodeWidth}px`;
        nodeElement.style.left = `${nodeLeft}px`;
        nodeElement.style.top = `${nodeTop}px`;
        
        // 移除回溯按钮，只保留标题和内容
        nodeElement.innerHTML = `
            <div class="node-title">${node.title}</div>
            <div class="node-content">${node.content}</div>
        `;
        
        // 记录节点位置信息，用于绘制连接线
        nodeElement.dataset.x = nodeLeft;
        nodeElement.dataset.y = nodeTop;
        nodeElement.dataset.width = nodeWidth;
        nodeElement.dataset.height = '60';
        
        // 点击选择节点
        nodeElement.addEventListener('click', (e) => {
            // 清除其他选中节点
            document.querySelectorAll('.tree-node.selected').forEach(el => {
                el.classList.remove('selected');
            });
            
            // 选中当前节点
            nodeElement.classList.add('selected');
            
            // 发布节点选择事件
            const selectEvent = new CustomEvent('nodeSelected', { 
                detail: { nodeId: node.id, isSelected: true }
            });
            document.dispatchEvent(selectEvent);
            
            // 防止事件冒泡到容器
            e.stopPropagation();
        });
        
        container.appendChild(nodeElement);
        
        // 递归渲染子节点
        if (node.children && node.children.length > 0) {
            node.children.forEach(child => {
                renderNode(child, level + 1);
            });
        }
    }
    
    // 渲染所有根节点
    nodes.forEach(node => {
        renderNode(node, level);
    });
}
// 修改revertToNode函数，确保回溯节点一定有选项
function revertToNode(nodeId) {
    // 查找要回溯到的节点
    const targetNode = findExistingNodeData(nodeId);
    if (!targetNode) {
        console.error('无法找到要回溯的节点:', nodeId);
        return;
    }
    
    // 记录回溯操作到历史记录
    addToHistory({
        title: "回溯",
        content: `返回到了"${targetNode.title}"`
    });
    
    // 标记当前所处的节点ID，用于后续比较选择
    gameState.lastRevertedNodeId = nodeId;
    
    // 更新当前节点
    currentStoryNode = JSON.parse(JSON.stringify(targetNode)); // 深拷贝，避免引用问题
    
    // 确保节点有选择项
    if (!currentStoryNode.choices || currentStoryNode.choices.length === 0) {
        currentStoryNode.choices = generateChoicesForRevertedNode(currentStoryNode);
    }
    
    // 更新当前路径 - 确保回溯后路径正确
    const nodeIndex = gameState.currentPath.indexOf(nodeId);
    if (nodeIndex >= 0) {
        // 如果节点在当前路径中，截取到该节点
        gameState.currentPath = gameState.currentPath.slice(0, nodeIndex + 1);
    } else {
        // 如果节点不在当前路径中，可能需要重建路径
        // 寻找从根节点到目标节点的路径
        const newPath = findPathToNode(nodeId);
        if (newPath.length > 0) {
            gameState.currentPath = newPath;
        } else {
            // 如果找不到路径，则简单添加到路径末尾
            gameState.currentPath.push(nodeId);
        }
    }
    
    console.log("回溯后的路径:", gameState.currentPath);
    
    // 更新显示
    updateStoryDisplay(currentStoryNode);
    updateChoices(currentStoryNode.choices);
    
    // 更新侧边栏剧情树
    updateSidePanelStoryTree();

    // 滚动到顶部以便玩家可以阅读回溯的内容
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// 寻找从根节点到目标节点的路径
function findPathToNode(targetNodeId) {
    const path = [];
    
    function searchPath(nodes, currentPath) {
        for (const node of nodes) {
            // 试探将当前节点加入路径
            const newPath = [...currentPath, node.id];
            
            // 如果找到目标节点，返回路径
            if (node.id === targetNodeId) {
                return newPath;
            }
            
            // 如果有子节点，继续搜索
            if (node.children && node.children.length > 0) {
                const result = searchPath(node.children, newPath);
                if (result.length > 0) {
                    return result; // 找到路径就返回
                }
            }
        }
        
        return []; // 没找到路径
    }
    
    // 从游戏状态或临时树开始搜索
    const startTree = gameState.storyTree.length > 0 ? gameState.storyTree : buildTempStoryTree();
    return searchPath(startTree, path);
}

// 为回溯节点生成选项（增强版）
function generateChoicesForRevertedNode(node) {
    // 如果节点已有选项且不为空，返回原始选项
    if (node && node.choices && node.choices.length > 0) {
        return node.choices;
    }
    
    // 根据节点内容生成更相关的选项
    const content = node && node.content ? node.content : '';
    const keywords = extractKeywords(content);
    return generateSpecificChoices(content, keywords);
}

// 绘制节点之间的连接线 - 树状连接
function drawNodeConnections() {
    // 清除旧的连接线
    document.querySelectorAll('.node-connection').forEach(conn => conn.remove());
    document.querySelectorAll('.tree-connections-svg').forEach(svg => svg.remove());

    const treeContainer = document.querySelector('.full-story-tree-container');
    const nodes = document.querySelectorAll('.tree-node');
    
    // 创建SVG元素用于绘制连接线
    const svgContainer = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svgContainer.classList.add('tree-connections-svg');
    svgContainer.style.position = 'absolute';
    svgContainer.style.top = '0';
    svgContainer.style.left = '0';
    svgContainer.style.width = '10000%';
    svgContainer.style.height = '10000%';
    svgContainer.style.pointerEvents = 'none'; // 避免影响鼠标事件
    svgContainer.style.zIndex = '1'; // 确保线条在节点下方
    treeContainer.appendChild(svgContainer);
    
    // 清除可能存在的旧箭头标记
    const defsElement = document.createElementNS("http://www.w3.org/2000/svg", "defs");
    svgContainer.appendChild(defsElement);
    
    nodes.forEach(node => {
        // 如果不是根节点，则绘制与父节点的连接
        if (node.dataset.level > 0) {
            const parentNodeId = findParentNodeId(node.id);
            if (parentNodeId) {
                const parentNode = document.getElementById(parentNodeId);
                if (parentNode) {
                    // 使用SVG绘制弯曲的连接线
                    drawSvgConnection(parentNode, node, svgContainer);
                }
            }
        }
    });
}

// 使用SVG绘制曲线连接
function drawSvgConnection(parentNode, childNode, svgContainer) {
    // 获取节点位置信息
    const parentX = parseFloat(parentNode.dataset.x) + parseFloat(parentNode.dataset.width) / 2;
    const parentY = parseFloat(parentNode.dataset.y) + parseFloat(parentNode.dataset.height)+30;
    const childX = parseFloat(childNode.dataset.x) + parseFloat(childNode.dataset.width) / 2;
    const childY = parseFloat(childNode.dataset.y)+10;
    
    // 创建贝塞尔曲线路径
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    
    // 计算控制点 - 为创建平滑曲线
    const midY = parentY + (childY - parentY) / 2;
    const controlY1 = parentY + (midY - parentY) / 2;
    const controlY2 = childY - (childY - midY) / 2;
    
    // 设置路径 - 使用更垂直的曲线
    path.setAttribute('d', `M${parentX},${parentY} C${parentX},${controlY1} ${childX},${controlY2} ${childX},${childY}`);
    path.setAttribute('fill', 'none');
    path.setAttribute('stroke', '#4a90e2');
    path.setAttribute('stroke-width', '2');
    
    // 添加到SVG容器
    svgContainer.appendChild(path);
    
    // 添加箭头指示方向
    const arrowMarker = document.createElementNS("http://www.w3.org/2000/svg", "marker");
    arrowMarker.setAttribute('id', `arrowhead-${parentNode.id}-${childNode.id}`);
    arrowMarker.setAttribute('markerWidth', '10');
    arrowMarker.setAttribute('markerHeight', '7');
    arrowMarker.setAttribute('refX', '9');
    arrowMarker.setAttribute('refY', '3.5');
    arrowMarker.setAttribute('orient', 'auto');
    
    const polygon = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
    polygon.setAttribute('points', '0 0, 10 3.5, 0 7');
    polygon.setAttribute('fill', '#4a90e2');
    
    arrowMarker.appendChild(polygon);
    svgContainer.appendChild(arrowMarker);
    
    // 使用唯一ID防止箭头冲突
    path.setAttribute('marker-end', `url(#arrowhead-${parentNode.id}-${childNode.id})`);
}

// 修改initializeTreeEditTools函数，将回溯按钮放到删除节点按钮旁边
function initializeTreeEditTools() {
    const addNodeBtn = document.querySelector('.add-node-btn');
    const editNodeBtn = document.querySelector('.edit-node-btn');
    const deleteNodeBtn = document.querySelector('.delete-node-btn');
    
    // 创建并添加回溯按钮
    const revertBtn = document.createElement('button');
    revertBtn.className = 'revert-node-btn tree-control-btn';
    revertBtn.innerHTML = '<i class="fas fa-history"></i> 回溯到此节点';
    revertBtn.disabled = true; // 初始状态禁用
    
    // 重要修改：将回溯按钮添加到删除节点按钮的后面
    if (deleteNodeBtn && deleteNodeBtn.parentNode) {
        deleteNodeBtn.parentNode.insertBefore(revertBtn, deleteNodeBtn.nextSibling);
    } else {
        // 如果找不到删除按钮，则添加到工具栏中
        const treeControls = document.querySelector('.tree-controls');
        if (treeControls) {
            treeControls.appendChild(revertBtn);
        }
    }
    
    // 初始状态下禁用编辑和删除按钮
    editNodeBtn.disabled = true;
    deleteNodeBtn.disabled = true;
    
    // 添加节点
    addNodeBtn.addEventListener('click', () => {
        const selectedNode = document.querySelector('.tree-node.selected');
        const parentId = selectedNode ? selectedNode.id : null;
        
        // 确认有选中的节点
        if (!selectedNode) {
            alert('请先选择一个节点作为父节点');
            return;
        }
        
        // 打开编辑模态框以创建新节点
        openNodeEditModal('add', parentId);
    });

    // 编辑节点
    editNodeBtn.addEventListener('click', () => {
        const selectedNode = document.querySelector('.tree-node.selected');
        if (selectedNode) {
            openNodeEditModal('edit', selectedNode.id);
        }
    });
    
    // 删除节点
    deleteNodeBtn.addEventListener('click', () => {
        const selectedNode = document.querySelector('.tree-node.selected');
        if (selectedNode) {
            if (confirm('确定要删除此节点吗？')) {
                deleteStoryNode(selectedNode.id);
                renderFullStoryTree();
            }
        }
    });
    
    // 回溯到选中节点
    revertBtn.addEventListener('click', () => {
        const selectedNode = document.querySelector('.tree-node.selected');
        if (selectedNode) {
            revertToNode(selectedNode.id);
            // 关闭模态框
            document.getElementById('storyTreeModal').classList.remove('active');
        }
    });
    
    // 监听节点选择状态，更新按钮可用性
    document.addEventListener('nodeSelected', (e) => {
        const nodeId = e.detail.nodeId;
        const isSelected = e.detail.isSelected;
        
        editNodeBtn.disabled = !isSelected;
        deleteNodeBtn.disabled = !isSelected;
        revertBtn.disabled = !isSelected;
    });
}

// 查找父节点ID
function findParentNodeId(nodeId) {
    // 使用节点映射表存储所有节点和它们的父节点关系
    const nodeMap = {};
    const parentMap = {};
    
    // 递归遍历树，记录所有节点的父节点关系
    function mapParentChildRelations(nodes, parentId = null) {
        if (!nodes || !nodes.length) return;
        
        nodes.forEach(node => {
            if (node) {
                nodeMap[node.id] = node;
                
                if (parentId) {
                    parentMap[node.id] = parentId;
                }
                
                if (node.children && node.children.length > 0) {
                    mapParentChildRelations(node.children, node.id);
                }
            }
        });
    }
    
    // 确定要搜索的树
    let treeToSearch;
    if (gameState.storyTree && gameState.storyTree.length > 0) {
        treeToSearch = gameState.storyTree;
    } else {
        treeToSearch = buildTempStoryTree();
    }
    
    // 构建父子关系映射
    mapParentChildRelations(treeToSearch);
    
    // 直接从映射表中查找父节点ID
    return parentMap[nodeId] || null;
}

// 处理节点连接
function handleNodeConnection(targetNodeId) {
    const container = document.querySelector('.full-story-tree-container');
    if (!connectionSource || connectionSource === targetNodeId) {
        container.classList.remove('connecting-mode');
        document.querySelector('.connect-node-btn').textContent = '连接节点';
        return;
    }
    
    // 创建连接
    createNodeConnection(connectionSource, targetNodeId);
    
    // 退出连接模式
    container.classList.remove('connecting-mode');
    connectionSource = null;
    document.querySelector('.connect-node-btn').textContent = '连接节点';
    
    // 重新渲染树以显示新连接
    renderFullStoryTree();
}

// 创建节点连接
function createNodeConnection(sourceId, targetId) {
    // 在数据结构中创建连接
    // 这里简化处理，实际中需要更新游戏状态中的剧情树数据结构
    const sourceNode = findNodeInStoryTree(sourceId);
    const targetNode = findNodeInStoryTree(targetId);
    
    if (sourceNode && targetNode) {
        if (!sourceNode.children) {
            sourceNode.children = [];
        }
        
        // 检查是否已存在连接
        const alreadyConnected = sourceNode.children.some(child => child.id === targetId);
        if (!alreadyConnected) {
            // 添加目标节点作为源节点的子节点
            targetNode.parentId = sourceId;
            sourceNode.children.push(targetNode);
        }
    }
}

// 在剧情树中查找节点
function findNodeInStoryTree(nodeId) {
    // 这里简化处理，实际中需要递归搜索游戏状态中的剧情树
    // 临时创建一个节点映射表用于演示
    const nodeMap = {};
    
    function mapNodes(nodes) {
        nodes.forEach(node => {
            nodeMap[node.id] = node;
            if (node.children && node.children.length > 0) {
                mapNodes(node.children);
            }
        });
    }
    
    // 使用临时树或游戏状态中的树
    const treeToSearch = gameState.storyTree.length > 0 ? gameState.storyTree : buildTempStoryTree();
    mapNodes(treeToSearch);
    
    return nodeMap[nodeId];
}

// 打开节点编辑模态框
function openNodeEditModal(mode, nodeId) {
    const editModal = document.getElementById('editModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalInput = document.getElementById('modalInput');
    const saveBtn = document.querySelector('.save-modal-btn');
    
    // 设置模态框标题
    modalTitle.textContent = mode === 'add' ? '添加新节点' : '编辑节点';
    
    // 如果是编辑模式，填充现有内容
    if (mode === 'edit' && nodeId) {
        const node = findNodeInStoryTree(nodeId);
        if (node) {
            modalInput.value = `标题: ${node.title}\n内容: ${node.content}`;
        }
    } else {
        modalInput.value = '标题: 新节点\n内容: 请输入节点内容...';
    }
    
    // 显示模态框
    editModal.classList.add('active');
    
    // 保存按钮点击事件
    saveBtn.onclick = () => {
        const inputText = modalInput.value;
        const titleMatch = inputText.match(/标题: (.*)/);
        const contentMatch = inputText.match(/内容: (.*)/s);
        
        const title = titleMatch ? titleMatch[1] : '未命名节点';
        const content = contentMatch ? contentMatch[1] : '';
        
        if (mode === 'add') {
            addNewStoryNode(title, content, nodeId);
        } else {
            updateStoryNode(nodeId, title, content);
        }
        
        editModal.classList.remove('active');
        renderFullStoryTree();
    };
}

// 添加新的故事节点
function addNewStoryNode(title, content, parentId) {
    // 创建新节点
    const newNodeId = 'node-' + Date.now();
    const newNode = {
        id: newNodeId,
        title: title,
        content: content,
        parentId: parentId,
        children: []
    };
    
    // 将新节点添加到游戏状态中
    if (gameState.storyTree.length === 0) {
        // 如果还没有剧情树，初始化它
        gameState.storyTree = buildTempStoryTree();
    }
    
    if (parentId) {
        // 将新节点添加为指定父节点的子节点
        const parentNode = findNodeInStoryTree(parentId);
        if (parentNode) {
            if (!parentNode.children) {
                parentNode.children = [];
            }
            parentNode.children.push(newNode);
            
            // 立即重新渲染树以更新布局
            renderFullStoryTree();
            return;
        }
    }
    
    // 如果没有指定父节点或找不到父节点，将新节点添加为根节点
    gameState.storyTree.push(newNode);
    
    // 立即重新渲染树以更新布局
    renderFullStoryTree();
}

// 更新故事节点
function updateStoryNode(nodeId, title, content) {
    const node = findNodeInStoryTree(nodeId);
    if (node) {
        node.title = title;
        node.content = content;
    }
}

// 删除故事节点
function deleteStoryNode(nodeId) {
    // 在游戏状态中找到并删除节点
    function removeNodeFromTree(nodes) {
        for (let i = 0; i < nodes.length; i++) {
            if (nodes[i].id === nodeId) {
                nodes.splice(i, 1);
                return true;
            }
            if (nodes[i].children && nodes[i].children.length > 0) {
                if (removeNodeFromTree(nodes[i].children)) {
                    return true;
                }
            }
        }
        return false;
    }
    
    if (gameState.storyTree.length > 0) {
        removeNodeFromTree(gameState.storyTree);
    } else {
        // 如果游戏状态中没有剧情树，使用临时树
        const tempTree = buildTempStoryTree();
        if (removeNodeFromTree(tempTree)) {
            gameState.storyTree = tempTree;
        }
    }
}

// 初始化设定信息按钮
function initializeSettingsInfoButton() {
    const settingsInfoBtn = document.querySelector('.settings-info-btn');
    const settingsInfoModal = document.getElementById('settingsInfoModal');
    
    settingsInfoBtn.addEventListener('click', () => {
        updateSettingsInfoContent();
        settingsInfoModal.classList.add('active');
    });
    
    // 确保关闭按钮能关闭这个模态框
    settingsInfoModal.querySelector('.close-modal').addEventListener('click', () => {
        settingsInfoModal.classList.remove('active');
    });
}

// 更新设定信息内容
function updateSettingsInfoContent() {
    // 从本地存储获取游戏设置
    let gameSettings;
    try {
        gameSettings = JSON.parse(localStorage.getItem('gameSettings')) || {};
    } catch (e) {
        gameSettings = {};
        console.error('解析游戏设置失败:', e);
    }
    
    // 显示背景信息
    const backgroundEl = document.getElementById('settingsBackground');
    backgroundEl.textContent = gameSettings.background || '未设定故事背景';
    
    // 显示角色列表
    const charactersEl = document.getElementById('settingsCharacters');
    if (gameSettings.characters && gameSettings.characters.length > 0) {
        charactersEl.innerHTML = gameSettings.characters.map(char => `
            <div class="settings-character-item">
                <h4>${char.name || '未命名角色'}</h4>
                <p>${char.description || '无角色描述'}</p>
            </div>
        `).join('');
    } else {
        charactersEl.innerHTML = '<p>未设定角色</p>';
    }
    
    // 显示复杂度
    const complexityEl = document.getElementById('settingsComplexity');
    let complexityClass = '';
    let complexityText = '';
    
    switch(gameSettings.complexity) {
        case 'easy':
            complexityClass = 'complexity-easy';
            complexityText = '简单';
            break;
        case 'medium':
            complexityClass = 'complexity-medium';
            complexityText = '中等';
            break;
        case 'complex':
            complexityClass = 'complexity-complex';
            complexityText = '复杂';
            break;
        default:
            complexityClass = 'complexity-medium';
            complexityText = '中等（默认）';
    }
    
    complexityEl.innerHTML = `<span class="complexity-badge ${complexityClass}">${complexityText}</span>`;
    
    // 显示章节数
    const chapterCountEl = document.getElementById('settingsChapterCount');
    chapterCountEl.textContent = gameSettings.chapterCount || '未指定';
}

// 修改左侧剧情树面板的渲染函数，只显示当前路径
function updateSidePanelStoryTree() {
    const sideTreeContainer = document.getElementById('storyTree');
    if (!sideTreeContainer) return;
    
    sideTreeContainer.innerHTML = '';
    
    // 如果当前路径为空，显示初始提示
    if (!gameState.currentPath || gameState.currentPath.length === 0) {
        sideTreeContainer.innerHTML = '<div class="empty-tree-message">开始游戏后将显示剧情路径</div>';
        return;
    }
    
    // 创建路径树的HTML
    let pathHTML = '';
    
    // 获取路径上所有节点的数据
    const pathNodes = gameState.currentPath.map(nodeId => {
        const nodeData = findExistingNodeData(nodeId);
        return nodeData || { id: nodeId, title: `未知节点 ${nodeId}` };
    });
    
    // 为每个路径节点创建一个项目，按顺序排列
    pathNodes.forEach((node, index) => {
        const isCurrentNode = (index === pathNodes.length - 1);
        const nodeClass = isCurrentNode ? 'side-tree-node current' : 'side-tree-node';
        
        pathHTML += `
            <div class="${nodeClass}" data-node-id="${node.id}">
                <div class="node-content">
                    <span class="node-title">${node.title || '未命名节点'}</span>
                </div>
                ${index < pathNodes.length - 1 ? '<div class="path-arrow"><i class="fas fa-chevron-down"></i></div>' : ''}
            </div>
        `;
    });
    
    sideTreeContainer.innerHTML = pathHTML;
}
// 更新左侧面板剧情树样式，移除可点击的视觉提示
document.addEventListener('DOMContentLoaded', () => {
    // 创建样式元素
    const style = document.createElement('style');
    style.textContent += `
        /* 左侧面板剧情树样式 - 仅展示模式 */
        .story-tree {
            display: flex;
            flex-direction: column;
            gap: 10px;
            padding: 10px;
            overflow-y: auto;
            max-height: calc(100% - 100px);
        }
        
        .side-tree-node {
            background-color: #f9f9f9;
            border: 1px solid #ddd;
            border-radius: 6px;
            padding: 10px;
            position: relative;
            /* 移除鼠标手型光标，表明不可点击 */
            cursor: default;
            transition: all 0.2s ease;
        }
        
        /* 移除悬停效果，表明不可交互 */
        .side-tree-node:hover {
            background-color: #f9f9f9;
            transform: none;
            box-shadow: none;
        }
        
        .side-tree-node.current {
            border-color: #4CAF50;
            background-color: #e8f5e9;
            border-width: 2px;
            box-shadow: 0 0 5px rgba(76, 175, 80, 0.3);
        }
        
        .side-tree-node .node-title {
            font-weight: bold;
            color: #333;
            font-size: 14px;
            display: block;
            margin-bottom: 2px;
        }
        
        .path-arrow {
            display: flex;
            justify-content: center;
            margin: 5px 0;
            color: #4CAF50;
            font-size: 14px;
        }
        
        .empty-tree-message {
            color: #999;
            text-align: center;
            padding: 20px;
            font-style: italic;
        }
        
        /* 添加指示标签，表明这是路径展示 */
        .story-tree::before {
            content: '当前剧情路径';
            display: block;
            text-align: center;
            font-size: 12px;
            color: #666;
            margin-bottom: 10px;
            font-style: italic;
        }
    `;
    
    // 将样式添加到文档头部
    document.head.appendChild(style);
});
// 添加CSS样式
document.addEventListener('DOMContentLoaded', () => {
    // 创建样式元素
    const style = document.createElement('style');
    style.textContent = `
        /* 回溯按钮样式 */
        .revert-node-btn {
            background-color: #4CAF50;
            color: white;
            border: none;
            border-radius: 4px;
            padding: 8px 12px;
            margin-left: 10px;
            cursor: pointer;
            font-weight: bold;
            display: inline-flex;
            align-items: center;
        }
        
        .revert-node-btn:disabled {
            background-color: #cccccc;
            cursor: not-allowed;
        }
        
        .revert-node-btn:hover:not(:disabled) {
            background-color: #45a049;
        }
        
        .revert-node-btn i {
            margin-right: 5px;
        }
    `;
    
    // 将样式添加到文档头部
    document.head.appendChild(style);
});
// 在文档加载完成后初始化游戏
document.addEventListener('DOMContentLoaded', () => {
    // 隐藏主题选择区域
    const themeSelection = document.getElementById('themeSelection');
    if (themeSelection) {
        themeSelection.classList.add('hidden');
        // 也可以完全移除
        // themeSelection.remove();
    }
    
    // 移除主题显示区域
    const themeDisplayArea = document.querySelector('.selected-theme-container');
    if (themeDisplayArea) {
        themeDisplayArea.style.display = 'none';
    }
    
    initializeGame();
    initializeEditFeatures();
    initializeStoryInfoButtons();
    initializeStoryTreeFeatures(); // 初始化剧情树功能
    initializeSettingsInfoButton(); // 初始化设定信息按钮
});