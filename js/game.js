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
    }
};

// 示例故事内容库
const storyContent = {
    opening: {
        title: "第一章：神秘的开始",
        content: "这是一个平静的早晨，你推开窗户，发现街道上空无一人。昨晚的暴雨似乎冲刷走了城市的喧嚣，留下的只有潮湿的空气和若有若无的雾气...",
        choices: [
            {
                text: "调查街道的异常",
                effect: "探索未知的环境",
                nextContent: "你决定下楼一探究竟。街道上弥漫着一层薄雾，脚步声在寂静中格外清晰...",
                nextChoices: [
                    {
                        text: "跟随一个若隐若现的身影",
                        effect: "可能发现重要线索",
                        nextContent: "那个身影似乎注意到了你的存在，却并没有要逃走的意思..."
                    },
                    {
                        text: "检查附近的建筑",
                        effect: "寻找更多信息",
                        nextContent: "你注意到不远处的咖啡馆门窗大开，像是有人匆忙离开..."
                    }
                ]
            },
            {
                text: "先观察周围环境",
                effect: "谨慎收集信息",
                nextContent: "从窗口望去，你发现街道上有一些不寻常的痕迹，像是某种仪式的残留...",
                nextChoices: [
                    {
                        text: "记录下这些痕迹",
                        effect: "保存重要证据",
                        nextContent: "你仔细地用手机拍下了这些奇怪的标记，它们似乎组成了某种图案..."
                    },
                    {
                        text: "寻找高处以获得更好的视野",
                        effect: "扩大观察范围",
                        nextContent: "你决定前往楼顶，从那里可以看到整个街区的情况..."
                    }
                ]
            }
        ]
    }
};

// 当前游戏状态
let currentStoryNode = storyContent.opening;

// 初始化游戏
function initializeGame() {
    // 显示初始内容
    updateStoryDisplay(currentStoryNode);
    // 显示初始选项
    updateChoices(currentStoryNode.choices);
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
}

// 更新选择按钮
function updateChoices(choices) {
    const choicesContainer = document.getElementById('choiceButtons');
    choicesContainer.innerHTML = choices.map((choice, index) => `
        <button class="choice-btn" data-choice-index="${index}">
            <span class="choice-text">${choice.text}</span>
            <span class="choice-effect">${choice.effect}</span>
        </button>
    `).join('');

    // 添加选择按钮的点击事件
    const choiceButtons = choicesContainer.querySelectorAll('.choice-btn');
    choiceButtons.forEach(btn => {
        btn.addEventListener('click', handleChoiceClick);
    });
}

// 处理选择点击
function handleChoiceClick(event) {
    const button = event.currentTarget;
    const choiceIndex = parseInt(button.dataset.choiceIndex);
    const currentChoice = currentStoryNode.choices[choiceIndex];

    // 保存当前状态到历史记录
    addToHistory({
        title: currentStoryNode.title,
        content: `选择了：${currentChoice.text}`
    });

    // 隐藏选择按钮
    document.querySelector('.choices-container').style.opacity = '0.5';
    document.querySelectorAll('.choice-btn').forEach(btn => {
        btn.disabled = true;
    });

    // 显示主题选择界面
    const themeSelection = document.getElementById('themeSelection');
    themeSelection.classList.remove('hidden');

    // 初始化主题选择
    initializeThemeSelection(currentChoice);
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

// 生成下一段故事内容
async function generateNextContent(choice, theme) {
    // 这里应该调用 AI API 来生成基于选择和主题的新内容
    // 现在使用示例内容
    return {
        title: `${currentStoryNode.title} - 延展`,
        content: `${choice.nextContent}\n\n基于${theme}主题的新发展...`,
        choices: [
            {
                text: "继续探索这个方向",
                effect: "深入发展当前剧情",
                nextContent: "你决定继续沿着这个方向深入..."
            },
            {
                text: "尝试其他可能",
                effect: "开启新的剧情分支",
                nextContent: "你觉得应该尝试其他的可能性..."
            }
        ]
    };
}

// 更新故事内容
function updateStoryWithNewContent(newContent) {
    // 更新当前节点
    currentStoryNode = {
        title: newContent.title,
        content: newContent.content,
        choices: newContent.choices
    };

    // 更新显示
    updateStoryDisplay(currentStoryNode);
    updateChoices(newContent.choices);
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

// 在文档加载完成后初始化游戏
document.addEventListener('DOMContentLoaded', () => {
    initializeGame();
    initializeEditFeatures();
    initializeStoryInfoButtons();
    
    // 初始化确认按钮
    document.querySelector('.confirm-theme-btn').disabled = true;
});
