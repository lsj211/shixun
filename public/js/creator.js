//1502行新生成内容


 // 游戏状态管理
// const gameState = {
//     storyBackground: "",
//     characters: [],
//     currentChapter: 1,
//     currentNode: null,
//     selectedTheme: "",
//     storyTree: [],
//     currentChoices: [],
//     history: [],
//     gameLog: [],
//     settings: {
//         complexity: "medium",
//         chapterCount: 5
//     },
//     imageSettings: {
//         lastDescription: '',
//         lastStyle: 'realistic',
//         lastColorTone: 'warm',
//         lastRequirements: ''
//     }
// };

// // 修改示例故事内容库
// const storyContent = {
//     chapters: [
//         {
//             id: 1,
//             title: "第一章：命运的开端",
//             content: "在一个平凡的早晨，主角收到了一封神秘的信件，上面记载着一个古老的预言...",
//             editable: true,
//             choices: []
//         },
//         {
//             id: 2,
//             title: "第二章：隐秘真相",
//             content: "随着调查的深入，主角发现这个城市地下似乎隐藏着一个庞大的秘密组织...",
//             editable: true,
//             choices: []
//         },
//         {
//             id: 3,
//             title: "第三章：命运交织",
//             content: "不同的人物命运开始交织，每个人似乎都与这个预言有着千丝万缕的联系...",
//             editable: true,
//             choices: []
//         },
//         {
//             id: 4,
//             title: "第四章：真相浮现",
//             content: "随着更多线索的出现，预言背后的真相逐渐浮出水面，一切都指向了那个古老的传说...",
//             editable: true,
//             choices: []
//         },
//         {
//             id: 5,
//             title: "第五章：终极抉择",
//             content: "面对最终的真相，主角必须做出选择，这个选择将影响整个世界的命运...",
//             editable: true,
//             choices: []
//         }
//     ]
// };

// // 当前游戏状态
// let currentStoryNode = storyContent.chapters[0];

// // 初始化游戏
// function initializeGame() {
//     // 初始化所有章节
//     gameState.storyTree = storyContent.chapters;
    
//     // 设置当前节点为第一章
//     currentStoryNode = storyContent.chapters[0];
    
//     // 显示初始内容
//     updateStoryDisplay(currentStoryNode);
    
//     // 渲染所有章节到剧情树
//     const treeContainer = document.getElementById('storyTree');
//     treeContainer.innerHTML = ''; // 清空现有内容
    
//     storyContent.chapters.forEach(chapter => {
//         addToStoryTree(chapter);
//     });
    
//     // 高亮第一章
//     highlightCurrentNode(1);
    
//     // 添加初始化记录
//     addToHistory({
//         title: "初始化",
//         content: "故事创建完成，包含五个主要章节"
//     });
// }

// // 更新故事显示
// function updateStoryDisplay(node) {
//     // 更新标题
//     document.getElementById('currentStageTitle').textContent = node.title;
    
//     // 更新内容并设置为可编辑
//     const storyTextElement = document.getElementById('storyText');
//     storyTextElement.textContent = node.content;
//     storyTextElement.contentEditable = node.editable || false;
//     storyTextElement.dataset.nodeId = node.id;
    
//     // 绑定内容变更事件
//     storyTextElement.onblur = function() {
//         if (parseInt(this.dataset.nodeId) === currentStoryNode.id) {
//             currentStoryNode.content = this.textContent;
//             addToHistory({
//                 title: "编辑",
//                 content: "修改了剧情内容"
//             });
//         }
//     };
    
//     // 更新章节信息
//     document.getElementById('currentChapter').textContent = node.title;
    
//     // 生成新的场景图片
//     regenerateImage(node.content);
    
//     // 将节点添加到剧情树
//     addToStoryTree(node);
    
//     // 高亮当前节点
//     highlightCurrentNode(node.id);
    
//     // 隐藏选择按钮区域
//     document.querySelector('.choices-container').style.display = 'none';
// }

// // 高亮当前节点
// function highlightCurrentNode(nodeId) {
//     const nodes = document.querySelectorAll('.tree-node');
//     nodes.forEach(node => {
//         const titleElement = node.querySelector('.tree-node-title');
//         if (titleElement && titleElement.dataset.id === String(nodeId)) {
//             node.classList.add('active');
//         } else {
//             node.classList.remove('active');
//         }
//     });
// }

// // 添加到剧情树
// function addToStoryTree(node) {
//     // 检查节点是否已存在
//     const existingNode = document.querySelector(`.tree-node-title[data-id="${node.id}"]`);
//     if (existingNode) {
//         // 如果节点已存在，只更新标题（如果有变化）
//         if (existingNode.textContent !== node.title) {
//             existingNode.textContent = node.title;
//         }
//         return;
//     }
    
//     const treeContainer = document.getElementById('storyTree');
//     const nodeElement = document.createElement('div');
//     nodeElement.className = 'tree-node';
    
//     // 创建标题元素
//     const titleElement = document.createElement('div');
//     titleElement.className = 'tree-node-title';
//     titleElement.textContent = node.title;
//     titleElement.dataset.id = node.id; // 添加唯一标识
    
//     // 创建生成按钮
//     const generateBtn = document.createElement('button');
//     generateBtn.className = 'tree-node-generate';
//     generateBtn.innerHTML = '<i class="fas fa-magic"></i> 生成内容';
//     generateBtn.title = '生成该节点的详细内容';
    
//     // 组装节点
//     nodeElement.appendChild(titleElement);
//     nodeElement.appendChild(generateBtn);
//     treeContainer.appendChild(nodeElement);
    
//     // 添加点击事件 - 编辑标题
//     titleElement.addEventListener('click', function(e) {
//         // 如果已经在编辑模式则不重复处理
//         if (this.classList.contains('edit-mode')) return;
        
//         // 阻止事件冒泡到节点，避免选中节点
//         e.stopPropagation();
        
//         this.classList.add('edit-mode');
//         this.contentEditable = true;
//         this.focus();
        
//         // 保存原始标题
//         const originalTitle = this.textContent;
        
//         // 处理编辑完成
//         const finishEditing = () => {
//             this.classList.remove('edit-mode');
//             this.contentEditable = false;
            
//             // 如果标题有变化，更新相关内容
//             if (this.textContent.trim() && this.textContent !== originalTitle) {
//                 const newTitle = this.textContent.trim();
//                 this.textContent = newTitle;
                
//                 // 如果是当前节点，同步更新故事区域标题
//                 if (currentStoryNode.id === parseInt(this.dataset.id)) {
//                     currentStoryNode.title = newTitle;
//                     document.getElementById('currentStageTitle').textContent = newTitle;
//                     document.getElementById('currentChapter').textContent = newTitle;
//                 }
                
//                 addToHistory({
//                     title: "编辑",
//                     content: `修改了章节标题：${newTitle}`
//                 });
//             } else {
//                 // 恢复原始标题
//                 this.textContent = originalTitle;
//             }
//         };
        
//         // 失去焦点时完成编辑
//         this.addEventListener('blur', finishEditing, { once: true });
        
//         // 按下Enter键完成编辑，Esc键取消
//         this.addEventListener('keydown', function(e) {
//             if (e.key === 'Enter' && !e.shiftKey) {
//                 e.preventDefault();
//                 finishEditing();
//             } else if (e.key === 'Escape') {
//                 e.preventDefault();
//                 this.textContent = originalTitle;
//                 finishEditing();
//             }
//         }, { once: true });
//     });
    
//     // 添加生成按钮点击事件
//     generateBtn.addEventListener('click', function(e) {
//         e.stopPropagation(); // 防止触发标题编辑
        
//         const nodeTitle = titleElement.textContent;
//         const nodeId = titleElement.dataset.id;
        
//         // 显示生成中提示
//         this.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 生成中...';
//         this.disabled = true;
        
//         // 模拟生成过程
//         setTimeout(() => {
//             // 恢复按钮状态
//             this.innerHTML = '<i class="fas fa-magic"></i> 生成内容';
//             this.disabled = false;
            
//             // 实际应用中，这里应该调用API生成内容
//             // 并更新到对应的节点
//             if (parseInt(nodeId) === currentStoryNode.id) {
//                 // 如果是当前节点，更新内容
//                 generateDetailedContent(nodeTitle).then(detailedContent => {
//                     currentStoryNode.content = detailedContent;
//                     document.getElementById('storyText').textContent = detailedContent;
                    
