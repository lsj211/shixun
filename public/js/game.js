// 修改游戏状态，添加已探索节点记录
const gameState = {
    title:"",
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
    currentPath: [], // 用于记录当前路径上的所有节点
    
    // 在 gameState 中添加图片设置
    imageSettings: {
        lastDescription: '',
        lastStyle: 'realistic',
        lastColorTone: 'warm',
        lastRequirements: ''
    }
};

// 新增：用存档内容覆盖gameState
function applyArchiveToGameState() {
    const urlParams = new URLSearchParams(window.location.search);
    const archiveKey = urlParams.get('archive') || localStorage.getItem('gameSettings_current');
    if (archiveKey) {
        try {
            const gameSettings = JSON.parse(localStorage.getItem(archiveKey));
            if (gameSettings) {
                if (gameSettings.background) gameState.storyBackground = gameSettings.background;
                if (Array.isArray(gameSettings.characters)) gameState.characters = gameSettings.characters;
                if (gameSettings.complexity) gameState.settings.complexity = gameSettings.complexity;
                if (gameSettings.chapterCount) gameState.settings.chapterCount = gameSettings.chapterCount;
                if (gameSettings.title) gameState.title = gameSettings.title;
                // 补充其他需要同步的字段（比如之前存档数据中的 meta、progress 等）
                if (gameSettings.meta) {
                    gameState.currentChapter = gameSettings.meta.currentChapter || gameState.currentChapter;
                    gameState.gameCompleted = gameSettings.meta.gameCompleted || false;
                }
                if (gameSettings.gameProgress) {
                    gameState.exploredNodes = new Set(gameSettings.gameProgress.exploredNodes || []);
                    gameState.currentPath = gameSettings.gameProgress.currentPath || [];
                    gameState.history = gameSettings.gameProgress.history || [];
                    // 同步当前节点ID（如果需要）
                    // currentStoryNode = currentStoryNode || { id: gameSettings.gameProgress.currentNodeId };
                }
                console.log('存档已成功应用到游戏状态');
            }
        } catch (e) {
            console.warn('存档解析失败', e);
        }
    }
}

applyArchiveToGameState();


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
    // currentStoryNode.content = gameState.storyBackground;
    // 确保初始节点有ID
    if (!currentStoryNode.id) {
        currentStoryNode.id = 'node-1';
    }
    
    // 缓存初始节点 - 新增这一行
    cacheNodeData(currentStoryNode);

    // 记录初始节点已被探索
    gameState.exploredNodes.add(currentStoryNode.id);
    // gameState.currentPath.push(currentStoryNode.id);
    
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
    //更新小说标题
    document.getElementById('storyTitle').textContent = gameState.title;

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
// 修改handleChoiceClick函数，添加生成下一段剧情的功能
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

    // 新增：根据大纲、当前剧情和选项内容生成下一段剧情
    generateNextContentFromAPI(currentChoice).then(newContent => {

        console.log("当前节点:", currentStoryNode);
        // 增加章节和场景信息
        // newContent.chapter = calculateNextChapter(currentStoryNode);
        // newContent.scene = calculateNextScene(currentStoryNode);
        
        // 更新故事显示
        updateStoryWithNewContent(newContent);
        
        // 隐藏加载状态
        document.getElementById('loadingIndicator').classList.add('hidden');
        document.querySelector('.choices-container').classList.remove('disabled');
        
        // 清除回溯标记
        gameState.lastRevertedNodeId = null;
        
        // 更新进度条
        updateChapterProgress();
    }).catch(error => {
        console.error('生成下一段剧情失败:', error);
        // 恢复UI状态
        document.getElementById('loadingIndicator').classList.add('hidden');
        document.querySelector('.choices-container').classList.remove('disabled');
        // 使用简单生成作为备选方案
        generateNextContent(currentChoice).then(simpleContent => {
            simpleContent.chapter = calculateNextChapter(currentStoryNode);
            simpleContent.scene = calculateNextScene(currentStoryNode);
            updateStoryWithNewContent(simpleContent);
            updateChapterProgress();
        });
    });
    
    console.log("选择后已探索节点:", Array.from(gameState.exploredNodes));
}

// 修改计算下一章节的函数，根据复杂度决定章节转换
function calculateNextChapter(currentNode) {
    // 获取当前游戏复杂度
    const complexity = gameState.settings.complexity || 'medium';
    
    // 根据复杂度确定每章幕数
    const scenesPerChapter = getSceneCountByComplexity(complexity);
    console.log(`当前复杂度: ${complexity}, 每章幕数: ${scenesPerChapter}`);
    console.log(currentNode.scene);
    console.log(currentNode.chapter);
    // 如果没有章节信息，返回第一章
    if (!currentNode.chapter) return 1;
    
    // 如果当前场景达到或超过了复杂度对应的幕数，则进入下一章
    if (currentNode.scene >= scenesPerChapter) {
        return currentNode.chapter + 1;
    }
    
    // 否则保持当前章节
    return currentNode.chapter;
}

// 新增：根据复杂度获取每章幕数
function getSceneCountByComplexity(complexity) {
    switch(complexity) {
        case 'simple':
            return 2; // 简单模式，每章2幕
        case 'complex':
            return 4; // 复杂模式，每章4幕
        case 'medium':
        default:
            return 3; // 中等模式，每章3幕（默认）
    }
}


// 修改通过API生成下一段剧情内容的函数，确保传递所有必要参数
async function generateNextContentFromAPI(choice) {
    try {
        // 收集游戏数据
        const gameData = collectGameData();
        
        // 获取当前复杂度和每章幕数
        const complexity = gameState.settings.complexity || 'medium';
        const scenesPerChapter = getSceneCountByComplexity(complexity);
        const chapterCount = gameState.settings.chapterCount || 5;
        
        // 计算下一幕和下一章
        let nextChapter = calculateNextChapter(currentStoryNode);
        let nextScene = calculateNextScene(currentStoryNode);
        // let nextChapter = currentStoryNode.chapter || 1;
        // let nextScene = (currentStoryNode.scene || 1);
        console.log(currentStoryNode);
        console.log(currentStoryNode.scene);
        console.log(`当前章节: ${nextChapter}, 当前场景: ${nextScene}, 每章幕数: ${scenesPerChapter}`);

        // 检查是否需要进入下一章
        let isChapterFinale = false;
        if (nextScene > scenesPerChapter) {
            nextChapter++;
            nextScene = 1;
        } else if (nextScene === scenesPerChapter) {
            isChapterFinale = true;
        }
        
        // 构建请求数据，确保包含所有必要参数
        const requestData = {
            background: gameData.background || "",
            timeline: gameData.timeline || [],
            locations: gameData.locations || [],
            characters: gameData.characters || [],
            complexity: complexity,
            chapterCount: chapterCount,
            chapterNumber: nextChapter,
            sceneNumber: nextScene,
            scenesPerChapter: scenesPerChapter,
            outline: gameState.storyOutline || "",
            currentContent: currentStoryNode.content || "",
            selectedChoice: {
                text: choice.text || "",
                effect: choice.effect || "",
                nextContent: choice.nextContent || ""
            },
            isChapterFinale: isChapterFinale
        };
        
        console.log("发送到API的请求数据:", {
            complexity: requestData.complexity,
            chapterNumber: requestData.chapterNumber,
            sceneNumber: requestData.sceneNumber,
            chapterCount: requestData.chapterCount,
            scenesPerChapter: requestData.scenesPerChapter
        });
        
        // 调用API生成下一段剧情
        const response = await fetch('/api/generate-next-scene', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestData)
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`API响应错误: ${response.status}, ${errorText}`);
        }
        
        // 解析API响应
        const data = await response.json();
        
        // 返回处理后的内容
        const nextStoryNode={
            id: 'node-' + Date.now(),
            title: data.title || `第${requestData.chapterNumber}章 场景${requestData.sceneNumber}`,
            content: data.content,
            choices: data.choices || generateSpecificChoices(data.content, extractKeywords(data.content)),
            parentId: currentStoryNode.id,
            chapter: nextChapter,
            scene: nextScene
        };
        console.log("生成的下一段剧情:", nextStoryNode);
        currentStoryNode=nextStoryNode;
        return nextStoryNode;
    } catch (error) {
        console.error('通过API生成下一段剧情失败:', error);
        throw error;
    }
}

// 修改计算下一场景的函数
function calculateNextScene(currentNode) {
    // 获取当前复杂度对应的每章幕数
    const complexity = gameState.settings.complexity || 'medium';
    const scenesPerChapter = getSceneCountByComplexity(complexity);
    
    // 如果当前节点没有场景信息，返回第一幕
    if (!currentNode.scene) return 1;
    
    // 如果当前场景达到了复杂度对应的幕数，重置为第一幕（新章节）
    if (currentNode.scene >= scenesPerChapter) {
        return 1; // 新章节，场景重置为1
    }
    
    // 否则场景号+1，继续当前章节的下一幕
    return currentNode.scene + 1; 
}

