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

// 渲染完整剧情树
function renderFullStoryTree() {
    const fullStoryTree = document.getElementById('fullStoryTree');
    fullStoryTree.innerHTML = '';
    
    // 如果游戏状态中有剧情树数据，则使用它
    if (gameState.storyTree.length > 0) {
        renderStoryTreeNodes(gameState.storyTree, fullStoryTree);
    } else {
        // 否则使用当前故事内容构建临时剧情树
        const tempTree = buildTempStoryTree();
        renderStoryTreeNodes(tempTree, fullStoryTree);
    }
    
    // 添加节点之间的连接线
    drawNodeConnections();
    
    // 初始自动调整容器大小以适应内容
    adjustContainerSize();

    // 添加拖动功能
    initializeDraggableTree();
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
// 根据计算好的位置渲染节点 - 修复根节点居中问题
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
            
            // 启用编辑和删除按钮
            document.querySelector('.edit-node-btn').disabled = false;
            document.querySelector('.delete-node-btn').disabled = false;
            
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

// 初始化树编辑工具
function initializeTreeEditTools() {
    const addNodeBtn = document.querySelector('.add-node-btn');
    const editNodeBtn = document.querySelector('.edit-node-btn');
    const deleteNodeBtn = document.querySelector('.delete-node-btn');
    
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

// 在文档加载完成后初始化游戏
document.addEventListener('DOMContentLoaded', () => {
    initializeGame();
    initializeEditFeatures();
    initializeStoryInfoButtons();
    initializeStoryTreeFeatures(); // 初始化剧情树功能
    
    // 初始化确认按钮
    document.querySelector('.confirm-theme-btn').disabled = true;
});