//                     // 标记内容为可编辑
//                     currentStoryNode.editable = true;
                    
//                     addToHistory({
//                         title: "生成内容",
//                         content: `为"${nodeTitle}"生成了详细内容`
//                     });
//                 });
//             } else {
//                 alert(`已为"${nodeTitle}"生成了详细内容！`);
//             }
//         }, 1500);
//     });
    
//     // 添加节点点击事件 - 切换当前节点
//     nodeElement.addEventListener('click', function() {
//         // 移除其他节点的active类
//         document.querySelectorAll('.tree-node').forEach(n => {
//             n.classList.remove('active');
//         });
//         // 为当前点击的节点添加active类
//         this.classList.add('active');
        
//         // 切换到该节点的内容
//         const nodeId = this.querySelector('.tree-node-title').dataset.id;
//         if (parseInt(nodeId) !== currentStoryNode.id) {
//             // 从storyTree中找到对应节点
//             let targetNode = gameState.storyTree.find(node => node.id === parseInt(nodeId));
            
//             if (!targetNode) {
//                 // 如果节点不存在，使用模拟数据
//                 targetNode = {
//                     id: parseInt(nodeId),
//                     title: this.querySelector('.tree-node-title').textContent,
//                     content: `这是${this.querySelector('.tree-node-title').textContent}的内容...`,
//                     editable: true,
//                     choices: []
//                 };
                
//                 // 添加到storyTree
//                 gameState.storyTree.push(targetNode);
//             }
            
//             currentStoryNode = targetNode;
//             updateStoryDisplay(targetNode);
            
//             addToHistory({
//                 title: "切换章节",
//                 content: `切换到"${targetNode.title}"`
//             });
//         }
//     });
    
//     // 将节点添加到storyTree
//     if (!gameState.storyTree.some(node => node.id === parseInt(node.id))) {
//         gameState.storyTree.push(node);
//     }
    
//     return nodeElement;
// }

// // 生成详细内容（模拟）
// async function generateDetailedContent(title) {
//     // 这里应该调用AI API生成详细内容
//     return `${title}的详细内容...\n\n这是一段由AI生成的详细描述，讲述了${title}的背景故事和相关情节。这里可以包含更多的细节、环境描写、角色互动等内容，使故事更加丰富生动。你可以直接编辑这段内容来修改剧情。`;
// }

// // 重新生成图片
// function regenerateImage(description) {
//     // 这里应该调用 AI API 来生成图片
//     // 现在使用随机占位图片模拟
//     const randomSize = Math.floor(Math.random() * 200) + 800;
//     document.getElementById('storyImage').src = `https://via.placeholder.com/${randomSize}x400`;
// }

// // 初始化编辑功能
// function initializeEditFeatures() {
//     // 编辑标题
//     document.querySelector('.edit-title-btn').addEventListener('click', () => {
//         const modal = document.getElementById('editModal');
//         const input = document.getElementById('modalInput');
//         input.value = currentStoryNode.title;
        
//         modal.classList.add('active');
//         document.querySelector('.save-modal-btn').onclick = () => {
//             currentStoryNode.title = input.value;
//             document.getElementById('currentStageTitle').textContent = input.value;
//             document.getElementById('currentChapter').textContent = input.value;
//             modal.classList.remove('active');
//             addToHistory({
//                 title: "编辑",
//                 content: `修改了标题：${input.value}的标题`
//             });
//         };
//     });

//     // 编辑剧情
//     document.querySelector('.edit-story-btn').addEventListener('click', () => {
//         const modal = document.getElementById('editModal');
//         const input = document.getElementById('modalInput');
//         input.value = currentStoryNode.content;
        
//         modal.classList.add('active');
//         document.querySelector('.save-modal-btn').onclick = () => {
//             currentStoryNode.content = input.value;
//             document.getElementById('storyText').textContent = input.value;
//             modal.classList.remove('active');
//             addToHistory({
//                 title: "编辑",
//                 content: "修改了剧情内容"
//             });
//         };
//     });

//     // 关闭模态框
//     document.querySelector('.close-modal').addEventListener('click', () => {
//         document.getElementById('editModal').classList.remove('active');
//     });
    
//     document.querySelector('.cancel-modal-btn').addEventListener('click', () => {
//         document.getElementById('editModal').classList.remove('active');
//     });
// }

// // 初始化故事信息按钮
// function initializeStoryInfoButtons() {
//     // 故事背景按钮
//     const storyInfoBtn = document.querySelector('.story-info-btn');
//     const storyInfoModal = document.getElementById('storyInfoModal');
    
//     storyInfoBtn.addEventListener('click', () => {
//         updateStoryInfoContent();
//         storyInfoModal.classList.add('active');
//     });

//     // 角色设定按钮
//     const characterInfoBtn = document.querySelector('.character-info-btn');
//     const characterInfoModal = document.getElementById('characterInfoModal');
    
//     characterInfoBtn.addEventListener('click', () => {
//         updateCharacterInfoContent();
//         characterInfoModal.classList.add('active');
//     });

//     // 关闭按钮
//     document.querySelectorAll('.close-modal').forEach(btn => {
//         btn.addEventListener('click', (e) => {
//             e.target.closest('.modal').classList.remove('active');
//         });
//     });
// }

// // 更新故事背景内容
// function updateStoryInfoContent() {
//     // 更新世界观设定
//     document.getElementById('worldBackground').textContent = gameState.storyBackground || "这是一个充满奇幻与神秘的世界，各种超自然现象时有发生...";

//     // 更新时间线
//     const timeline = document.getElementById('storyTimeline');
//     timeline.innerHTML = gameState.history.map(event => `
//         <div class="timeline-event">
//             <h4>${event.title}</h4>
//             <p>${event.content}</p>
//         </div>
//     `).join('');

//     // 更新重要地点
//     const locations = document.getElementById('importantLocations');
//     // 这里应该从游戏状态中获取地点信息
//     locations.innerHTML = [
//         {
//             name: "神秘房间",
//             description: "故事开始的地方，充满了未解之谜..."
//         },
//         {
//             name: "空旷街道",
//             description: "被雾气笼罩的街道，似乎隐藏着什么..."
//         },
//         {
//             name: "废弃工厂",
//             description: "传闻中发生过神秘事件的地方，弥漫着诡异的气息..."
//         }
//     ].map(location => `
//         <div class="location-card">
//             <h4>${location.name}</h4>
//             <p>${location.description}</p>
//         </div>
//     `).join('');
// }

// // 更新角色设定内容
// function updateCharacterInfoContent() {
//     const characterGrid = document.getElementById('characterGrid');
    
//     // 如果没有角色数据，添加一些示例角色
//     if (gameState.characters.length === 0) {
//         gameState.characters = [
//             {
//                 name: "主角",
//                 description: "一位好奇心旺盛的年轻探险家，对神秘事件充满兴趣...",
//                 traits: ["勇敢", "机智", "好奇心强"]
//             },
//             {
//                 name: "神秘陌生人",
//                 description: "在街道上遇到的神秘人物，似乎知道很多关于这个世界的秘密...",
//                 traits: ["神秘", "沉默寡言", "观察力敏锐"]
//             }
//         ];
//     }
    
//     characterGrid.innerHTML = gameState.characters.map(char => `
//         <div class="character-info-card">
//             <img class="character-info-image" src="https://via.placeholder.com/250x200" alt="${char.name}">
//             <div class="character-info-details">
//                 <h3>${char.name}</h3>
//                 <p>${char.description}</p>
//                 <div class="character-traits">
//                     ${generateCharacterTraits(char)}
//                 </div>
//             </div>
//         </div>
//     `).join('');
// }

// // 生成角色特征标签
// function generateCharacterTraits(character) {
//     return (character.traits || []).map(trait => `
//         <span class="character-trait">${trait}</span>
//     `).join('');
// }

// // 修改添加历史记录的函数
// function addToHistory(action) {
//     const historyContainer = document.getElementById('storyHistory');
//     const timestamp = new Date().toLocaleTimeString();
    
//     // 创建新的历史记录条目
//     const entryElement = document.createElement('div');
//     entryElement.className = 'history-entry';
    