// 添加使用现有节点更新故事的函数
function updateStoryWithExistingNode(node) {
    // 记住当前节点ID作为父节点ID
    const parentNodeId = currentStoryNode.id;
    console.log(99999999999);
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
    // const parentNodeId = currentStoryNode.id;
    
    // // 生成新节点ID (如果没有的话)
    // if (!newContent.id) {
    //     newContent.id = 'node-' + Date.now();
    // }
    
    // // 更新当前节点
    // currentStoryNode = {
    //     id: newContent.id,
    //     title: newContent.title,
    //     content: newContent.content,
    //     choices: newContent.choices,
    //     parentId: parentNodeId  // 重要：记录父节点关系
    
    // };

    const parentNodeId = currentStoryNode.parentId;
    console.log("更新后的当前节点:", currentStoryNode);

    // 缓存新节点数据 - 新增这一行
    cacheNodeData(currentStoryNode);

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
    document.getElementById('storyImage').src = `test.png`;
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

// 修改updateStoryInfoContent函数，确保内容保存和恢复
function updateStoryInfoContent() {
    // 从gameState或localStorage恢复内容
    const gameSettings = JSON.parse(localStorage.getItem('gameSettings')) || {};
    
    // 更新世界观设定 - 优先使用gameState中的内容，若没有则尝试从localStorage恢复
    const worldBackgroundElement = document.getElementById('worldBackground');
    let worldBackgroundContent = gameState.storyBackground;
    
    // 如果gameState中没有，尝试从localStorage获取
    if (!worldBackgroundContent && gameSettings.generatedBackground) {
        worldBackgroundContent = gameSettings.generatedBackground;
        // 同时更新gameState
        gameState.storyBackground = worldBackgroundContent;
    }
    
    worldBackgroundElement.textContent = worldBackgroundContent || '点击"AI生成故事背景"按钮生成世界观设定';

    // 添加AI生成按钮
    const container = document.querySelector('#storyInfoModal .modal-content');
    
    // 检查是否已经添加过按钮
    if (!container.querySelector('.generate-background-btn')) {
        const generateButton = document.createElement('button');
        generateButton.className = 'generate-background-btn';
        generateButton.innerHTML = '<i class="fas fa-magic"></i> AI生成故事背景';
        generateButton.style.backgroundColor = '#4CAF50';
        generateButton.style.color = 'white';
        generateButton.style.border = 'none';
        generateButton.style.borderRadius = '4px';
        generateButton.style.padding = '10px 15px';
        generateButton.style.margin = '10px 0';
        generateButton.style.cursor = 'pointer';
        
        // 将按钮插入到内容之前
        container.insertBefore(generateButton, container.firstChild);
        
        // 添加按钮点击事件
        generateButton.addEventListener('click', () => {
            generateBackgroundContent();
        });
    }

    // 更新时间线 - 优先使用gameState中的内容，若没有则尝试从localStorage恢复
    const timeline = document.getElementById('storyTimeline');
    let timelineEvents = gameState.timeline;
    
    // 如果gameState中没有，尝试从localStorage获取
    if ((!timelineEvents || timelineEvents.length === 0) && gameSettings.generatedTimeline) {
        timelineEvents = gameSettings.generatedTimeline;
        // 同时更新gameState
        gameState.timeline = timelineEvents;
    }
    
    // 如果仍然没有时间线事件，使用历史记录或默认内容
    if (!timelineEvents || timelineEvents.length === 0) {
        timeline.innerHTML = gameState.history.length > 0 ? 
            gameState.history.map(event => `
                <div class="timeline-event">
                    <h4>${event.title}</h4>
                    <p>${event.content}</p>
                </div>
            `).join('') : 
            '<div class="timeline-event"><h4>暂无前情提要</h4><p>生成世界观设定后将显示故事的前情提要</p></div>';
    } else {
        timeline.innerHTML = timelineEvents.map(event => `
            <div class="timeline-event">
                <h4>${event.title || '事件'}</h4>
                <p>${event.content || '事件描述'}</p>
            </div>
        `).join('');
    }

    // 更新重要地点 - 优先使用gameState中的内容，若没有则尝试从localStorage恢复
    const locations = document.getElementById('importantLocations');
    let locationsList = gameState.locations;
    
    // 如果gameState中没有，尝试从localStorage获取
    if ((!locationsList || locationsList.length === 0) && gameSettings.generatedLocations) {
        locationsList = gameSettings.generatedLocations;
        // 同时更新gameState
        gameState.locations = locationsList;
    }
    
    // 如果仍然没有地点列表，使用默认内容
    if (!locationsList || locationsList.length === 0) {
        locations.innerHTML = '<div class="location-card"><h4>暂无重要地点</h4><p>生成世界观设定后将显示故事中的重要地点</p></div>';
    } else {
        locations.innerHTML = locationsList.map(location => `
            <div class="location-card">
                <h4>${location.name || '地点'}</h4>
                <p>${location.description || '地点描述'}</p>
            </div>
        `).join('');
    }
}


// 更新角色设定内容
function updateCharacterInfoContent() {
    const characterGrid = document.getElementById('characterGrid');
    
    // 添加AI生成按钮
    const container = document.querySelector('#characterInfoModal .modal-content');
    
    // 检查是否已经添加过按钮
    if (!container.querySelector('.generate-characters-btn')) {
        const generateButton = document.createElement('button');
        generateButton.className = 'generate-characters-btn';
        generateButton.innerHTML = '<i class="fas fa-magic"></i> AI生成角色详情';
        generateButton.style.backgroundColor = '#4CAF50';
        generateButton.style.color = 'white';
        generateButton.style.border = 'none';
        generateButton.style.borderRadius = '4px';
        generateButton.style.padding = '10px 15px';
        generateButton.style.margin = '10px 0';
        generateButton.style.cursor = 'pointer';
        
        // 将按钮插入到内容之前
        container.insertBefore(generateButton, container.firstChild);
        
        // 添加按钮点击事件
        generateButton.addEventListener('click', () => {
            generateCharactersContent();
        });
    }
    
    characterGrid.innerHTML = gameState.characters.map(char => `
        <div class="character-info-card">
            <img class="character-info-image" src="test.png" alt="${char.name}">
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

// 添加生成背景和角色内容的函数

// 修改生成背景内容的函数 - 使用当前存档
async function generateBackgroundContent() {
    const worldBackground = document.getElementById('worldBackground');
    const timeline = document.getElementById('storyTimeline');
    const locations = document.getElementById('importantLocations');
    
    // 保存原始内容
    const originalBackground = worldBackground.textContent;
    const originalTimeline = timeline.innerHTML;
    const originalLocations = locations.innerHTML;
    
    // 创建流式显示容器
    const streamContainer = document.createElement('div');
    streamContainer.className = 'stream-container';
    streamContainer.style.position = 'relative';
    streamContainer.style.backgroundColor = '#f9f9f9';
    streamContainer.style.border = '1px solid #ddd';
    streamContainer.style.borderRadius = '5px';
    streamContainer.style.padding = '15px';
    streamContainer.style.margin = '10px 0';
    streamContainer.style.maxHeight = '300px';
    streamContainer.style.overflowY = 'auto';
    
    // 添加取消按钮
    const cancelBtn = document.createElement('button');
    cancelBtn.textContent = '取消生成';
    cancelBtn.style.position = 'absolute';
    cancelBtn.style.right = '10px';
    cancelBtn.style.top = '10px';
    cancelBtn.style.backgroundColor = '#ff4d4f';
    cancelBtn.style.color = 'white';
    cancelBtn.style.border = 'none';
    cancelBtn.style.borderRadius = '4px';
    cancelBtn.style.padding = '5px 10px';
    cancelBtn.style.cursor = 'pointer';
    streamContainer.appendChild(cancelBtn);
    
    // 添加内容区域
    const streamContent = document.createElement('div');
    streamContent.className = 'stream-content';
    streamContent.textContent = '正在生成世界背景和设定...';
    streamContainer.appendChild(streamContent);
    
    // 替换原始内容区域
    worldBackground.style.display = 'none';
    worldBackground.parentNode.insertBefore(streamContainer, worldBackground.nextSibling);
    
    // 隐藏其他区域，显示加载中提示
    const loadingTimeline = document.createElement('div');
    loadingTimeline.className = 'loading-text';
    loadingTimeline.textContent = '生成前情提要中...';
    loadingTimeline.style.padding = '10px';
    loadingTimeline.style.textAlign = 'center';
    loadingTimeline.style.color = '#666';
    
    const loadingLocations = document.createElement('div');
    loadingLocations.className = 'loading-text';
    loadingLocations.textContent = '生成重要地点中...';
    loadingLocations.style.padding = '10px';
    loadingLocations.style.textAlign = 'center';
    loadingLocations.style.color = '#666';
    
    timeline.style.display = 'none';
    locations.style.display = 'none';
    timeline.parentNode.insertBefore(loadingTimeline, timeline);
    locations.parentNode.insertBefore(loadingLocations, locations);
    
    // 获取当前存档键
    const urlParams = new URLSearchParams(window.location.search);
    const archiveKey = urlParams.get('archive') || localStorage.getItem('gameSettings_current');
    
    // 从当前存档获取游戏设置
    let gameSettings;
    try {
        // 优先使用当前存档中的设定
        if (archiveKey) {
            gameSettings = JSON.parse(localStorage.getItem(archiveKey)) || {};
            console.log('从当前存档加载设定:', archiveKey);
        } else {
            // 如果没有当前存档，则使用默认设置
            gameSettings = JSON.parse(localStorage.getItem('gameSettings')) || {};
            console.log('使用默认设定');
        }
    } catch (e) {
        gameSettings = {};
        console.error('解析游戏设置失败:', e);
    }
    
    // 准备请求数据
    const requestData = {
        background: gameSettings.background || currentStoryNode.content || '一个神秘的世界',
        complexity: gameSettings.complexity || 'medium',
        chapterCount: gameSettings.chapterCount || 5,
        generateComplete: true, // 标记需要生成完整设定
        worldBuildingOnly: true  // 仅生成世界观
    };
    
    // 创建AbortController用于取消请求
    const controller = new AbortController();
    const signal = controller.signal;
    
    // 取消按钮事件
    cancelBtn.addEventListener('click', () => {
        controller.abort();
        streamContainer.remove();
        worldBackground.style.display = '';
        timeline.style.display = '';
        locations.style.display = '';
        loadingTimeline.remove();
        loadingLocations.remove();
    });
    
    try {
        // 调用API
        const response = await fetch('/api/generate-background', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestData),
            signal: signal
        });
        
        if (!response.body) {
            throw new Error('ReadableStream not supported in this browser.');
        }
        
        // 处理流式响应
        const reader = response.body.getReader();
        const decoder = new TextDecoder('utf-8');
        let buffer = '';
        
        // 存储不同部分的生成内容
        let backgroundContent = '';
        let timelineEvents = [];
        let locationsList = [];
        let currentSection = 'background'; // 初始部分是背景
        
        while (true) {
            const { done, value } = await reader.read();
            
            if (done) {
                break;
            }
            
            // 解码收到的数据
            const chunk = decoder.decode(value, { stream: true });
            buffer += chunk;
            
            // 处理缓冲区中的完整行
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';
            
            for (const line of lines) {
                if (line.trim() === '') continue;
                
                if (line.startsWith('data: ')) {
                    try {
                        const data = JSON.parse(line.substring(6));
                        
                        // 处理不同部分的标记
                        if (data.section) {
                            currentSection = data.section;
                            continue;
                        }
                        
                        if (data.text) {
                            // 根据当前处理的部分添加内容
                            switch (currentSection) {
                                case 'background':
                                    // 直接添加内容，不限制字数
                                    backgroundContent += data.text;
                                    streamContent.textContent = backgroundContent;
                                    break;
                                    
                                case 'timeline':
                                    // 处理前情提要
                                    if (typeof data.text === 'string') {
                                        if (data.text.includes('标题:') || data.text.includes('title:')) {
                                            // 这是一个新事件的开始
                                            const titleMatch = data.text.match(/(?:标题:|title:)\s*(.*?)(?:\n|$)/i);
                                            const contentMatch = data.text.match(/(?:内容:|content:)\s*(.*?)(?:\n|$)/i);
                                            
                                            if (titleMatch || contentMatch) {
                                                timelineEvents.push({
                                                    title: titleMatch ? titleMatch[1].trim() : '事件',
                                                    content: contentMatch ? contentMatch[1].trim() : data.text
                                                });
                                            }
                                        } else if (timelineEvents.length > 0) {
                                            // 添加到最后一个事件
                                            timelineEvents[timelineEvents.length - 1].content += ' ' + data.text;
                                        } else {
                                            // 创建新事件
                                            timelineEvents.push({
                                                title: '事件',
                                                content: data.text
                                            });
                                        }
                                    }
                                    loadingTimeline.textContent = `已生成 ${timelineEvents.length} 个事件...`;
                                    break;
                                    
                                case 'locations':
                                    // 处理地点
                                    if (typeof data.text === 'string') {
                                        if (data.text.includes('名称:') || data.text.includes('name:')) {
                                            // 这是一个新地点的开始
                                            const nameMatch = data.text.match(/(?:名称:|name:)\s*(.*?)(?:\n|$)/i);
                                            const descMatch = data.text.match(/(?:描述:|description:)\s*(.*?)(?:\n|$)/i);
                                            
                                            if (nameMatch || descMatch) {
                                                locationsList.push({
                                                    name: nameMatch ? nameMatch[1].trim() : '地点',
                                                    description: descMatch ? descMatch[1].trim() : data.text
                                                });
                                            }
                                        } else if (locationsList.length > 0) {
                                            // 添加到最后一个地点的描述
                                            locationsList[locationsList.length - 1].description += ' ' + data.text;
                                        } else {
                                            // 创建新地点
                                            locationsList.push({
                                                name: '地点',
                                                description: data.text
                                            });
                                        }
                                    }
                                    loadingLocations.textContent = `已生成 ${locationsList.length} 个地点...`;
                                    break;
                            }
                            
                            // 自动滚动到底部
                            streamContainer.scrollTop = streamContainer.scrollHeight;
                        }
                    } catch (e) {
                        console.error('解析流数据失败:', e);
                    }
                }
            }
        }
        
        // 显示完整内容
        const worldBuildingContent = extractWorldBuilding(backgroundContent);
        worldBackground.textContent = worldBuildingContent;
        worldBackground.style.display = '';
        streamContainer.remove();
        
        // 更新游戏状态
        gameState.storyBackground = worldBuildingContent;
        
        // 提取或生成时间线事件
        if (timelineEvents.length === 0) {
            // 如果没有生成时间线事件，尝试从背景中提取关键事件
            timelineEvents = extractTimelineFromBackground(backgroundContent);
        }
        
        // 提取或生成地点列表
        if (locationsList.length === 0) {
            // 如果没有生成地点列表，尝试从背景中提取地点
            locationsList = extractLocationsFromBackground(backgroundContent);
        }
        
        // 更新时间线和地点
        timeline.innerHTML = timelineEvents.map(event => `
            <div class="timeline-event">
                <h4>${event.title}</h4>
                <p>${event.content}</p>
            </div>
        `).join('');
        
        locations.innerHTML = locationsList.map(location => `
            <div class="location-card">
                <h4>${location.name}</h4>
                <p>${location.description}</p>
            </div>
        `).join('');
        
        // 显示时间线和地点
        timeline.style.display = '';
        locations.style.display = '';
        loadingTimeline.remove();
        loadingLocations.remove();
        
        // 保存生成的内容到游戏状态
        gameState.storyBackground = worldBuildingContent;
        gameState.timeline = timelineEvents;
        gameState.locations = locationsList;
        
        // 保存到当前存档，确保关闭后再次打开时能恢复
        if (archiveKey) {
            try {
                const currentArchive = JSON.parse(localStorage.getItem(archiveKey)) || {};
                currentArchive.background = worldBuildingContent;
                currentArchive.generatedBackground = backgroundContent;
                currentArchive.generatedTimeline = timelineEvents;
                currentArchive.generatedLocations = locationsList;
                localStorage.setItem(archiveKey, JSON.stringify(currentArchive));
                console.log('已将世界观设定保存到当前存档:', archiveKey);
            } catch (e) {
                console.error('保存生成内容到存档失败:', e);
            }
        } else {
            // 如果没有当前存档，保存到默认设置
            try {
                const settingsToSave = JSON.parse(localStorage.getItem('gameSettings')) || {};
                settingsToSave.generatedBackground = backgroundContent;
                settingsToSave.generatedTimeline = timelineEvents;
                settingsToSave.generatedLocations = locationsList;
                localStorage.setItem('gameSettings', JSON.stringify(settingsToSave));
                console.log('已将世界观设定保存到默认设置');
            } catch (e) {
                console.error('保存生成内容到localStorage失败:', e);
            }
        }
        
    } catch (error) {
        if (error.name === 'AbortError') {
            console.log('生成已取消');
        } else {
            console.error('生成背景失败:', error);
            streamContent.textContent = '生成失败，请重试';
            
            // 3秒后恢复原始内容
            setTimeout(() => {
                worldBackground.style.display = '';
                streamContainer.remove();
                timeline.style.display = '';
                locations.style.display = '';
                loadingTimeline.remove();
                loadingLocations.remove();
            }, 3000);
        }
    }
}

// 修改从背景中提取时间线的函数，匹配前情提要格式
function extractTimelineFromBackground(backgroundText) {
    // 尝试匹配格式: 前情提要：内容...（直到下一个标题/名称/重要地点）
    const timelineRegex = /前情提要[:：]\s*(.*?)(?=(?:前情提要[:：]|标题[:：]|名称[:：]|重要地点[:：]|$))/gs;
    let timelineEvents = [];
    let match;
    
    // 提取前情提要
    while ((match = timelineRegex.exec(backgroundText)) !== null) {
        if (match[1] && match[1].trim()) {
            // 尝试从提取的内容中找出标题和描述
            const titleMatch = match[1].match(/标题[:：]\s*(.*?)(?:\n|$)/i);
            const contentMatch = match[1].match(/(?:内容|描述)[:：]\s*(.*?)(?:\n|$)/is);
            
            if (titleMatch && contentMatch) {
                timelineEvents.push({
                    title: titleMatch[1].trim(),
                    content: contentMatch[1].trim()
                });
            } else {
                // 如果没有明确的标题和内容格式，则尝试按句子或段落划分
                const content = match[1].trim();
                const sentences = content.split(/[.。!！?？]/);
                
                if (sentences.length > 1) {
                    timelineEvents.push({
                        title: sentences[0].trim(),
                        content: content
                    });
                } else {
                    timelineEvents.push({
                        title: "历史事件",
                        content: content
                    });
                }
            }
        }
    }
    
    // 尝试匹配标准格式: 标题：xxx 内容：xxx
    if (timelineEvents.length === 0) {
        const titleContentRegex = /标题[:：]\s*(.*?)[\s\n]*内容[:：]\s*(.*?)(?=(?:标题[:：]|名称[:：]|重要地点[:：]|$))/gs;
        
        while ((match = titleContentRegex.exec(backgroundText)) !== null) {
            if (match[1] && match[2]) {
                timelineEvents.push({
                    title: match[1].trim(),
                    content: match[2].trim()
                });
            }
        }
    }
    
    return timelineEvents;
}
// 提取世界观内容
function extractWorldBuilding(backgroundText) {
    // 查找第一个"前情提要："或"标题："出现的位置
    const timelineIndex = backgroundText.search(/前情提要[：:]/i);
    const titleIndex = backgroundText.search(/标题[：:]/i);
    
    // 确定世界观结束位置
    let endIndex;
    if (timelineIndex !== -1 && titleIndex !== -1) {
        // 如果两者都存在，取较早出现的位置
        endIndex = Math.min(timelineIndex, titleIndex);
    } else if (timelineIndex !== -1) {
        endIndex = timelineIndex;
    } else if (titleIndex !== -1) {
        endIndex = titleIndex;
    } else {
        // 如果都没找到，将整个文本作为世界观
        endIndex = backgroundText.length;
    }
    
    // 提取世界观内容
    if (endIndex > 0) {
        return backgroundText.substring(4, endIndex).trim();
    }
    
    return backgroundText; // 如果没有找到分隔符，返回整个文本
}

// 修改从背景中提取地点的函数，匹配重要地点格式
function extractLocationsFromBackground(backgroundText) {
    // 尝试匹配格式: 重要地点：内容...(直到下一个重要地点/前情提要/标题)
    const locationsRegex = /重要地点[:：]\s*(.*?)(?=(?:重要地点[:：]|前情提要[:：]|标题[:：]|$))/gs;
    let locationsList = [];
    let match;
    
    // 提取重要地点
    while ((match = locationsRegex.exec(backgroundText)) !== null) {
        if (match[1] && match[1].trim()) {
            // 尝试从提取的内容中找出名称和描述
            const nameMatch = match[1].match(/名称[:：]\s*(.*?)(?:\n|$)/i);
            const descMatch = match[1].match(/描述[:：]\s*(.*?)(?:\n|$)/is);
            
            if (nameMatch && descMatch) {
                locationsList.push({
                    name: nameMatch[1].trim(),
                    description: descMatch[1].trim()
                });
            } else {
                // 如果没有明确的名称和描述格式，则尝试按句子或段落划分
                const content = match[1].trim();
                const lines = content.split('\n');
                
                if (lines.length > 1) {
                    locationsList.push({
                        name: lines[0].trim(),
                        description: content.substring(lines[0].length).trim()
                    });
                } else {
                    locationsList.push({
                        name: "地点",
                        description: content
                    });
                }
            }
        }
    }
    
    // 尝试匹配标准格式: 名称：xxx 描述：xxx
    if (locationsList.length === 0) {
        const nameDescRegex = /名称[:：]\s*(.*?)[\s\n]*描述[:：]\s*(.*?)(?=(?:名称[:：]|前情提要[:：]|标题[:：]|$))/gs;
        
        while ((match = nameDescRegex.exec(backgroundText)) !== null) {
            if (match[1] && match[2]) {
                locationsList.push({
                    name: match[1].trim(),
                    description: match[2].trim()
                });
            }
        }
    }
    
    return locationsList;
}

// 生成角色内容 - 修改为使用当前存档
async function generateCharactersContent() {
    const characterGrid = document.getElementById('characterGrid');
    const originalContent = characterGrid.innerHTML;
    
    // 创建流式显示容器
    const streamContainer = document.createElement('div');
    streamContainer.className = 'stream-container';
    streamContainer.style.position = 'relative';
    streamContainer.style.backgroundColor = '#f9f9f9';
    streamContainer.style.border = '1px solid #ddd';
    streamContainer.style.borderRadius = '5px';
    streamContainer.style.padding = '15px';
    streamContainer.style.margin = '10px 0';
    streamContainer.style.maxHeight = '300px';
    streamContainer.style.overflowY = 'auto';
    
    // 添加取消按钮
    const cancelBtn = document.createElement('button');
    cancelBtn.textContent = '取消生成';
    cancelBtn.style.position = 'absolute';
    cancelBtn.style.right = '10px';
    cancelBtn.style.top = '10px';
    cancelBtn.style.backgroundColor = '#ff4d4f';
    cancelBtn.style.color = 'white';
    cancelBtn.style.border = 'none';
    cancelBtn.style.borderRadius = '4px';
    cancelBtn.style.padding = '5px 10px';
    cancelBtn.style.cursor = 'pointer';
    streamContainer.appendChild(cancelBtn);
    
    // 添加内容区域
    const streamContent = document.createElement('div');
    streamContent.className = 'stream-content';
    streamContent.textContent = '正在生成角色详情...';
    streamContainer.appendChild(streamContent);
    
    // 替换原始内容区域
    characterGrid.style.display = 'none';
    characterGrid.parentNode.insertBefore(streamContainer, characterGrid);
    
    // 获取当前存档键
    const urlParams = new URLSearchParams(window.location.search);
    const archiveKey = urlParams.get('archive') || localStorage.getItem('gameSettings_current');
    
    // 从当前存档获取游戏设置
    let gameSettings;
    try {
        // 优先使用当前存档中的设定
        if (archiveKey) {
            gameSettings = JSON.parse(localStorage.getItem(archiveKey)) || {};
            console.log('从当前存档加载设定:', archiveKey);
        } else {
            // 如果没有当前存档，则使用默认设置
            gameSettings = JSON.parse(localStorage.getItem('gameSettings')) || {};
            console.log('使用默认设定');
        }
    } catch (e) {
        gameSettings = {};
        console.error('解析游戏设置失败:', e);
    }
    
    // 准备请求数据
    const requestData = {
        background: gameSettings.background || currentStoryNode.content || '一个神秘的世界',
        complexity: gameSettings.complexity || 'medium',
        characterCount: gameState.characters.length || 3
    };
    
    // 创建AbortController用于取消请求
    const controller = new AbortController();
    const signal = controller.signal;
    
    // 取消按钮事件
    cancelBtn.addEventListener('click', () => {
        controller.abort();
        streamContainer.remove();
        characterGrid.style.display = '';
    });
    
    try {
        // 调用API获取角色
        const response = await fetch('/api/generate-characters', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestData),
            signal: signal
        });
        
        // 检查响应类型，是否为SSE流
        const contentType = response.headers.get('Content-Type');
        
        // 处理流式响应
        if (contentType && contentType.includes('text/event-stream')) {
            // 是流式响应，需要逐行处理
            console.log("收到角色生成的SSE流响应");
            
            if (!response.body) {
                throw new Error('浏览器不支持ReadableStream');
            }
            
            const reader = response.body.getReader();
            const decoder = new TextDecoder('utf-8');
            let completeCharactersData = '';
            let buffer = '';
            let characters = [];
            
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
                buffer = lines.pop() || '';
                
                for (const line of lines) {
                    if (line.trim() === '') continue;
                    
                    if (line.startsWith('data: ')) {
                        try {
                            const eventData = JSON.parse(line.substring(6));
                            
                            if (eventData.text) {
                                completeCharactersData += eventData.text;
                                streamContent.textContent = '接收角色数据中...\n' + completeCharactersData.substring(0, 200) + '...';
                            }
                            
                            // 如果有角色数据，则提取
                            if (eventData.characters) {
                                characters = eventData.characters;
                            }
                            
                            if (eventData.done) {
                                console.log("收到流结束标记");
                            }
                        } catch (parseError) {
                            console.warn("解析事件数据失败:", parseError, line);
                        }
                    }
                }
            }
            
            // 如果在流中获取到角色数据，直接使用
            if (characters.length === 0) {
                // 尝试从完整数据中提取角色
                try {
                    const jsonMatch = completeCharactersData.match(/\[\s*\{.*\}\s*\]/s);
                    if (jsonMatch) {
                        characters = JSON.parse(jsonMatch[0]);
                    } else {
                        throw new Error('无法从流数据中提取角色信息');
                    }
                } catch (extractError) {
                    console.error("提取角色信息失败:", extractError);
                    throw extractError;
                }
            }
        } else {
            // 不是流式响应，尝试直接解析JSON
            if (!response.ok) {
                throw new Error(`API请求失败: ${response.status}`);
            }
            
            const responseText = await response.text();
            let data;
            
            try {
                // 尝试处理可能包含"data:"前缀的响应
                if (responseText.startsWith('data: ')) {
                    const jsonData = responseText.substring(6);
                    data = JSON.parse(jsonData);
                } else {
                    data = JSON.parse(responseText);
                }
            } catch (parseError) {
                console.error("解析JSON失败:", parseError, responseText);
                throw parseError;
            }
            
            if (data && data.characters && Array.isArray(data.characters)) {
                characters = data.characters;
            } else {
                throw new Error('API未返回有效的角色数据');
            }
        }
        
        // 成功获取角色数据
        if (characters && characters.length > 0) {
            // 更新游戏状态中的角色
            gameState.characters = characters.map((char, index) => {
                // 保留现有角色的图片
                const existingImage = gameState.characters[index] ? gameState.characters[index].image : null;
                
                return {
                    name: char.name,
                    description: char.description,
                    image: existingImage || 'test.png',
                    traits: extractCharacterTraits(char.description)
                };
            });
            
            // 更新显示
            characterGrid.innerHTML = gameState.characters.map(char => `
                <div class="character-info-card">
                    <img class="character-info-image" src="${char.image}" alt="${char.name}">
                    <div class="character-info-details">
                        <h3>${char.name}</h3>
                        <p>${char.description}</p>
                        <div class="character-traits">
                            ${generateCharacterTraits(char)}
                        </div>
                    </div>
                </div>
            `).join('');
            
            // 显示角色网格
            characterGrid.style.display = '';
            streamContainer.remove();
            
            // 将角色保存到当前存档
            if (archiveKey) {
                try {
                    const currentArchive = JSON.parse(localStorage.getItem(archiveKey)) || {};
                    currentArchive.characters = gameState.characters;
                    localStorage.setItem(archiveKey, JSON.stringify(currentArchive));
                    console.log('已将角色保存到当前存档:', archiveKey);
                } catch (e) {
                    console.error('保存角色到存档失败:', e);
                }
            }
        } else {
            throw new Error('未收到有效的角色数据');
        }
    } catch (error) {
        if (error.name === 'AbortError') {
            console.log('生成已取消');
        } else {
            console.error('生成角色失败:', error);
            streamContent.textContent = '生成失败，请重试';
            
            // 3秒后恢复原始内容
            setTimeout(() => {
                characterGrid.style.display = '';
                streamContainer.remove();
            }, 3000);
        }
    }
}


// 从角色描述中提取特征标签
function extractCharacterTraits(description) {
    if (!description) return ["未知"];
    
    // 常见性格特质词汇
    const commonTraits = [
        "勇敢", "聪明", "谨慎", "冒险", "神秘", "忠诚", "叛逆", "乐观", 
        "悲观", "善良", "冷酷", "固执", "灵活", "敏感", "坚强", "脆弱",
        "自信", "怀疑", "专注", "粗心", "诚实", "狡猾", "大方", "吝啬",
        "高傲", "谦卑", "开朗", "内向", "理性", "感性", "领导", "追随"
    ];
    
    // 从描述中提取特质
    const foundTraits = [];
    for (const trait of commonTraits) {
        if (description.includes(trait)) {
            foundTraits.push(trait);
        }
    }
    
    // 如果没找到至少3个特质，添加一些通用特质
    if (foundTraits.length < 3) {
        const defaultTraits = ["神秘", "复杂", "多面性"];
        for (const trait of defaultTraits) {
            if (foundTraits.length < 3 && !foundTraits.includes(trait)) {
                foundTraits.push(trait);
            }
        }
    }
    
    // 最多返回5个特质
    return foundTraits.slice(0, 5);
}

// 生成角色特征标签HTML
function generateCharacterTraits(character) {
    // 如果角色对象中已有特征，则使用它们
    const traits = character.traits || extractCharacterTraits(character.description);
    
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

// 修复的 findExistingNodeData 函数
function findExistingNodeData(nodeId) {
    // 首先检查当前节点
    if (currentStoryNode && currentStoryNode.id === nodeId) {
        return currentStoryNode;
    }
    
    // 在游戏状态中查找
    if (gameState.storyTree && gameState.storyTree.length > 0) {
        const result = findNodeInTree(gameState.storyTree, nodeId);
        if (result) return result;
    }
    
    // 遍历本地保存的所有已知节点
    const knownNodes = window._gameNodeCache || {};
    if (knownNodes[nodeId]) {
        return knownNodes[nodeId];
    }
    
    // 最后尝试在初始内容中查找
    if (storyContent.opening.id === nodeId) {
        return storyContent.opening;
    }
    
    // 实在找不到，则返回null
    return null;
}

// 在生成新节点或加载节点时，确保将其缓存
function cacheNodeData(node) {
    if (!node || !node.id) return;
    
    // 确保缓存存在
    if (!window._gameNodeCache) {
        window._gameNodeCache = {};
    }
    
    // 将节点添加到缓存
    window._gameNodeCache[node.id] = { ...node };
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
    
    // 添加AI生成按钮
    let aiBtn = editModal.querySelector('.ai-generate-btn');
    if (!aiBtn) {
        aiBtn = document.createElement('button');
        aiBtn.className = 'ai-generate-btn';
        aiBtn.innerHTML = '<i class="fas fa-magic"></i> AI生成内容';
        aiBtn.style.marginRight = '10px';
        aiBtn.style.backgroundColor = '#6200ea';
        aiBtn.style.color = 'white';
        aiBtn.style.border = 'none';
        aiBtn.style.borderRadius = '4px';
        aiBtn.style.padding = '8px 12px';
        
        // 将按钮添加到模态框底部操作区域
        const modalFooter = editModal.querySelector('.modal-footer') || editModal.querySelector('.modal-actions');
        if (modalFooter) {
            modalFooter.insertBefore(aiBtn, saveBtn);
        }
    }
    
    // 获取父节点内容（如果有的话）
    let parentNodeContent = null;
    if (mode === 'add' && nodeId) {
        // 这是在添加子节点，nodeId是父节点
        const parentNode = findNodeInStoryTree(nodeId);
        if (parentNode) {
            parentNodeContent = parentNode.content;
        }
    }
    
    // AI生成按钮点击事件
    aiBtn.onclick = () => {
        generateNodeContentWithAI(parentNodeContent);
    };
    
    // 如果是编辑模式，填充现有内容
    if (mode === 'edit' && nodeId) {
        const node = findNodeInStoryTree(nodeId);
        if (node) {
            modalInput.value = `标题: ${node.title || ''}\n内容: ${node.content || ''}`;
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
    // 获取当前激活的存档键
    const urlParams = new URLSearchParams(window.location.search);
    const archiveKey = urlParams.get('archive') || localStorage.getItem('gameSettings_current');
    
    // 获取游戏设置
    let gameSettings;
    try {
        // 首先检查是否从设定页面跳转过来的新游戏
        const isNewGameFromSettings = sessionStorage.getItem('newGameFromSettings');
        
        if (isNewGameFromSettings === 'true') {
            // 如果是从设定页面开始的新游戏，优先使用gameSettings
            gameSettings = JSON.parse(localStorage.getItem('gameSettings')) || {};
            console.log('从设定页面加载游戏设置');
        }
        // 如果不是新游戏或找不到设定，则尝试从当前存档获取
        else if (archiveKey) {
            gameSettings = JSON.parse(localStorage.getItem(archiveKey)) || {};
            console.log('从当前存档加载设定:', archiveKey);
        } 
        // 最后才使用默认设置
        else {
            gameSettings = JSON.parse(localStorage.getItem('gameSettings')) || {};
            console.log('使用默认设定');
        }
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
        case 'simple':
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
    
    // 使用完毕后清除新游戏标记，以免影响后续操作
    sessionStorage.removeItem('newGameFromSettings');
}
// AI辅助生成节点内容
async function generateNodeContentWithAI(parentNodeContent = null) {
    try {
        // 获取当前激活的存档键
        const urlParams = new URLSearchParams(window.location.search);
        const archiveKey = urlParams.get('archive') || localStorage.getItem('gameSettings_current');
        
        // 从当前存档获取游戏设置，而不是默认的gameSettings
        let gameSettings;
        try {
            // 优先使用当前存档中的设定
            if (archiveKey) {
                gameSettings = JSON.parse(localStorage.getItem(archiveKey)) || {};
                console.log('从当前存档加载设定:', archiveKey);
            } else {
                // 如果没有当前存档，则使用默认设置
                gameSettings = JSON.parse(localStorage.getItem('gameSettings')) || {};
                console.log('使用默认设定');
            }
        } catch (e) {
            gameSettings = {};
            console.error('解析游戏设置失败:', e);
        }
        
        // 准备请求数据
        const requestData = {
            background: gameSettings.background || '',
            characters: gameSettings.characters || [],
            complexity: gameSettings.complexity || 'medium',
            previousContent: parentNodeContent
        };
        
        // 显示加载状态
        const modal = document.getElementById('editModal');
        const modalInput = document.getElementById('modalInput');
        const originalContent = modalInput.value;
        
        // 创建流式显示区域
        const streamContainer = document.createElement('div');
        streamContainer.className = 'stream-container';
        streamContainer.style.position = 'relative';
        streamContainer.style.maxHeight = '300px';
        streamContainer.style.overflowY = 'auto';
        streamContainer.style.border = '1px solid #ccc';
        streamContainer.style.padding = '10px';
        streamContainer.style.marginBottom = '15px';
        streamContainer.style.backgroundColor = '#f9f9f9';
        streamContainer.style.borderRadius = '5px';
        streamContainer.style.fontSize = '14px';
        
        // 添加取消按钮
        const cancelBtn = document.createElement('button');
        cancelBtn.textContent = '取消生成';
        cancelBtn.style.position = 'absolute';
        cancelBtn.style.right = '10px';
        cancelBtn.style.top = '10px';
        cancelBtn.style.backgroundColor = '#ff4d4f';
        cancelBtn.style.color = 'white';
        cancelBtn.style.border = 'none';
        cancelBtn.style.borderRadius = '4px';
        cancelBtn.style.padding = '5px 10px';
        streamContainer.appendChild(cancelBtn);
        
        // 添加流式内容区域
        const streamContent = document.createElement('div');
        streamContent.className = 'stream-content';
        streamContent.textContent = '正在通过AI生成内容，请稍候...';
        streamContainer.appendChild(streamContent);
        
        // 将流式显示区域添加到模态框中
        const modalContent = modal.querySelector('.modal-content');
        modalContent.insertBefore(streamContainer, modalInput);
        modalInput.style.display = 'none';
        
        // 创建EventSource进行流式接收
        const eventSource = new EventSource(`/api/generate-story-node?timestamp=${Date.now()}`);
        let generatedText = '';
        let controller = new AbortController();
        
        // 监听取消按钮
        cancelBtn.addEventListener('click', () => {
            eventSource.close();
            streamContainer.remove();
            modalInput.style.display = 'block';
            modalInput.value = originalContent;
            controller.abort();
        });
        
        // 获取生成内容
        fetch('/api/generate-story-node', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestData),
            signal: controller.signal
        }).then(response => {
            if (!response.body) {
                throw new Error('ReadableStream not supported in this browser.');
            }
            
            const reader = response.body.getReader();
            const decoder = new TextDecoder('utf-8');
            
            function readStream() {
                reader.read().then(({ done, value }) => {
                    if (done) {
                        streamContainer.remove();
                        modalInput.style.display = 'block';
                        
                        // 从生成的内容中提取标题
                        const title = extractTitleFromContent(generatedText);
                        
                        // 填充到编辑器中
                        modalInput.value = `标题: ${title}\n内容: ${generatedText}`;
                        return;
                    }
                    
                    // 处理接收到的数据
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
                    
                    readStream();
                }).catch(err => {
                    if (err.name !== 'AbortError') {
                        console.error('读取流失败:', err);
                        streamContent.textContent = '生成内容失败，请重试';
                    }
                });
            }
            
            readStream();
        }).catch(error => {
            if (error.name !== 'AbortError') {
                console.error('AI内容生成失败:', error);
                streamContent.textContent = '生成内容失败，请重试';
                
                // 3秒后恢复编辑器
                setTimeout(() => {
                    streamContainer.remove();
                    modalInput.style.display = 'block';
                    modalInput.value = originalContent;
                }, 3000);
            }
        });
        
    } catch (error) {
        console.error('AI内容生成失败:', error);
        alert('AI内容生成失败，请稍后重试');
    }
}

// 从生成的内容中提取标题
function extractTitleFromContent(content) {
    // 尝试从内容的第一句话或第一行提取标题
    const firstLine = content.split('\n')[0].trim();
    
    if (firstLine.length > 30) {
        // 如果第一行太长，只取前20个字符
        return firstLine.substring(0, 20) + '...';
    } else {
        return firstLine;
    }
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
// 开始游戏函数 - 生成故事大纲和第一章内容
async function startGame() {
    try {
        // 显示加载状态
        document.getElementById('startGameBtn').classList.add('hidden');
        document.getElementById('startGameLoading').classList.remove('hidden');
        
        // 获取游戏设置和世界观数据
        const gameData = collectGameData();
        
        // 更新加载状态文本
        updateLoadingText('正在生成故事大纲...');
        
        // 调用API生成故事大纲
        const outlineResponse = await generateStoryOutline(gameData);
        
        
        // 保存大纲到游戏状态
        gameState.storyOutline = outlineResponse.outline;
        
        const storytitle=await generateStoryTitle(gameState);

        // 保存标题到游戏状态
        gameState.title= storytitle.title;

        // 更新加载状态文本
        updateLoadingText('正在创作第一章内容...');
        
        // 生成第一章第一幕内容
        const chapterResponse = await generateFirstChapter(gameData, outlineResponse.outline);
        
        // 更新加载状态文本
        updateLoadingText('正在生成场景图像...');
        
        const beginid='node-' + Date.now();
        // 更新当前节点
        currentStoryNode = {
            id: beginid,
            title: chapterResponse.title,
            content: chapterResponse.content,
            choices: chapterResponse.choices,
            chapter: 1,
            scene: 1
        };
        
        updateStoryTreeStructure(null, currentStoryNode);
        
        // 缓存初始节点 - 新增这一行
        cacheNodeData(currentStoryNode);

        // 记录节点已被探索
        gameState.exploredNodes.add(currentStoryNode.id);
        gameState.currentPath.push(currentStoryNode.id);
        
        // 尝试生成图像
        try {
            await generateSceneImage(currentStoryNode.content);
        } catch (imageError) {
            console.warn('图像生成失败，使用默认图像', imageError);
            document.getElementById('storyImage').src = 'test.png';
        }
        
        // 隐藏开始游戏区域，显示故事内容
        document.querySelector('.start-game-area').classList.add('hidden');
        document.querySelector('.story-content').style.display = 'block';
        document.querySelector('.choices-container').style.display = 'block';
        document.querySelector('.story-image-container').style.display = 'block';
        
        // 更新故事显示
        updateStoryDisplay(currentStoryNode);
        updateChoices(currentStoryNode.choices);
        updateSidePanelStoryTree();
        updateChapterProgress();
        
    } catch (error) {
        console.error('游戏启动失败:', error);
        // 显示错误信息
        document.getElementById('loadingProgressText').innerHTML = 
            `<span style="color: red">启动失败: ${error.message || '请稍后重试'}</span>`;
        
        // 恢复开始按钮
        setTimeout(() => {
            document.getElementById('startGameBtn').classList.remove('hidden');
            document.getElementById('startGameLoading').classList.add('hidden');
        }, 2000);
    }
}

// 生成故事大纲
async function generateStoryOutline(gameData) {
    // 请求后台API生成大纲
    const response = await fetch('/api/generate-story-outline', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            background: gameData.background,
            timeline: gameData.timeline,
            locations: gameData.locations,
            characters: gameData.characters,
            chapterCount: gameData.chapterCount,
            complexity: gameData.complexity
        })
    });
    
    if (!response.ok) {
        throw new Error('大纲生成失败');
    }
    
    return await response.json();
}


// 生成小说标题
async function generateStoryTitle(gameState) {
    console.log(gameState)
    // 请求后台API生成大纲
    const response = await fetch('/api/generate-story-title', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            outline: gameState.storyOutline, // 从游戏状态中提取完整大纲
        })
    });
    
    if (!response.ok) {
        throw new Error('标题生成失败');
    }
    
    return await response.json();
}


// 生成第一章内容
async function generateFirstChapter(gameData, outline) {
    // 请求后台API生成第一章内容
    const response = await fetch('/api/generate-chapter', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            background: gameData.background,
            timeline: gameData.timeline,
            locations: gameData.locations,
            characters: gameData.characters,
            complexity: gameData.complexity,
            chapterNumber: 1,
            sceneNumber: 1,
            outline: outline
        })
    });
    
    if (!response.ok) {
        throw new Error('章节内容生成失败');
    }
    
    return await response.json();
}

// 生成场景图片
async function generateSceneImage(sceneContent) {
    // 提取场景描述关键词
    const description = extractSceneDescription(sceneContent);
    
    // 请求图像生成
    const response = await fetch('/api/generate-image', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            description: description,
            style: gameState.imageSettings.lastStyle || 'realistic',
            colorTone: gameState.imageSettings.lastColorTone || 'warm'
        })
    });
    
    if (!response.ok) {
        throw new Error('图像生成失败');
    }
    
    const data = await response.json();
    
    // 更新图像显示
    document.getElementById('storyImage').src = data.imageUrl;
}

// 从场景内容提取适合图像生成的描述
function extractSceneDescription(sceneContent) {
    // 简单实现：取前100个字符作为描述
    let description = sceneContent.substring(0, 100);
    
    // 尝试找到描述场景的句子
    const sceneSentencePatterns = [
        /(.{10,100}[^.。!！?？]+场景[^.。!！?？]+[.。!！?？])/,
        /(.{10,100}[^.。!！?？]+环境[^.。!！?？]+[.。!！?？])/,
        /(.{10,100}[^.。!！?？]+地点[^.。!！?？]+[.。!！?？])/,
        /(.{10,100}[^.。!！?？]+看到[^.。!！?？]+[.。!！?？])/
    ];
    
    for (const pattern of sceneSentencePatterns) {
        const match = sceneContent.match(pattern);
        if (match && match[1]) {
            description = match[1];
            break;
        }
    }
    
    return description;
}

// 收集游戏数据函数
function collectGameData() {
    // 获取当前激活的存档键
    const urlParams = new URLSearchParams(window.location.search);
    const archiveKey = urlParams.get('archive') || localStorage.getItem('gameSettings_current');
    
    // 收集游戏设置数据
    let gameSettings;
    try {
        const isNewGameFromSettings = sessionStorage.getItem('newGameFromSettings');
        
        if (isNewGameFromSettings === 'true') {
            // 如果是从设定页面开始的新游戏
            gameSettings = JSON.parse(localStorage.getItem('gameSettings')) || {};
        } else if (archiveKey) {
            // 如果从存档开始
            gameSettings = JSON.parse(localStorage.getItem(archiveKey)) || {};
        } else {
            // 使用默认设置
            gameSettings = JSON.parse(localStorage.getItem('gameSettings')) || {};
        }
    } catch (e) {
        console.error('解析游戏设置失败:', e);
        gameSettings = {};
    }
    
    // 构建返回数据
    return {
        background: gameState.storyBackground || gameSettings.background || '',
        timeline: gameState.timeline || gameSettings.generatedTimeline || [],
        locations: gameState.locations || gameSettings.generatedLocations || [],
        characters: gameState.characters || gameSettings.characters || [],
        chapterCount: gameSettings.chapterCount || 5,
        complexity: gameSettings.complexity || 'medium'
    };
}

// 更新加载文本
function updateLoadingText(text) {
    const loadingText = document.getElementById('loadingProgressText');
    if (loadingText) {
        loadingText.textContent = text;
    }
}

// 修改保存游戏状态的函数，改进日期格式化逻辑
function saveGameToArchive(archiveKey = null) {
    // 获取当前节点标题作为存档名称基础
    let titleBase = "无标题存档";
    if (currentStoryNode && currentStoryNode.title) {
        // 从标题中提取章节信息
        const chapterMatch = currentStoryNode.title.match(/第(\d+)章/);
        if (chapterMatch) {
            titleBase = `第${chapterMatch[1]}章`;
        } else {
            // 如果没有章节信息，使用标题前10个字符
            titleBase = currentStoryNode.title.substring(0, 10);
        }
    }
    
    // 生成格式化日期时间字符串，确保格式有效
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    
    // 格式化为 YYYY/MM/DD HH:MM:SS
    const dateTimeStr = `${year}/${month}/${day} ${hours}:${minutes}:${seconds}`;
    
    // 生成存档键，格式：archive_标题_YYYYMMDDHHMMSS
    // if (!archiveKey) {
    //     // const timeForKey = `${year}${month}${day}${hours}${minutes}${seconds}`;
    //     // archiveKey = `archive_${titleBase}_${timeForKey}`;
    //     // // 替换可能导致问题的字符
    //     // archiveKey = archiveKey.replace(/[\/\\:*?"<>|]/g, '_');
    //     archiveKey = 'gameSettings_' + Date.now();
    // }
    const newkey='gameSettings_' + Date.now();
    if (!archiveKey) {
        archiveKey = localStorage.getItem('gameSettings_current');
        // const newkey='gameSettings_' + Date.now();
        console.log('当前存档键:', archiveKey);
        // // 如果没有当前存档，则使用时间戳创建一个新存档
        // if (!archiveKey) {
        //     archiveKey = 'gameSettings_' + Date.now();
        // }
    }
    console.log(dateTimeStr)
    // 创建分类的存档数据结构
    const archiveData = {
        // 基本信息
        meta: {
            timestamp: now.getTime(),
            saveDate: dateTimeStr,  // 使用格式化后的日期时间
            saveTitle: `${titleBase} - ${dateTimeStr}`,  // 同样使用格式化后的日期时间
            complexity: gameState.settings.complexity,
            chapterCount: gameState.settings.chapterCount,
            currentChapter: gameState.currentChapter,
            gameCompleted: gameState.gameCompleted || false,
            version: '1.0'
        },
        // 世界观背景数据
        background: gameState.storyBackground || "",
        generatedBackground: gameState.generatedBackground || "",
        generatedTimeline: gameState.timeline || [],
        generatedLocations: gameState.locations || [],
        
        // 角色数据
        characters: gameState.characters || [],
        title: gameState.title || "无标题",
        // 故事大纲
        storyOutline: gameState.storyOutline || "",
        
        // 游戏进度数据
        gameProgress: {
            currentNodeId: currentStoryNode ? currentStoryNode.id : null,
            exploredNodes: Array.from(gameState.exploredNodes || new Set()),
            currentPath: gameState.currentPath || [],
            history: gameState.history || []
        },
        
        // 故事节点数据
        storyNodes: {}
    };
    console.log('存档数据:', archiveData);
    // 收集所有已探索节点的完整数据
    if (gameState.exploredNodes && gameState.exploredNodes.size > 0) {
        console.log('已探索节点:', Array.from(gameState.exploredNodes));
        
        // 获取节点缓存
        const nodeCache = window._gameNodeCache || {};
        
        Array.from(gameState.exploredNodes).forEach(nodeId => {
            // 首先检查当前节点
            let nodeData = null;
            
            if (currentStoryNode && currentStoryNode.id === nodeId) {
                nodeData = currentStoryNode;
            }
            // 然后检查缓存
            else if (nodeCache[nodeId]) {
                nodeData = nodeCache[nodeId];
            }
            // 最后尝试使用findExistingNodeData
            else {
                nodeData = findExistingNodeData(nodeId);
            }
            
            if (nodeData) {
                // 存储节点的完整数据
                archiveData.storyNodes[nodeId] = {
                    id: nodeData.id,
                    title: nodeData.title,
                    content: nodeData.content,
                    choices: nodeData.choices || [],
                    parentId: nodeData.parentId,
                    chapter: nodeData.chapter || 1,
                    scene: nodeData.scene || 1
                };
            } else {
                console.warn('无法找到节点数据:', nodeId);
            }
        });
    }
    console.log('存档数据已准备:', archiveData.storyNodes);
    // 保存到 localStorage - 参考 setting.js 的方式
    try {
        // 保存存档数据
        localStorage.setItem(newkey, JSON.stringify(archiveData));
        localStorage.setItem('gameSettings_current', newkey);

        // 关键：同步更新 URL 中的 archive 参数
        const url = new URL(window.location.href);
        url.searchParams.set('archive', newkey); // 将 URL 参数更新为新存档键
        history.pushState(null, '', url); // 不刷新页面更新 URL
        if (archiveKey && archiveKey !== newkey) {
            localStorage.removeItem(archiveKey); // 删除旧存档
        }
        // 更新存档列表 - 与 setting.js 中的方式保持一致
        let allKeys = JSON.parse(localStorage.getItem('gameSettings_keys') || '[]');
        if (archiveKey) {
            allKeys = allKeys.filter(key => key !== archiveKey);
        }
        if (!allKeys.includes(newkey)) {
            allKeys.push(newkey);
            localStorage.setItem('gameSettings_keys', JSON.stringify(allKeys));
        }
        
        console.log('游戏已保存到存档:', newkey);
        applyArchiveToGameState();
        initializeGame();
        return true;
    } catch (error) {
        console.error('保存游戏失败:', error);
        
        // 如果是存储空间不足，尝试分块保存
        if (error.name === 'QuotaExceededError' || error.code === 22) {
            return saveGameInChunks(archiveKey, archiveData);
        }
        return false;
    }
}



// 修改分块保存函数，确保使用相同的命名逻辑
function saveGameInChunks(archiveKey, archiveData) {
    try {
        const baseKey = `${archiveKey}_chunk`;
        
        // 1. 保存元数据和世界观背景
        const chunk1 = {
            meta: archiveData.meta,
            background: archiveData.background,
            generatedBackground: archiveData.generatedBackground
        };
        localStorage.setItem(`${baseKey}_1`, JSON.stringify(chunk1));
        
        // 2. 保存时间线和地点
        const chunk2 = {
            generatedTimeline: archiveData.generatedTimeline,
            generatedLocations: archiveData.generatedLocations
        };
        localStorage.setItem(`${baseKey}_2`, JSON.stringify(chunk2));
        
        // 3. 保存角色和大纲
        const chunk3 = {
            characters: archiveData.characters,
            storyOutline: archiveData.storyOutline,
            title: archiveData.title || "无标题"
        };
        localStorage.setItem(`${baseKey}_3`, JSON.stringify(chunk3));
        
        // 4. 保存游戏进度
        localStorage.setItem(`${baseKey}_4`, JSON.stringify({
            gameProgress: archiveData.gameProgress
        }));
        
        // 5. 保存故事节点数据 - 可能需要进一步分块
        const nodeIds = Object.keys(archiveData.storyNodes);
        const chunkSize = 5; // 每个分块保存5个节点
        const nodeChunks = [];
        
        for (let i = 0; i < nodeIds.length; i += chunkSize) {
            const chunkNodes = {};
            const chunk = nodeIds.slice(i, i + chunkSize);
            
            chunk.forEach(nodeId => {
                chunkNodes[nodeId] = archiveData.storyNodes[nodeId];
            });
            
            const chunkKey = `${baseKey}_nodes_${i}`;
            localStorage.setItem(chunkKey, JSON.stringify({
                nodes: chunkNodes
            }));
            nodeChunks.push(chunkKey);
        }
        
        // 保存分块信息索引
        const chunkIndex = {
            baseKey: baseKey,
            chunks: [
                `${baseKey}_1`,
                `${baseKey}_2`,
                `${baseKey}_3`,
                `${baseKey}_4`,
                ...nodeChunks
            ],
            isChunked: true,
            timestamp: archiveData.meta.timestamp,
            saveDate: archiveData.meta.saveDate,
            saveTitle: archiveData.meta.saveTitle
        };
        
        localStorage.setItem(archiveKey, JSON.stringify(chunkIndex));
        
        // 设置当前存档
        localStorage.setItem('gameSettings_current', archiveKey);
        
        // 更新存档列表
        let allKeys = JSON.parse(localStorage.getItem('gameSettings_keys') || '[]');
        if (!allKeys.includes(archiveKey)) {
            allKeys.push(archiveKey);
            localStorage.setItem('gameSettings_keys', JSON.stringify(allKeys));
        }
        
        console.log('游戏已分块保存到存档:', archiveKey);
        return true;
    } catch (error) {
        console.error('分块保存游戏失败:', error);
        return false;
    }
}


// 修改从存档加载游戏状态函数
function loadGameFromArchive(archiveKey) {
    try {
        // 获取存档数据
        const archiveData = JSON.parse(localStorage.getItem(archiveKey));
        if (!archiveData) {
            console.error('存档不存在:', archiveKey);
            return false;
        }
        
        // 检查是否是分块存档
        if (archiveData.isChunked) {
            return loadGameFromChunks(archiveKey, archiveData);
        }
        
        // 加载元数据
        if (archiveData.meta) {
            gameState.settings.complexity = archiveData.meta.complexity || 'medium';
            gameState.settings.chapterCount = archiveData.meta.chapterCount || 5;
            gameState.currentChapter = archiveData.meta.currentChapter || 1;
            gameState.gameCompleted = archiveData.meta.gameCompleted || false;
            
        }
        
        // 加载世界观背景
        gameState.storyBackground = archiveData.background || "";
        gameState.generatedBackground = archiveData.generatedBackground || "";
        gameState.timeline = archiveData.generatedTimeline || [];
        gameState.locations = archiveData.generatedLocations || [];
        
        // 加载角色
        gameState.characters = archiveData.characters || [];
        
        // 加载故事大纲
        gameState.storyOutline = archiveData.storyOutline || "";

        //加载标题
        gameState.title = archiveData.title || "无标题";
        
        // 加载游戏进度
        if (archiveData.gameProgress) {
            gameState.exploredNodes = new Set(archiveData.gameProgress.exploredNodes || []);
            gameState.currentPath = archiveData.gameProgress.currentPath || [];
            gameState.history = archiveData.gameProgress.history || [];
            
            // 重建故事树
            gameState.storyTree = buildStoryTreeFromNodes(archiveData.storyNodes || {});
            
            // 更新节点缓存
            if (archiveData.storyNodes) {
                window._gameNodeCache = window._gameNodeCache || {};
                Object.keys(archiveData.storyNodes).forEach(nodeId => {
                    window._gameNodeCache[nodeId] = { ...archiveData.storyNodes[nodeId] };
                });
            }
            
            // 注意：不在这里设置currentStoryNode，而在loadSavedGame中处理
        }
        
        // 设置为当前存档
        localStorage.setItem('gameSettings_current', archiveKey);
        
        console.log('游戏数据已从存档加载:', archiveKey);
        return true;
    } catch (error) {
        console.error('加载存档失败:', error);
        return false;
    }
}

// 修改从分块存档加载游戏函数
function loadGameFromChunks(archiveKey, indexData) {
    try {
        if (!indexData.chunks || !indexData.baseKey) {
            console.error('分块存档索引无效:', archiveKey);
            return false;
        }
        
        // 从各个块中加载数据
        // 1. 加载元数据和世界观
        const chunk1 = JSON.parse(localStorage.getItem(indexData.chunks[0]));
        if (chunk1) {
            // 加载元数据
            if (chunk1.meta) {
                gameState.settings.complexity = chunk1.meta.complexity || 'medium';
                gameState.settings.chapterCount = chunk1.meta.chapterCount || 5;
                gameState.currentChapter = chunk1.meta.currentChapter || 1;
                gameState.gameCompleted = chunk1.meta.gameCompleted || false;
            }
            
            // 加载世界观背景
            gameState.storyBackground = chunk1.background || "";
            gameState.generatedBackground = chunk1.generatedBackground || "";
        }
        
        // 2. 加载时间线和地点
        const chunk2 = JSON.parse(localStorage.getItem(indexData.chunks[1]));
        if (chunk2) {
            gameState.timeline = chunk2.generatedTimeline || [];
            gameState.locations = chunk2.generatedLocations || [];
        }
        
        // 3. 加载角色和大纲
        const chunk3 = JSON.parse(localStorage.getItem(indexData.chunks[2]));
        if (chunk3) {
            gameState.characters = chunk3.characters || [];
            gameState.storyOutline = chunk3.storyOutline || "";
        }
        
        // 4. 加载游戏进度
        const chunk4 = JSON.parse(localStorage.getItem(indexData.chunks[3]));
        if (chunk4 && chunk4.gameProgress) {
            gameState.exploredNodes = new Set(chunk4.gameProgress.exploredNodes || []);
            gameState.currentPath = chunk4.gameProgress.currentPath || [];
            gameState.history = chunk4.gameProgress.history || [];
        }
        
        // 5. 加载故事节点数据，但不设置当前节点
        const storyNodes = {};
        // 从第5块开始都是节点数据
        for (let i = 4; i < indexData.chunks.length; i++) {
            try {
                const nodeChunkKey = indexData.chunks[i];
                const nodeChunk = JSON.parse(localStorage.getItem(nodeChunkKey));
                if (nodeChunk && nodeChunk.nodes) {
                    // 合并节点数据
                    Object.assign(storyNodes, nodeChunk.nodes);
                }
            } catch (error) {
                console.warn(`加载节点分块 ${i} 失败:`, error);
            }
        }
        
        // 重建故事树
        gameState.storyTree = buildStoryTreeFromNodes(storyNodes);
        
        // 更新节点缓存
        window._gameNodeCache = window._gameNodeCache || {};
        Object.keys(storyNodes).forEach(nodeId => {
            window._gameNodeCache[nodeId] = { ...storyNodes[nodeId] };
        });
        
        // 设置为当前存档
        localStorage.setItem('gameSettings_current', archiveKey);
        
        console.log('游戏数据已从分块存档加载:', archiveKey);
        return true;
    } catch (error) {
        console.error('加载分块存档失败:', error);
        return false;
    }
}

// 从节点集合构建故事树
function buildStoryTreeFromNodes(nodesMap) {
    const rootNodes = [];
    const nodeMap = {}; // 用于快速查找
    
    // 首先创建所有节点的浅拷贝
    Object.keys(nodesMap).forEach(nodeId => {
        const node = nodesMap[nodeId];
        nodeMap[nodeId] = { ...node, children: [] };
    });
    
    // 建立父子关系
    Object.keys(nodeMap).forEach(nodeId => {
        const node = nodeMap[nodeId];
        if (node.parentId && nodeMap[node.parentId]) {
            // 如果有父节点，将此节点添加为父节点的子节点
            nodeMap[node.parentId].children.push(node);
        } else {
            // 没有父节点或父节点不在地图中，视为根节点
            rootNodes.push(node);
        }
    });
    
    return rootNodes;
}

function initSaveGameFeature() {
    // 获取已有的保存进度按钮
    const saveBtn = document.querySelector('.save-btn');
    
    // 如果找到了保存按钮，添加点击事件
    if (saveBtn) {
        saveBtn.addEventListener('click', () => {
            // 调用存档函数，不传入archiveKey参数，让它自动生成"标题+时间"的键
            if (saveGameToArchive()) {
                // 显示保存成功通知
                showSaveNotification();
            } else {
                alert('保存游戏失败，请重试');
            }
        });
    }
    
    // 添加保存快捷键 (Ctrl+S)
    document.addEventListener('keydown', function(e) {
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
            e.preventDefault(); // 阻止浏览器默认保存页面行为
            
            // 同样不传入archiveKey参数，使用自动生成的"标题+时间"命名
            if (saveGameToArchive()) {
                showSaveNotification();
            }
        }
    });
    
    // // 添加自动保存功能（每5分钟自动保存一次）
    // setInterval(() => {
    //     // 为自动保存添加auto前缀，但仍使用"标题+时间"格式
    //     // const autoSaveName = `auto_${currentStoryNode.title ? currentStoryNode.title.substring(0, 10) : '自动存档'}`;
    //     // saveGameToArchive(autoSaveName);
    //     // saveGameToArchive();
    //     // console.log('游戏已自动保存');
    // }, 5 * 60 * 1000); // 5分钟 = 300000毫秒
    
    // 获取已有的加载进度按钮
    const loadBtn = document.querySelector('.load-btn');
    
    // 如果找到了加载按钮，添加点击事件
    if (loadBtn) {
        loadBtn.addEventListener('click', () => {
            // 打开存档列表模态框
            openArchiveManager();
        });
    }
}
// 显示保存成功的通知
function showSaveNotification() {
    // 创建通知元素
    const notification = document.createElement('div');
    notification.className = 'save-notification';
    notification.innerHTML = '<i class="fas fa-check-circle"></i> 游戏已保存';
    
    // 设置样式
    notification.style.position = 'fixed';
    notification.style.bottom = '20px';
    notification.style.right = '20px';
    notification.style.backgroundColor = 'rgba(76, 175, 80, 0.9)';
    notification.style.color = 'white';
    notification.style.padding = '10px 20px';
    notification.style.borderRadius = '4px';
    notification.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.2)';
    notification.style.zIndex = '9999';
    notification.style.display = 'flex';
    notification.style.alignItems = 'center';
    notification.style.gap = '8px';
    notification.style.fontSize = '14px';
    notification.style.opacity = '0';
    notification.style.transform = 'translateY(20px)';
    notification.style.transition = 'opacity 0.3s, transform 0.3s';
    
    // 添加到文档
    document.body.appendChild(notification);
    
    // 显示通知
    setTimeout(() => {
        notification.style.opacity = '1';
        notification.style.transform = 'translateY(0)';
    }, 10);
    
    // 3秒后隐藏并移除通知
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateY(20px)';
        
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
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

// 添加图片生成功能初始化
function initializeImageGeneration() {
    const regenerateBtn = document.querySelector('.regenerate-image-btn');
    const imageModal = document.getElementById('imageGenerateModal');
    
    // 重新生成按钮点击事件
    regenerateBtn.addEventListener('click', (e) => {
        e.preventDefault();
        
        // 填充上次的设置
        document.getElementById('sceneDescription').value = gameState.imageSettings.lastDescription;
        document.getElementById('artStyle').value = gameState.imageSettings.lastStyle;
        document.getElementById('colorTone').value = gameState.imageSettings.lastColorTone;
        document.getElementById('additionalRequirements').value = gameState.imageSettings.lastRequirements;
        
        imageModal.classList.add('active');
    });

    // 生成按钮点击事件
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
            // 调用AI图片生成API
            const newImageUrl = await generateImage({
                description,
                style,
                colorTone,
                requirements
            });
            
            // 更新图片
            imgElement.src = newImageUrl;
            imgElement.style.opacity = '1';
            
            // 关闭模态框
            imageModal.classList.remove('active');
            
            // 添加到游戏日志
            addToGameLog({
                type: 'image',
                content: `使用${style}风格重新生成了场景插画`
            });
            
        } catch (error) {
            console.error('生成图片失败:', error);
            alert('生成图片失败，请稍后重试');
        }
    });

    // 关闭按钮事件
    document.querySelector('.close-modal').addEventListener('click', () => {
        imageModal.classList.remove('active');
    });

    // 取消按钮事件
    document.querySelector('.cancel-modal-btn').addEventListener('click', () => {
        imageModal.classList.remove('active');
    });
}

// 图片生成函数
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

// 修改加载已保存的游戏函数
function loadSavedGame(archiveKey) {
    // 加载存档内容
    const success = loadGameFromArchive(archiveKey);
    
    if (success) {
        // 隐藏开始游戏区域
        const startGameArea = document.querySelector('.start-game-area');
        if (startGameArea) {
            startGameArea.classList.add('hidden');
        }
        
        // 显示游戏内容
        document.querySelector('.story-content').style.display = 'block';
        document.querySelector('.choices-container').style.display = 'block';
        document.querySelector('.story-image-container').style.display = 'block';
        
        // 从游戏进度中恢复当前节点
        try {
            const archiveData = JSON.parse(localStorage.getItem(archiveKey));
            
            // 确定当前节点ID
            let currentNodeId;
            
            // 检查存档是否为分块存储
            if (archiveData && archiveData.isChunked) {
                const progressChunkKey = archiveData.chunks && archiveData.chunks.length > 3 ? archiveData.chunks[3] : null;
                if (progressChunkKey) {
                    const progressChunk = JSON.parse(localStorage.getItem(progressChunkKey));
                    if (progressChunk && progressChunk.gameProgress) {
                        currentNodeId = progressChunk.gameProgress.currentNodeId;
                    }
                }
            } else if (archiveData && archiveData.gameProgress) {
                currentNodeId = archiveData.gameProgress.currentNodeId;
            }
            
            // 寻找当前节点数据
            if (currentNodeId) {
                // 首先从节点缓存中查找
                if (window._gameNodeCache && window._gameNodeCache[currentNodeId]) {
                    currentStoryNode = window._gameNodeCache[currentNodeId];
                } else {
                    // 否则尝试从存档的storyNodes中获取
                    let nodeData = null;
                    
                    // 如果是分块存档，需要从节点块中查找
                    if (archiveData && archiveData.isChunked) {
                        for (let i = 4; i < archiveData.chunks.length; i++) {
                            try {
                                const nodeChunkKey = archiveData.chunks[i];
                                const nodeChunk = JSON.parse(localStorage.getItem(nodeChunkKey));
                                if (nodeChunk && nodeChunk.nodes && nodeChunk.nodes[currentNodeId]) {
                                    nodeData = nodeChunk.nodes[currentNodeId];
                                    break;
                                }
                            } catch (e) {
                                console.warn(`无法读取节点块 ${i}:`, e);
                            }
                        }
                    } else if (archiveData && archiveData.storyNodes && archiveData.storyNodes[currentNodeId]) {
                        // 从常规存档中获取节点
                        nodeData = archiveData.storyNodes[currentNodeId];
                    }
                    
                    if (nodeData) {
                        currentStoryNode = nodeData;
                    } else {
                        console.warn('无法找到当前节点数据，使用初始节点');
                        currentStoryNode = storyContent.opening;
                    }
                }
            } else {
                console.warn('存档中没有当前节点ID，使用初始节点');
                currentStoryNode = storyContent.opening;
            }
            
            // 确保当前节点有选项
            if (!currentStoryNode.choices || !Array.isArray(currentStoryNode.choices) || currentStoryNode.choices.length === 0) {
                console.log('为当前节点生成默认选项');
                currentStoryNode.choices = [
                    {
                        text: "继续探索",
                        effect: "探索未知的区域",
                        nextContent: "你决定继续前进，寻找更多的线索..."
                    },
                    {
                        text: "寻找其他路径",
                        effect: "开辟新的方向",
                        nextContent: "你决定尝试不同的方向，希望能找到突破口..."
                    }
                ];
            }
            
        } catch (error) {
            console.error('恢复当前节点失败:', error);
            // 如果恢复失败，使用初始节点
            currentStoryNode = storyContent.opening;
        }
        
        // 更新故事显示
        updateStoryDisplay(currentStoryNode);
        updateChoices(currentStoryNode.choices);
        
        // 更新侧边栏剧情树
        updateSidePanelStoryTree();
        
        // 更新章节进度
        updateChapterProgress();
        
        console.log('从存档加载游戏成功:', archiveKey);
    } else {
        console.error('加载存档失败:', archiveKey);
        // 加载失败时显示开始游戏按钮
        document.querySelector('.story-content').style.display = 'none';
        document.querySelector('.choices-container').style.display = 'none';
        document.querySelector('.story-image-container').style.display = 'none';
        document.querySelector('.start-game-area').classList.remove('hidden');
    }
    
    // 初始化游戏功能
    initSaveGameFeature();
    initializeEditFeatures();
    initializeStoryInfoButtons();
    initializeStoryTreeFeatures();
    initializeSettingsInfoButton();
    initializeImageGeneration();
}

// 修改 DOMContentLoaded 事件处理函数，检查存档是否已有游戏内容
document.addEventListener('DOMContentLoaded', () => {
    // 创建开始游戏按钮区域
    const startGameArea = document.createElement('div');
    startGameArea.className = 'start-game-area';
    startGameArea.innerHTML = `
        <div class="start-game-container">
            <h2>准备开始你的冒险</h2>
            <p>点击下方按钮，AI将根据你的设定生成完整的故事框架并开始游戏</p>
            <button id="startGameBtn" class="start-game-btn">
                <i class="fas fa-play"></i> 开始游戏
            </button>
            <div id="startGameLoading" class="start-game-loading hidden">
                <div class="spinner"></div>
                <p>AI正在创作你的故事世界...</p>
                <div id="loadingProgressText" class="loading-progress-text"></div>
            </div>
        </div>
    `;
    
    // 将按钮区域插入到故事内容前面
    const storyContainer = document.querySelector('.story-content');
    if (storyContainer) {
        storyContainer.parentNode.insertBefore(startGameArea, storyContainer);
    }
    
    // 获取当前存档键
    const urlParams = new URLSearchParams(window.location.search);
    const archiveKey = urlParams.get('archive') || localStorage.getItem('gameSettings_current');
    console.log( urlParams.get('archive'));
    console.log(localStorage.getItem('gameSettings_current'));
    // 检查是否从存档加载游戏且存档中已有游戏内容
    if (archiveKey) {
        try {
            const archiveData = JSON.parse(localStorage.getItem(archiveKey));
            console.log('加载存档数据:', archiveData);
            // 检查存档是否为分块存储
            if (archiveData && archiveData.isChunked) {
                // 检查分块存档中是否有游戏进度数据
                const progressChunkKey = archiveData.chunks && archiveData.chunks.length > 3 ? archiveData.chunks[3] : null;
                if (progressChunkKey) {
                    const progressChunk = JSON.parse(localStorage.getItem(progressChunkKey));
                    if (progressChunk && progressChunk.gameProgress && progressChunk.gameProgress.currentNodeId) {
                        // 有游戏进度，直接加载存档
                        loadSavedGame(archiveKey);
                        return; // 加载存档后退出初始化函数
                    }
                }
            } 
            // 检查常规存档是否有游戏进度
            else if (archiveData && archiveData.gameProgress && archiveData.gameProgress.currentNodeId) {
                // 有游戏进度，直接加载存档
                loadSavedGame(archiveKey);
                return; // 加载存档后退出初始化函数
            }
        } catch (error) {
            console.error('检查存档失败:', error);
            // 出错时继续初始化游戏
        }
    }
    
    // 如果没有加载现有存档或存档中没有游戏内容，则显示开始游戏按钮
    // 隐藏故事内容和选择区域，直到游戏开始
    document.querySelector('.story-content').style.display = 'none';
    document.querySelector('.choices-container').style.display = 'none';
    document.querySelector('.story-image-container').style.display = 'none';

    // 2. 更新DOM
    const titleElem = document.getElementById('storyTitle');
    if (!titleElem) {
        console.error("未找到#storyTitle元素！");
        return;
    }

        titleElem.textContent = gameState?.storyOutline?.title ;
    // 添加开始游戏按钮的点击事件
    document.getElementById('startGameBtn').addEventListener('click', startGame);
    
    // 其他初始化代码
    initSaveGameFeature();
    initializeEditFeatures();
    initializeStoryInfoButtons();
    initializeStoryTreeFeatures();
    initializeSettingsInfoButton();
    initializeImageGeneration();
});