//     // 根据操作类型设置不同的提示文本
//     let actionText = '';
//     if (action.type === 'edit' && currentStoryNode) {
//         actionText = `修改了 ${currentStoryNode.title} 的内容`;
//     } else if (action.type === 'image') {
//         actionText = `为 ${currentStoryNode.title} 生成了新的场景图片`;
//     } else if (action.type === 'title') {
//         actionText = `修改了章节标题为：${currentStoryNode.title}`;
//     } else {
//         actionText = action.content;
//     }
    
//     // 设置历史记录内容
//     entryElement.innerHTML = `
//         <span class="history-time">[${timestamp}]</span>
//         <span class="history-text">${actionText}</span>
//     `;
    
//     // 将新记录添加到容器中
//     historyContainer.insertBefore(entryElement, historyContainer.firstChild);
    
//     // 自动滚动到最新记录
//     historyContainer.scrollTop = historyContainer.scrollHeight;
// }

// // 在相关操作处调用 addToHistory
// function editStoryContent() {
//     if (!currentStoryNode) return;
    
//     const modal = document.getElementById('editModal');
//     const input = document.getElementById('modalInput');
//     input.value = currentStoryNode.content;
//     modal.classList.add('active');
    
//     document.querySelector('.save-modal-btn').onclick = () => {
//         currentStoryNode.content = input.value;
//         document.getElementById('storyText').textContent = input.value;
//         modal.classList.remove('active');
        
//         // 添加修改记录
//         addToHistory({
//             type: 'edit',
//             content: `修改了 ${currentStoryNode.title} 的内容`
//         });
//     };
// }

// // 图片生成相关初始化
// function initializeImageGeneration() {
//     const regenerateBtn = document.querySelector('.regenerate-image-btn');
//     const imageModal = document.getElementById('imageGenerateModal');
    
//     regenerateBtn.addEventListener('click', (e) => {
//         e.preventDefault();
        
//         // 填充上次的设置
//         document.getElementById('sceneDescription').value = gameState.imageSettings.lastDescription;
//         document.getElementById('artStyle').value = gameState.imageSettings.lastStyle;
//         document.getElementById('colorTone').value = gameState.imageSettings.lastColorTone;
//         document.getElementById('additionalRequirements').value = gameState.imageSettings.lastRequirements;
        
//         imageModal.classList.add('active');
//     });

//     // 设置生成按钮事件
//     document.querySelector('.generate-image-btn').addEventListener('click', async () => {
//         const description = document.getElementById('sceneDescription').value;
//         const style = document.getElementById('artStyle').value;
//         const colorTone = document.getElementById('colorTone').value;
//         const requirements = document.getElementById('additionalRequirements').value;
        
//         // 保存设置
//         gameState.imageSettings = {
//             lastDescription: description,
//             lastStyle: style,
//             lastColorTone: colorTone,
//             lastRequirements: requirements
//         };
        
//         // 显示加载状态
//         const imgElement = document.getElementById('storyImage');
//         imgElement.style.opacity = '0.5';
        
//         try {
//             // 这里调用AI图片生成API
//             const newImageUrl = await generateImage({
//                 description,
//                 style,
//                 colorTone,
//                 requirements
//             });
            
//             // 更新图片
//             imgElement.src = newImageUrl;
//             imgElement.style.opacity = '1';
            
//             // 添加到历史记录
//             addToHistory({
//                 title: "生成插画",
//                 content: `使用${style}风格生成了新的场景插画`
//             });
            
//             // 关闭模态框
//             imageModal.classList.remove('active');
//         } catch (error) {
//             console.error('生成图片失败:', error);
//             alert('生成图片失败，请稍后重试');
//         }
//     });
// }

// // 添加图片生成函数
// async function generateImage(settings) {
//     // 这里应该是实际的AI API调用
//     // 现在用随机占位图片模拟
//     const styles = {
//         realistic: '写实',
//         anime: '动漫',
//         watercolor: '水彩',
//         oil: '油画',
//         pixel: '像素'
//     };
    
//     console.log('生成图片设置:', settings);
    
//     // 模拟API调用延迟
//     await new Promise(resolve => setTimeout(resolve, 1500));
    
//     // 返回随机大小的占位图片
//     const width = Math.floor(Math.random() * 200) + 800;
//     const height = 400;
//     return `https://via.placeholder.com/${width}x${height}?text=${styles[settings.style]}风格`;
// }

// // 在文档加载完成后初始化游戏
// document.addEventListener('DOMContentLoaded', () => {
//     initializeGame();
//     initializeEditFeatures();
//     initializeStoryInfoButtons();
//     initializeImageGeneration();
    
//     // 设置一些初始故事背景
//     gameState.storyBackground = "这是一个充满奇幻与神秘的世界，各种超自然现象时有发生。最近，一个小镇上发生了一系列离奇事件，引起了人们的恐慌和好奇...";
// });


let isRegenerating = false;
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
function initializeCustomInput() {
    // 获取输入框和按钮元素
    const inputElement = document.getElementById('storyCustomInput');
    const applyButton = document.querySelector('.apply-modification-btn');
    
    // 从本地存储加载已保存的输入内容
    const savedInput = localStorage.getItem('customStoryInput');
    if (savedInput) {
        inputElement.value = savedInput;
    }
    
    // 绑定应用修改按钮点击事件
    applyButton.addEventListener('click', function() {
        saveCustomInput(inputElement);
    });
    
    // 绑定回车键触发保存
    inputElement.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            saveCustomInput(inputElement);
        }
    });
}

// 保存输入内容到变量并存储到本地
function saveCustomInput(inputElement) {
    // 获取输入框内容并去除首尾空格
    const inputValue = inputElement.value.trim();
    
    if (!inputValue) {
        showToast('输入内容不能为空', true);
        return;
    }
    
    // 1. 保存到变量（可在全局访问）
    window.customStoryInput = inputValue; // 全局变量存储
    
    // 2. 保存到本地存储
    localStorage.setItem('customStoryInput', inputValue);
    
    console.log('建议已保存:',  window.customStoryInput);
    
    // 4. 显示成功提示
    showToast('建议成功提交');
    
    // 5. 记录操作历史
    addToHistory({
        title: "保存自定义内容",
        content: `提出修改建议： ${inputValue.length > 20 ? inputValue.substring(0, 20) + '...' : inputValue}`
    });
}


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
    // 尝试从本地存储加载游戏状态
    const savedState = localStorage.getItem('gameState');
    if (savedState) {
        try {
            const parsedState = JSON.parse(savedState);
            gameState.storyTree = parsedState.storyTree || [];
            gameState.currentChapter = parsedState.currentChapter || 1;
            
            // 找到当前节点
            currentStoryNode = gameState.storyTree.find(node => 
                node.id === gameState.currentChapter
            ) || storyContent.chapters[0];
        } catch (e) {
            console.error('Failed to load saved state', e);
            gameState.storyTree = storyContent.chapters;
            currentStoryNode = storyContent.chapters[0];
        }
    } else {
        // 初始化所有章节
        gameState.storyTree = storyContent.chapters;
        
        // 设置当前节点为第一章
        currentStoryNode = storyContent.chapters[0];
    }
    
    // 显示初始内容
    updateStoryDisplay(currentStoryNode);
    
    // 渲染所有章节到剧情树
    const treeContainer = document.getElementById('storyTree');
    treeContainer.innerHTML = ''; // 清空现有内容
    
    gameState.storyTree.forEach(chapter => {
        addToStoryTree(chapter);
    });
    
    // 高亮当前章节
    highlightCurrentNode(currentStoryNode.id);
    
    // 添加初始化记录
    addToHistory({
        title: "初始化",
        content: "故事创建完成，包含五个主要章节"
    });
}

// 保存游戏状态到本地存储
function saveGameState() {
    // 更新当前章节
    gameState.currentChapter = currentStoryNode.id;
    
    // 保存到本地存储
    localStorage.setItem('gameState', JSON.stringify({
        storyTree: gameState.storyTree,
        currentChapter: gameState.currentChapter,
        // 可以根据需要保存其他状态
    }));
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
        const originalContent = currentStoryNode.content;
        const newContent = this.textContent;
        
        currentStoryNode.content = newContent;
        saveGameState();
        
        // 如果内容有实质性变化，触发后续更新
        if (newContent !== originalContent) {
            handleContentChange(currentStoryNode.id);
        }
        
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
                
                // 更新故事树中的节点
                const nodeId = parseInt(this.dataset.id);
                const targetNode = gameState.storyTree.find(n => n.id === nodeId);
                
                if (targetNode) {
                    targetNode.title = newTitle;
                    handleTitleChange(nodeId, newTitle); // 新增调用
                    saveGameState(); // 保存状态
                    
                    // 如果是当前节点，同步更新故事区域标题
                    if (currentStoryNode.id === nodeId) {
                        currentStoryNode.title = newTitle;
                        document.getElementById('currentStageTitle').textContent = newTitle;
                        document.getElementById('currentChapter').textContent = newTitle;
                    }
                    
                    addToHistory({
                        title: "编辑",
                        content: `修改了章节标题：${newTitle}`
                    });
                }
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
        const nodeId = parseInt(titleElement.dataset.id);
        
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
            const targetNode = gameState.storyTree.find(n => n.id === nodeId);
            if (targetNode) {
                // 如果是当前节点，更新内容
                generateDetailedContent(nodeTitle).then(detailedContent => {
                    targetNode.content = detailedContent;
                    
                    // 如果正在查看当前节点，更新显示
                    if (currentStoryNode.id === nodeId) {
                        document.getElementById('storyText').textContent = detailedContent;
                    }
                    
                    // 标记内容为可编辑
                    targetNode.editable = true;
                    
                    saveGameState(); // 保存状态
                    
                    addToHistory({
                        title: "生成内容",
                        content: `为"${nodeTitle}"生成了详细内容`
                    });
                });
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
        const nodeId = parseInt(this.querySelector('.tree-node-title').dataset.id);
        
        // 从storyTree中找到对应节点
        let targetNode = gameState.storyTree.find(node => node.id === nodeId);
        
        if (!targetNode) {
            // 如果节点不存在，使用模拟数据
            targetNode = {
                id: nodeId,
                title: this.querySelector('.tree-node-title').textContent,
                content: `这是${this.querySelector('.tree-node-title').textContent}的内容...`,
                editable: true,
                choices: []
            };
            
            // 添加到storyTree
            gameState.storyTree.push(targetNode);
            saveGameState(); // 保存状态
        }
        
        currentStoryNode = targetNode;
        updateStoryDisplay(targetNode);
        
        addToHistory({
            title: "切换章节",
            content: `切换到"${targetNode.title}"`
        });
    });
    
    // 将节点添加到storyTree（如果不存在）
    if (!gameState.storyTree.some(n => n.id === node.id)) {
        gameState.storyTree.push(node);
        saveGameState(); // 保存状态
    }
    
    return nodeElement;
}
function showLoading(show, message = "处理中...") {
    // 获取或创建加载覆盖层
    let loadingOverlay = document.getElementById('loadingOverlay');
    let loadingMessage = document.getElementById('loadingMessage');
    
    // 如果不存在则创建
    if (!loadingOverlay) {
        // 创建加载覆盖层
        loadingOverlay = document.createElement('div');
        loadingOverlay.id = 'loadingOverlay';
        loadingOverlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.7);
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            z-index: 1000;
            color: white;
            font-size: 1.2rem;
        `;
        
        // 创建旋转图标
        const spinner = document.createElement('div');
        spinner.className = 'spinner';
        spinner.style.cssText = `
            border: 4px solid rgba(255,255,255,0.3);
            border-radius: 50%;
            border-top: 4px solid #fff;
            width: 40px;
            height: 40px;
            animation: spin 1s linear infinite;
            margin-bottom: 20px;
        `;
        
        // 创建消息元素
        loadingMessage = document.createElement('div');
        loadingMessage.id = 'loadingMessage';
        loadingMessage.textContent = message;
        
        // 组装元素
        loadingOverlay.appendChild(spinner);
        loadingOverlay.appendChild(loadingMessage);
        document.body.appendChild(loadingOverlay);
    } else {
        // 如果已存在，获取消息元素
        loadingMessage = document.getElementById('loadingMessage');
    }
    
    if (show) {
        // 更新消息内容
        if (loadingMessage) {
            loadingMessage.textContent = message;
        }
        loadingOverlay.style.display = 'flex';
    } else {
        loadingOverlay.style.display = 'none';
    }
}
async function handleTitleChange(chapterId, newTitle) {
    if (isRegenerating) {
        showToast("系统正在处理中，请稍后再试", true);
        return;
    }
    
    isRegenerating = true;
    const loadingMessage = `正在更新章节 ${chapterId} 及后续内容...`;
    showLoading(true, loadingMessage);
    
    try {
        // 1. 更新当前章节标题
        const currentChapter = gameState.storyTree.find(c => c.id === chapterId);
        if (!currentChapter) {
            throw new Error(`未找到章节 ${chapterId}`);
        }
        
        // 保存原始标题用于回滚
        const originalTitle = currentChapter.title;
        currentChapter.title = newTitle;
        
        // 更新UI中的标题
        const treeTitle = document.querySelector(`.tree-node-title[data-id="${chapterId}"]`);
        if (treeTitle) {
            treeTitle.textContent = newTitle;
        }
        
        if (currentStoryNode.id === chapterId) {
            document.getElementById('currentStageTitle').textContent = newTitle;
            document.getElementById('currentChapter').textContent = newTitle;
        }
        
        // 2. 重新生成当前章节内容
        showLoading(true, `${loadingMessage}\n正在重新生成当前章节内容...`);
        
        const newContent = await regenerateChapterContent(currentChapter, true);
        currentChapter.content = newContent;
        
        // 更新UI
        if (currentStoryNode.id === chapterId) {
            document.getElementById('storyText').textContent = newContent;
        }
        
        // 3. 重新生成后续章节
        const nextChapters = gameState.storyTree
            .filter(c => c.id > chapterId)
            .sort((a, b) => a.id - b.id); // 确保按顺序处理
        
            try {
                // 重新生成整个章节（标题和内容）
                const result = await regenerateChapter(currentChapter.id+1);
                
                // // 更新章节的标题和内容
                // chapter.title = result.title;
                // chapter.content = result.content;
                
                // 更新左侧树中的标题
                // const nextTreeTitle = document.querySelector(`.tree-node-title[data-id="${chapter.id}"]`);
                // if (nextTreeTitle) {
                //     nextTreeTitle.textContent = result.title;
                // }
                
                // // 如果当前正在查看该章节，更新显示
                // if (currentStoryNode.id === chapter.id) {
                //     document.getElementById('currentStageTitle').textContent = result.title;
                //     document.getElementById('currentChapter').textContent = result.title;
                //     document.getElementById('storyText').textContent = result.content;
                // }
                
                // // 添加历史记录
                // addToHistory({
                //     title: "连锁更新",
                //     content: `章节 ${chapter.id} 已更新: ${result.title}`
                // });
            } catch (error) {
                // console.error(`更新章节失败:`, error);
                // addToHistory({
                //     title: "更新失败",
                //     content: `章节更新失败: ${error.message}`
                // });
            }
        
        
        // 保存状态
        saveGameState();
        showToast("所有章节已成功更新！");
        
        // 添加成功历史记录
        addToHistory({
            title: "标题更新完成",
            content: `章节 ${chapterId} 标题更新为 "${newTitle}" 并重新生成所有相关章节`
        });
    } catch (error) {
        console.error("标题更新失败:", error);
        
        // 回滚标题更改
        if (currentChapter) {
            currentChapter.title = originalTitle;
            
            const treeTitle = document.querySelector(`.tree-node-title[data-id="${chapterId}"]`);
            if (treeTitle) treeTitle.textContent = originalTitle;
            
            if (currentStoryNode.id === chapterId) {
                document.getElementById('currentStageTitle').textContent = originalTitle;
                document.getElementById('currentChapter').textContent = originalTitle;
            }
        }
        
        showToast("更新失败: " + error.message, true);
        addToHistory({
            title: "更新失败",
            content: `章节 ${chapterId} 标题更新失败: ${error.message}`
        });
    } finally {
        isRegenerating = false;
        showLoading(false);
    }
}

/**
 * 处理内容变化 - 重新生成后续章节
 * @param {number} chapterId 当前章节ID
 */
async function handleContentChange(chapterId) {
    if (isRegenerating) return;
    
    isRegenerating = true;
    showLoading(true, `正在更新后续章节...`);
    
    try {
        // 重新生成后续章节（标题和内容）
        const nextChapters = gameState.storyTree.filter(c => c.id > chapterId);
        for (const chapter of nextChapters) {
            // 重新生成整个章节（标题和内容）
            console.log(8888888888888888888888888888888888888);
            const result = await regenerateChapter(chapter.id);
            
            // 更新章节的标题和内容
            chapter.title = result.title;
            chapter.content = result.content;
            
            // 更新左侧树中的标题
            const treeTitle = document.querySelector(`.tree-node-title[data-id="${chapter.id}"]`);
            if (treeTitle) {
                treeTitle.textContent = result.title;
            }
            
            // 如果当前正在查看该章节，更新显示
            if (currentStoryNode.id === chapter.id) {
                document.getElementById('currentStageTitle').textContent = result.title;
                document.getElementById('currentChapter').textContent = result.title;
                document.getElementById('storyText').textContent = result.content;
            }
            
            addToHistory({
                title: "连锁更新",
                content: `章节 ${chapter.id} 已更新: ${result.title}`
            });
        }
        
        saveGameState();
        showToast("后续章节已成功更新！");
    } catch (error) {
        console.error("内容更新失败:", error);
        showToast("更新失败: " + error.message, true);
    } finally {
        isRegenerating = false;
        showLoading(false);
    }
}
/**
 * 重新生成整个章节（标题和内容）
 * @param {number} chapterId 章节ID
 * @returns {Promise<{title: string, content: string}>} 新标题和内容
 */







// async function regenerateChapter(chapterId) {
//     try {
//         console.log(9999999999999999999999999999999999);
//         // 获取故事背景和角色信息
//         const settingsStr = localStorage.getItem('gameSettings');
//         if (!settingsStr) {
//             throw new Error('未找到创作设定');
//         }
//         const settings = JSON.parse(settingsStr);
        
//         // 获取当前章节
//         const chapter = gameState.storyTree.find(c => c.id === chapterId);
//         if (!chapter) {
//             throw new Error('未找到指定章节');
//         }
        
//         // 收集前面章节的内容（包括最新修改）
//         const previousChapters = gameState.storyTree
//             .filter(c => c.id < chapterId)
//             .map(c => ({
//                 id: c.id,
//                 title: c.title,
//                 content: c.content
//             }));
        
//         // 构建请求参数
//         const payload = {
//             background: settings.background,
//             characters: settings.characters,
//             complexity: settings.complexity || "medium",
//             chapterNumber: chapterId,
//             chapterCount: gameState.storyTree.length,
//             previousChapters: previousChapters,
//         };
//         console.log("重新生成章节请求参数:", payload);

//         // 调用API生成章节内容
//         const response = await fetch("http://localhost:8000/api/generate-later-chapters", {
//             method: 'POST',
//             headers: { 
//                 'Content-Type': 'application/json',
//             },
//             body: JSON.stringify(payload)
//         });
        
//         if (!response.ok) {
//             const errorData = await response.json();
//             throw new Error(errorData.detail || '生成章节内容失败，请稍后重试');
//         }
        
//         const data = await response.json();
        
//         // 确保返回的数据结构正确
//         if (!data || typeof data !== 'object') {
//             throw new Error('API返回无效数据');
//         }
        
//         // 返回标题和内容
//         return {
//             title: data.title || `第${chapterId}章`,
//             content: data.content || `这是第${chapterId}章的内容...`
//         };
//     } catch (error) {
//         console.error(`重新生成章节 ${chapterId} 失败:`, error);
//         throw error; // 重新抛出错误
//     }
// }




async function regenerateChapter(chapterId) {

    console.log("aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa");
    try {
        // 获取故事背景和角色信息
        const settingsStr = localStorage.getItem('gameSettings');
        if (!settingsStr) {
            throw new Error('未找到创作设定');
        }
        const settings = JSON.parse(settingsStr);
        
        // 获取当前章节
        const chapter = gameState.storyTree.find(c => c.id === chapterId);
        if (!chapter) {
            throw new Error('未找到指定章节');
        }
        
        // 收集前面章节的内容（仅包含已生成内容的章节）
        const previousChapters = gameState.storyTree
            .filter(c => c.id < chapterId && c.content) // 过滤掉无内容的章节
            .map(c => ({
                id: c.id,
                title: c.title,
                content: c.content
            }));
        
        // 构建请求参数（与后端模型匹配）
        const payload = {
            background: settings.background,
            characters: settings.characters,
            complexity: settings.complexity || "medium",
            chapterNumber: chapterId,
            chapterCount: gameState.storyTree.length,
            previousChapters: previousChapters
        };
        console.log("重新生成章节请求参数:", payload);

        // 调用API生成当前及后续章节
        const response = await fetch("http://localhost:8000/api/generate-later-chapters", {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload)
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || `生成章节失败（${response.status}）`);
        }
        
        const result = await response.json();
        
        // 验证返回的章节数据
        if (!result.chapters || !Array.isArray(result.chapters)) {
            throw new Error('API返回格式错误，未找到章节列表');
        }
        
        // 更新游戏状态中的章节数据（覆盖当前及后续章节）
        result.chapters.forEach(generatedChapter => {
            const targetIndex = gameState.storyTree.findIndex(c => c.id === generatedChapter.id);
            if (targetIndex > -1) {
                // 替换已有章节
                gameState.storyTree[targetIndex] = {
                    ...gameState.storyTree[targetIndex],
                    ...generatedChapter
                };
            } else {
                // 新增章节（如果返回了超出原长度的章节）
                gameState.storyTree.push(generatedChapter);
            }
        });
        
        // 保存更新后的游戏状态
        // saveGameState();
        
        // 调用渲染函数更新左侧剧情树
        renderChapterTitles(gameState.storyTree);
        
        // 返回当前章节的生成结果（供调用处更新内容展示）
        const currentChapter = result.chapters.find(c => c.id === chapterId);
        if (currentChapter) {
            return {
                title: currentChapter.title,
                content: currentChapter.content
            };
        } else {
            throw new Error(`未生成章节ID为${chapterId}的内容`);
        }
        
    } catch (error) {
        console.error(`重新生成章节 ${chapterId} 失败:`, error);
        showToast(`生成失败：${error.message}`, true);
        throw error; // 重新抛出错误，供上层处理
    }
}





// /**
//  * 处理文本内容修改并触发后续章节更新
//  * @param {number} chapterId 当前章节ID
//  * @param {string} inputContent 用户输入的新内容
//  */
// async function handleTextChange1(chapterId, inputContent) {
//     if (isRegenerating) {
//         showToast("系统正在处理中，请稍后再试", true);
//         return;
//     }
    
//     isRegenerating = true;
//     const loadingMessage = `正在更新章节 ${chapterId} 及后续内容...`;
//     showLoading(true, loadingMessage);
    
//     try {
//         // 1. 更新当前章节内容
//         const currentChapter = gameState.storyTree.find(c => c.id === chapterId);
//         if (!currentChapter) {
//             throw new Error(`未找到章节 ${chapterId}`);
//         }
        
//         // 保存原始内容用于回滚
//         const originalContent = currentChapter.content;
//         currentChapter.content = inputContent;
        
//         // 更新UI中的内容
//         if (currentStoryNode.id === chapterId) {
//             document.getElementById('storyText').textContent = inputContent;
//         }
        
//         // 2. 重新生成当前及后续章节
//         showLoading(true, `${loadingMessage}\n正在根据新内容生成后续章节...`);
        
//         // 调用 regenerateText 函数生成新内容
//         const result = await regenerateText(chapterId, inputContent);
        
//         // 3. 更新章节数据
//         result.chapters.forEach(generatedChapter => {
//             const targetIndex = gameState.storyTree.findIndex(c => c.id === generatedChapter.id);
//             if (targetIndex > -1) {
//                 // 更新已有章节
//                 gameState.storyTree[targetIndex] = {
//                     ...gameState.storyTree[targetIndex],
//                     ...generatedChapter,
//                     generated: true // 标记为已生成
//                 };
//             } else {
//                 // 添加新章节
//                 gameState.storyTree.push({
//                     ...generatedChapter,
//                     generated: true
//                 });
//             }
//         });
        
//         // 4. 更新UI
//         renderChapterTitles(gameState.storyTree);
        
//         // 如果当前查看的是被更新的章节，刷新显示
//         if (currentStoryNode.id >= chapterId) {
//             const updatedChapter = gameState.storyTree.find(c => c.id === currentStoryNode.id);
//             if (updatedChapter) {
//                 document.getElementById('storyText').textContent = updatedChapter.content;
//             }
//         }
        
//         // 保存状态
//         saveGameState();
//         showToast("章节已成功更新！");
        
//         // 添加成功历史记录
//         addToHistory({
//             title: "内容更新完成",
//             content: `章节 ${chapterId} 内容已更新并重新生成相关章节`
//         });
        
//     } catch (error) {
//         console.error("内容更新失败:", error);
        
//         // 回滚内容更改
//         if (currentChapter) {
//             currentChapter.content = originalContent;
            
//             if (currentStoryNode.id === chapterId) {
//                 document.getElementById('storyText').textContent = originalContent;
//             }
//         }
        
//         showToast("更新失败: " + error.message, true);
//         addToHistory({
//             title: "更新失败",
//             content: `章节 ${chapterId} 内容更新失败: ${error.message}`
//         });
//     } finally {
//         isRegenerating = false;
//         showLoading(false);
//     }
// }

// /**
//  * 根据用户输入内容生成当前及后续章节
//  * @param {number} chapterId 当前章节ID
//  * @param {string} inputContent 用户输入的新内容
//  * @returns {Promise<{chapters: Array}>} 生成的章节数据
//  */
// async function regenerateText(chapterId, inputContent) {
//     try {
//         // 获取故事背景和角色信息
//         const settingsStr = localStorage.getItem('gameSettings');
//         if (!settingsStr) {
//             throw new Error('未找到创作设定');
//         }
//         const settings = JSON.parse(settingsStr);
        
//         // 获取当前章节
//         const chapter = gameState.storyTree.find(c => c.id === chapterId);
//         if (!chapter) {
//             throw new Error('未找到指定章节');
//         }
        
//         // 收集前面章节的内容（包括当前修改的内容）
//         const previousChapters = gameState.storyTree
//             .filter(c => c.id <= chapterId && c.content) // 包含当前章节（使用修改后的内容）
//             .map(c => ({
//                 id: c.id,
//                 title: c.title,
//                 content: c.id === c.content 
//             }));
        
//         // 构建请求参数（包含用户输入内容）
//         const payload = {
//             background: settings.background,
//             characters: settings.characters,
//             complexity: settings.complexity || "medium",
//             chapterNumber: chapterId,
//             chapterCount: gameState.storyTree.length,
//             currentInput: inputContent, // 新增：用户输入的内容
//             previousChapters: previousChapters // 前置章节内容（含当前修改）
//         };
        
//         console.log("重新生成章节请求参数:", payload);
        
//         // 调用API生成当前及后续章节
//         const response = await fetch("http://localhost:8000/api/generate-text-change", {
//             method: 'POST',
//             headers: { 
//                 'Content-Type': 'application/json',
//             },
//             body: JSON.stringify(payload)
//         });
        
//         if (!response.ok) {
//             const errorData = await response.json();
//             throw new Error(errorData.detail || `生成章节失败（${response.status}）`);
//         }
        
//         const result = await response.json();
        
//         // 验证返回的章节数据
//         if (!result.chapters || !Array.isArray(result.chapters)) {
//             throw new Error('API返回格式错误，未找到章节列表');
//         }
        
//         return result;
        
//     } catch (error) {
//         console.error(`根据输入内容生成章节失败:`, error);
//         showToast(`生成失败：${error.message}`, true);
//         throw error; // 重新抛出错误，供上层处理
//     }
// }



















async function regenerateChapterContent(chapter, useNewTitle = false) {
    try {
        // 获取故事背景和角色信息
        const settingsStr = localStorage.getItem('gameSettings');
        if (!settingsStr) {
            throw new Error('未找到创作设定');
        }
        const settings = JSON.parse(settingsStr);
        
        // 收集前面章节的内容
        const previousChapters = gameState.storyTree
            .filter(c => c.id < chapter.id && c.content)
            .map(c => ({
                title: c.title,
                content: c.content
            }));
        
        // 构建请求参数
        const payload = {
            background: settings.background,
            characters: settings.characters,
            complexity: settings.complexity || "medium",
            chapterNumber: chapter.id,
            chapterCount: gameState.storyTree.length,
            currentChapterTitle: useNewTitle ? chapter.title : "",
            previousChapters: previousChapters
        };
        
        console.log("重新生成章节内容请求参数:", payload);
        // 调用API生成章节内容
        const response = await fetch("http://localhost:8000/api/generate-specific-chapter", {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload)
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || '生成章节内容失败，请稍后重试');
        }
        
        const data = await response.json();
        
        // 确保返回的内容有效
        return data.content || `这是第${chapter.id}章的内容...`;
    } catch (error) {
        console.error(`重新生成章节 ${chapter.id} 内容失败:`, error);
        throw error; // 重新抛出错误
    }
}
function showToast(message, isError = false) {
    // 移除现有的通知
    const existingToast = document.querySelector('.custom-toast');
    if (existingToast) existingToast.remove();
    
    // 创建新的通知
    const toast = document.createElement('div');
    toast.className = `custom-toast ${isError ? 'error' : 'success'}`;
    toast.textContent = message;
    toast.style = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 25px;
        background: ${isError ? '#ff6b6b' : '#51cf66'};
        color: white;
        border-radius: 5px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 10000;
        animation: fadeIn 0.3s, fadeOut 0.3s 2.7s;
    `;
    
    document.body.appendChild(toast);
    
    // 3秒后移除通知
    setTimeout(() => {
        toast.remove();
    }, 3000);
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
            document.getElementById('currentChapter').textContent = input.value;
            
            // 更新左侧树中的标题
            const treeTitle = document.querySelector(`.tree-node-title[data-id="${currentStoryNode.id}"]`);
            if (treeTitle) {
                treeTitle.textContent = input.value;
            }
            
            modal.classList.remove('active');
            
            saveGameState(); // 保存状态
            
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
            
            saveGameState(); // 保存状态
            
            addToHistory({
                title: "编辑",
                content: "修改了剧情内容"
            });
        };
    });

    // // 关闭模态框
    // document.querySelector('.close-modal').addEventListener('click', () => {
    //     document.getElementById('editModal').class.classList.remove('active');
    // });
    
    // document.querySelector('.cancel-modal-btn').addEventListener('click', () => {
    //     document.getElementById('editModal').class.classList.remove('active');
    // });
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
        
        saveGameState(); // 保存状态
        
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
    return `test.png`;
}


// 在文档加载完成后初始化游戏
document.addEventListener('DOMContentLoaded', async () => {
    // 1. 获取创作设定
    const settingsStr = localStorage.getItem('gameSettings');
    const settingInfoDiv = document.getElementById('create-text-step-2');

    if (!settingsStr) {
        settingInfoDiv.innerHTML = `<span class="text-danger">未找到创作设定，请返回设置页面重新填写。</span>`;
        return;
    }
    const settings = JSON.parse(settingsStr);
    console.log(settingsStr, "settingsStr");


    const treeContainer = document.getElementById('storyTree');
    treeContainer.style.height = 'calc(100vh - 120px)';
    treeContainer.style.overflowY = 'auto';

    // 2. 展示设定信息
    // settingInfoDiv.innerHTML = `
    //     <div><span class="font-medium">故事背景：</span>${settings.background || '<span class="text-danger">未填写</span>'}</div>
    //     <div class="mt-2"><span class="font-medium">角色设定：</span>
    //         ${settings.characters && settings.characters.length > 0
    //             ? settings.characters.map(c => `<div class="ml-4"><span class="font-bold">${c.name}</span>：${c.description}</div>`).join('')
    //             : '<span class="text-danger">未填写</span>'}
    //     </div>
    //     <div class="mt-2"><span class="font-medium">复杂度：</span>${settings.complexity || '中等'}</div>
    //     <div class="mt-2"><span class="font-medium">章节数：</span>${settings.chapterCount || 5}</div>
    // `;
    // 3. 构造大模型请求参数
    const payload = {
        background: settings.background,
        characters: settings.characters,
        chapterCount: settings.chapterCount,
        chapterLength: 1000,
    };

    // 4. 显示加载提示
    treeContainer.innerHTML = `<div class="text-center py-8 text-lg text-gray-600">
        <i class="fa fa-spinner fa-spin mr-2"></i> 正在生成剧情树，请稍候...
    </div>`;

        // 5. 调用大模型API生成章节标题
        try {
            const response = await fetch("http://localhost:8000/api/generate-chapter-titles", {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload)
            });
            
            if (!response.ok) {
                throw new Error('章节标题生成失败，请稍后重试');
            }
            
            const data = await response.json();
            console.log("章节标题生成成功", data);
            
            // 初始化章节数据，内容为空
            const chapters = data.titles.map((title, index) => ({
                id: index + 1,
                title: title,
                content: '',
                editable: true,
                generated: false,  // 标记章节内容是否已生成
                choices: []
            }));
            
            // 更新游戏状态
            gameState.storyTree = chapters;
            
            // 保存到本地存储
            saveGameState();
            
            // 渲染章节标题到左侧树
            renderChapterTitles(chapters);
            
            // 默认选中第一章
            if (chapters.length > 0) {
                selectChapter(chapters[0]);
            }
            
        } catch (error) {
            treeContainer.innerHTML = `<div class="text-center py-8 text-danger">
                <i class="fa fa-exclamation-circle mr-2"></i> ${error.message || '章节标题生成失败，请稍后重试。'}
            </div>`;
            console.error(error);
        }
        
        // 初始化编辑功能
        initializeEditFeatures();
        initializeImageGeneration();
        initializeStoryInfoButtons();
    });

    // 渲染章节标题到左侧树
    function renderChapterTitles(chapters) {

        
        const treeContainer = document.getElementById('storyTree');
        treeContainer.innerHTML = ''; // 清空现有内容
        
        chapters.forEach(chapter => {
            const nodeElement = document.createElement('div');
            nodeElement.className = 'tree-node';
            
            // 创建标题元素
            const titleElement = document.createElement('div');
            titleElement.className = 'tree-node-title';
            titleElement.textContent = `第${chapter.id}章：${chapter.title}`;
            titleElement.dataset.id = chapter.id;
            
            // 创建生成按钮
            const generateBtn = document.createElement('button');
            generateBtn.className = 'tree-node-generate';
            generateBtn.innerHTML = `<i class="fas fa-magic"></i> 生成内容`;
            generateBtn.title = '生成该章节的详细内容';
            
            // 如果章节内容已生成，修改按钮外观
            if (chapter.generated) {
                generateBtn.innerHTML = `<i class="fas fa-edit"></i> 重新生成`;
                generateBtn.classList.add('generated');
            }
            
            // 组装节点
            nodeElement.appendChild(titleElement);
            nodeElement.appendChild(generateBtn);
            treeContainer.appendChild(nodeElement);
            
            // 添加点击事件 - 选择章节
            titleElement.addEventListener('click', function() {
                const chapterId = parseInt(this.dataset.id);
                const chapter = gameState.storyTree.find(c => c.id === chapterId);
                if (chapter) {
                    selectChapter(chapter);
                }
            });
            
            // 添加生成按钮点击事件
            generateBtn.addEventListener('click', async function(e) {
                e.stopPropagation(); // 防止触发标题选择


                console.log("bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb");
                
                const chapterId = parseInt(titleElement.dataset.id);
                const chapter = gameState.storyTree.find(c => c.id === chapterId);
                
                if (!chapter) return;
                
                // 显示生成中提示
                this.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 生成中...';
                this.disabled = true;
                
                try {
                    // 调用API生成章节内容
                    const content = await generateChapterContent(chapterId);
                    
                    // 更新章节数据
                    chapter.content = content;
                    chapter.generated = true;
                    
                    // 保存到本地存储
                    saveGameState();
                    
                    // 更新UI
                    if (currentStoryNode && currentStoryNode.id === chapterId) {
                        document.getElementById('storyText').textContent = content;
                    }
                    
                    // 修改按钮外观
                    this.innerHTML = `<i class="fas fa-edit"></i> 重新生成`;
                    this.classList.add('generated');
                    this.disabled = false;
                    
                    addToHistory({
                        title: "生成内容",
                        content: `为"第${chapterId}章：${chapter.title}"生成了详细内容`
                    });
                    
                } catch (error) {
                    console.error('生成章节内容失败1113333331:', error);
                    alert('生成章节内容失败222: ' + error.message);
                    
                    // 恢复按钮状态
                    this.innerHTML = `<i class="fas fa-magic"></i> 生成内容`;
                    this.disabled = false;
                }
            });
        });
    }

    // 选择章节
    function selectChapter(chapter) {
        currentStoryNode = chapter;
        
        // 更新显示
        document.getElementById('currentStageTitle').textContent = chapter.title;
        document.getElementById('storyText').textContent = chapter.content || '点击左侧按钮生成此章节内容...';
        document.getElementById('storyText').dataset.nodeId = chapter.id;
        document.getElementById('currentChapter').textContent = chapter.title;
        
        // 高亮当前节点
        document.querySelectorAll('.tree-node').forEach(node => {
            node.classList.remove('active');
        });
        
        const activeNode = document.querySelector(`.tree-node-title[data-id="${chapter.id}"]`);
        if (activeNode) {
            activeNode.parentElement.classList.add('active');
        }
        
        // 生成新的场景图片（如果有内容）
        if (chapter.content) {
            regenerateImage(chapter.content);
        } else {
            document.getElementById('storyImage').src = 'test.png';
        }
        
        // 保存当前章节
        saveGameState();
    }

    // 生成章节内容
    async function generateChapterContent(chapterId) {
    // 获取故事背景和角色信息
    const settingsStr = localStorage.getItem('gameSettings');
    if (!settingsStr) {
        throw new Error('未找到创作设定');
    }
    const settings = JSON.parse(settingsStr);
    
    // 获取当前章节
    const currentChapter = gameState.storyTree.find(c => c.id === chapterId);
    if (!currentChapter) {
        throw new Error('未找到指定章节');
    }
    
    // 收集前面章节的内容（严格匹配后端 ChapterInfo 模型）
    const previousChapters1 = gameState.storyTree
        .filter(c => c.id < chapterId) // 包含所有前置章节（即使内容为空，后端允许空字符串）
        .map(c => ({
            id: c.id, // 必须包含id（后端 ChapterInfo 模型要求）
            title: c.title || `第${c.id}章`, // 确保标题存在，避免空值
            content: c.content || '' // 内容允许为空，但必须有此字段
        }));
    
    // 构建请求参数（严格匹配后端 SpecificChapterRequest 模型）
    const payload1 = {
        background: settings.background || '', // 确保不为undefined
        characters: settings.characters || [], // 确保是数组（后端要求至少包含一个角色）
        complexity: settings.complexity || "medium", // 匹配后端默认值
        chapterNumber: chapterId, // 必须是整数（与后端 int 类型匹配）
        chapterCount: gameState.storyTree.length, // 必须是整数
        currentChapterTitle: currentChapter.title || `第${chapterId}章`, // 确保标题不为空
        previousChapters: previousChapters1 // 严格匹配 ChapterInfo 模型结构
    };

    try {
        // 调用API生成章节内容
        const response = await fetch("http://localhost:8000/api/generate-specific-chapter", {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload1)
        });
        
        if (!response.ok) {
            // 解析后端返回的详细错误信息
            const errorData = await response.json();
            throw new Error(`生成失败：${errorData.detail || '服务器错误'}`);
        }
        
        const data = await response.json();
        return data.content;
        
    } catch (error) {
        console.error(`调用generate-specific-chapter失败：`, error);
        throw error; // 重新抛出错误，供上层处理
    }
}



function initializeModalHandlers() {
    // 关闭按钮事件处理
    document.querySelectorAll('.close-modal').forEach(btn => {
        btn.addEventListener('click', function(e) {
            // 使用 closest 方法确保找到最近的模态框父元素
            const modal = this.closest('.modal');
            if (modal) {
                modal.classList.remove('active');
            }
        });
    });
    
    // 取消按钮事件处理
    document.querySelectorAll('.cancel-modal-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const modal = this.closest('.modal');
            if (modal) {
                modal.classList.remove('active');
            }
        });
    });
    
    // 点击模态框外部关闭
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', function(e) {
            // 确保点击的是模态框背景而不是内容
            if (e.target === this) {
                this.classList.remove('active');
            }
        });
    });
}

// 修复标题编辑逻辑
// 修复标题编辑逻辑
function initializeTitleEditing() {
    // 最左下角的编辑标题按钮点击事件
    document.querySelector('.tree-controls .edit-title-btn').addEventListener('click', function() {
        const modal = document.getElementById('editModal');
        const input = document.getElementById('modalInput');
        const modalTitle = document.getElementById('modalTitle');
        
        // 设置模态框内容
        modalTitle.textContent = '编辑章节标题';
        input.value = currentStoryNode.title;
        modal.classList.add('active');
        
        // 临时保存当前编辑的章节ID
        modal.dataset.currentChapterId = currentStoryNode.id;
    });
    
    // 使用事件委托处理保存按钮点击事件
    document.querySelector('.save-modal-btn').addEventListener('click', function(e) {
        console.log("11111111");
        if (e.target.closest('.save-modal-btn') && document.getElementById('editModal').classList.contains('active')) {
            const modal = document.getElementById('editModal');
            const input = document.getElementById('modalInput');
            const chapterId = parseInt(modal.dataset.currentChapterId);
            
            // 找到当前章节
            const currentChapter = gameState.storyTree.find(c => c.id === chapterId);
            if (!currentChapter) {
                modal.classList.remove('active');
                return;
            }
            
            const originalTitle = currentChapter.title;
            const newTitle = input.value.trim();
            
            if (newTitle && newTitle !== originalTitle) {
                // 更新标题
                currentChapter.title = newTitle;
                document.getElementById('currentStageTitle').textContent = newTitle;
                document.getElementById('currentChapter').textContent = newTitle;
                
                // 更新左侧树中的标题
                const treeTitle = document.querySelector(`.tree-node-title[data-id="${chapterId}"]`);
                if (treeTitle) {
                    treeTitle.textContent = newTitle;
                }
                
                // 调用handleTitleChange生成新内容
                handleTitleChange(chapterId, newTitle);
                
                // handleContentChange(chapterId);

                // 保存游戏状态
                saveGameState();
                
                // 添加历史记录
                addToHistory({
                    title: "编辑标题",
                    content: `修改了章节标题：${newTitle}`
                });
            }
            
            // 关闭模态框
            modal.classList.remove('active');
        }
    });
    
    // 标题元素的点击编辑功能保持，但禁用Enter键保存，只允许手动点击保存
    document.addEventListener('click', function(e) {
        const titleElement = e.target.closest('.tree-node-title');
        if (!titleElement || titleElement.classList.contains('edit-mode')) return;
        
        titleElement.classList.add('edit-mode');
        titleElement.contentEditable = true;
        titleElement.focus();
        
        const originalTitle = titleElement.textContent;
        const nodeId = parseInt(titleElement.dataset.id);
        
        // 完成编辑函数
        const finishEditing = (saveChanges = false) => {
            titleElement.classList.remove('edit-mode');
            titleElement.contentEditable = false;
            
            if (saveChanges && titleElement.textContent.trim() && titleElement.textContent !== originalTitle) {
                const newTitle = titleElement.textContent.trim();
                titleElement.textContent = newTitle;
                
                // 找到对应的节点
                const targetNode = gameState.storyTree.find(n => n.id === nodeId);
                if (targetNode) {
                    targetNode.title = newTitle;
                    saveGameState();
                    
                    // 如果是当前节点，同步更新显示
                    if (currentStoryNode.id === nodeId) {
                        currentStoryNode.title = newTitle;
                        document.getElementById('currentStageTitle').textContent = newTitle;
                        document.getElementById('currentChapter').textContent = newTitle;
                        
                        // 调用handleTitleChange生成新内容
                        handleTitleChange(nodeId, newTitle);
                    }
                    
                    addToHistory({
                        title: "编辑标题",
                        content: `修改了章节标题：${newTitle}`
                    });
                }
            } else {
                // 恢复原始标题
                titleElement.textContent = originalTitle;
            }
        };
        
        // 失去焦点时完成编辑（不自动保存）
        titleElement.addEventListener('blur', () => finishEditing(false), { once: true });
        
        // 键盘事件处理
        titleElement.addEventListener('keydown', function(e) {
            // 禁用Enter键保存，只能通过模态框保存
            if (e.key === 'Enter') {
                e.preventDefault();
                finishEditing(false);
            } else if (e.key === 'Escape') {
                e.preventDefault();
                finishEditing(false);
            }
        }, { once: true });
    });
}
// 等待DOM加载完成
document.addEventListener('DOMContentLoaded', function() {
    // 获取元素引用
    const oldEditTitleBtn = document.querySelector('.tree-controls .edit-title-btn');
    const newEditTitleBtn = oldEditTitleBtn.cloneNode(true);
    oldEditTitleBtn.parentNode.replaceChild(newEditTitleBtn, oldEditTitleBtn);
    initializeTitleEditing();
    
    // 初始化模态框处理
    initializeModalHandlers();
    const editTitleBtn = document.querySelector('.tree-controls .edit-title-btn');
    const stageTitle = document.getElementById('currentStageTitle');
    const storyText = document.getElementById('storyText');
    const editStoryBtn = document.querySelector('.edit-story-btn');
    const editModal = document.getElementById('editModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalInput = document.getElementById('modalInput');
    const saveModalBtn = document.querySelector('.save-modal-btn');
    const cancelModalBtn = document.querySelectorAll('.cancel-modal-btn');
    const closeModalBtn = document.querySelectorAll('.close-modal');
    
    // 当前编辑目标
    let currentEditTarget = null;
    
    // 打开模态框的函数
    function openModal(title, content, target) {
        modalTitle.textContent = title;
        modalInput.value = content;
        currentEditTarget = target;
        editModal.style.display = 'block';
        // 聚焦到输入框
        setTimeout(() => modalInput.focus(), 100);
    }
    
    // 关闭模态框的函数
    function closeModal() {
        editModal.style.display = 'none';
        currentEditTarget = null;
    }
    
    // 保存编辑内容
    function saveEditContent() {
        if (currentEditTarget && modalInput.value.trim() !== '') {
            // 更新目标内容
            currentEditTarget.textContent = modalInput.value.trim();
            
            // 更新游戏状态
            if (currentEditTarget === stageTitle) {
                currentStoryNode.title = modalInput.value.trim();
                
                // 更新左侧树中的标题
                const treeTitle = document.querySelector(`.tree-node-title[data-id="${currentStoryNode.id}"]`);
                if (treeTitle) {
                    treeTitle.textContent = modalInput.value.trim();
                }
            } else {
                currentStoryNode.content = modalInput.value.trim();
            }
            
            // 保存状态
            saveGameState();
            
            // 记录修改历史
            addEditHistory(currentEditTarget === stageTitle ? '标题' : '剧情内容', modalInput.value.trim());
            
            // 关闭模态框
            closeModal();
        } else if (modalInput.value.trim() === '') {
            alert('内容不能为空');
        }
    }
    
    // 添加修改历史记录
    function addEditHistory(type, content) {
        const historyContent = document.getElementById('storyHistory');
        const timestamp = new Date().toLocaleString();
        const historyItem = document.createElement('div');
        historyItem.className = 'history-item';
        historyItem.innerHTML = `
            <p><strong>${timestamp}</strong> 编辑了${type}</p>
            <p class="history-preview">${content.length > 30 ? content.substring(0, 30) + '...' : content}</p>
        `;
        // 添加到历史记录顶部
        if (historyContent.firstChild) {
            historyContent.insertBefore(historyItem, historyContent.firstChild);
        } else {
            historyContent.appendChild(historyItem);
        }
    }
    setTimeout(() => {
        initializeCustomInput();
    }, 100);
    // 绑定事件监听
    // 最左下角的编辑标题按钮
    editTitleBtn.addEventListener('click', function() {
        openModal('编辑剧情标题', stageTitle.textContent, stageTitle);
    });
    
    // 剧情内容编辑按钮
    editStoryBtn.addEventListener('click', function() {
        openModal('编辑剧情内容', storyText.textContent, storyText);
    });
    
    // 保存按钮
    saveModalBtn.addEventListener('click', saveEditContent);
    
    // 取消按钮
    cancelModalBtn.forEach(btn => {
        btn.addEventListener('click', closeModal);
    });
    
    // 关闭按钮
    closeModalBtn.forEach(btn => {
        btn.addEventListener('click', closeModal);
    });
    
    // 点击模态框外部关闭
    editModal.addEventListener('click', function(e) {
        if (e.target === editModal) {
            closeModal();
        }
    });
    
    // 按Enter键保存，Esc键关闭
    modalInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && e.ctrlKey) {
            // Ctrl+Enter保存
            saveEditContent();
        } else if (e.key === 'Escape') {
            // Esc关闭
            closeModal();
        }
    });
});