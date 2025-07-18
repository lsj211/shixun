import jieba
import jieba.posseg as pseg
from collections import Counter
from typing import List
import hashlib
import os
import json
import time
import asyncio
# 修改导入语句，添加Any
from typing import Dict, List, Optional, Union, AsyncGenerator, Any
from datetime import datetime, timedelta
from pathlib import Path
import re
# 导入 dotenv 用于加载环境变量
try:
    from dotenv import load_dotenv
    load_dotenv()  # 加载 .env 文件中的环境变量
    print("成功加载 .env 文件")
except ImportError:
    print("警告: python-dotenv 未安装，尝试直接使用环境变量")

import nltk
import uvicorn
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

from langchain_community.chat_models.tongyi import ChatTongyi
from langchain.prompts.chat import ChatPromptTemplate, SystemMessagePromptTemplate, HumanMessagePromptTemplate
from langchain_core.messages import HumanMessage, SystemMessage

# 初始化FastAPI应用
app = FastAPI(title="互动小说AI后端服务")

# 配置CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 允许所有来源，生产环境中应该限制
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 获取 API 密钥，先尝试从环境变量获取
DASHSCOPE_API_KEY = os.environ.get("DASHSCOPE_API_KEY")

if not DASHSCOPE_API_KEY:
    # 如果环境变量中没有，则尝试从文件中读取
    try:
        with open('.env', 'r') as f:
            for line in f:
                if line.startswith('DASHSCOPE_API_KEY='):
                    DASHSCOPE_API_KEY = line.split('=', 1)[1].strip()
                    os.environ['DASHSCOPE_API_KEY'] = DASHSCOPE_API_KEY
                    break
    except FileNotFoundError:
        pass

# 如果仍然找不到 API 密钥，则给出明确的错误提示
if not DASHSCOPE_API_KEY:
    print("错误: DASHSCOPE_API_KEY 未设置!")
    print("请确保在 .env 文件中设置了 DASHSCOPE_API_KEY=你的API密钥")
    print("或者设置了系统环境变量 DASHSCOPE_API_KEY")
    print("你可以在 https://dashscope.aliyun.com/ 获取 API 密钥")
else:
    print(f"API 密钥已设置，长度: {len(DASHSCOPE_API_KEY)} 字符")

# 初始化通义千问模型
try:
    chat_model = ChatTongyi(
        api_key=DASHSCOPE_API_KEY,
        model_name="qwen-turbo",
        temperature=0.7,
        top_p=0.8,
        max_tokens=1500,
        streaming=True,  # 开启流式输出
    )
    print("成功初始化通义千问模型")
except Exception as e:
    print(f"初始化通义千问模型失败: {e}")
    raise

# 缓存机制
CACHE_DIR = Path("./cache")
CACHE_DIR.mkdir(exist_ok=True)

def get_cache_file_path(key: str) -> Path:
    """获取缓存文件路径"""
    # 使用MD5哈希来确保文件名有效
    import hashlib
    hashed_key = hashlib.md5(key.encode()).hexdigest()
    return CACHE_DIR / f"{hashed_key}.json"

def save_to_cache(key: str, data: dict) -> None:
    """保存数据到缓存"""
    cache_file = get_cache_file_path(key)
    
    cache_data = {
        "data": data,
        "timestamp": datetime.now().timestamp()
    }
    
    with open(cache_file, "w", encoding="utf-8") as f:
        json.dump(cache_data, f, ensure_ascii=False, indent=2)

def get_from_cache(key: str) -> Optional[dict]:
    """从缓存获取数据"""
    cache_file = get_cache_file_path(key)
    
    if not cache_file.exists():
        return None
    
    try:
        with open(cache_file, "r", encoding="utf-8") as f:
            cache_data = json.load(f)
        
        # 检查是否过期（24小时）
        timestamp = cache_data.get("timestamp", 0)
        if datetime.now() - datetime.fromtimestamp(timestamp) > timedelta(hours=24):
            return None
        
        return cache_data.get("data")
    except Exception as e:
        print(f"读取缓存失败: {e}")
        return None

# 请求模型定义
class BackgroundGenerationRequest(BaseModel):
    background: str
    complexity: str = "medium"
    chapterCount: int = 5

class CharacterGenerationRequest(BaseModel):
    background: str
    complexity: str = "medium"
    characterCount: int = 3

class StoryNodeRequest(BaseModel):
    background: str = ""
    characters: List[Dict[str, str]] = []
    complexity: str = "medium"
    previousContent: Optional[str] = None

# 流式生成函数
async def generate_content_stream(messages, cache_key=None):
    """流式生成内容，并在完成后缓存结果"""
    full_response = ""
    
    # 检查缓存
    if cache_key:
        cached_content = get_from_cache(cache_key)
        if cached_content:
            yield f"data: {json.dumps({'text': cached_content, 'done': True})}\n\n"
            return

    # 流式生成
    async for chunk in chat_model.astream(messages):
        content = chunk.content
        full_response += content
        yield f"data: {json.dumps({'text': content, 'done': False})}\n\n"
    
    # 保存到缓存
    if cache_key:
        save_to_cache(cache_key, full_response)
    
    # 发送完成信号
    yield f"data: {json.dumps({'text': '', 'done': True})}\n\n"

@app.post("/api/generate-background")
async def generate_background(request: BackgroundGenerationRequest):
    """生成故事背景（流式输出）"""
    # 创建缓存键
    cache_key = f"background_{request.background[:50]}_{request.complexity}_{request.chapterCount}"
    
    # 构建提示模板，在系统提示中直接添加字数和格式限制
    system_template = (
        "作为一个专业的互动小说创作者，请基于以下简短描述，创建一个故事背景和世界观设定。\n\n"
        "请严格遵守以下要求：\n"
        "1. 仅提供世界观相关内容，不要包含任何故事情节或剧情内容\n"
        "2. 世界观设定：限制在200字以内，仅描述故事发生的背景环境、社会结构、规则系统等\n"
        "3. 前情提要：每个事件不超过100字，仅提供故事发生前的关键剧情事件\n"
        "4. 重要地点：每个地点格式为\"重要地点: 地点名称\" + \"描述: 地点描述\"，描述不超过200字\n\n"
        
        "格式要求：\n"
        "1. 世界观：纯文本段落，不使用标题或编号\n"
        "2. 前情提要：每个事件格式为\"前情提要: 事件名称\" + \"描述: 事件描述\"\n"
        "3. 重要地点：每个地点格式为\"重要地点: 地点名称\" + \"描述: 地点描述\"\n\n"
        
        "请严格遵循以上格式，前情提要一定要是前情提要：标题：内容：，重要地点一定要是重要地点：名称：描述：，不要添加其他内容或解释，确保内容简洁精炼。"
    )
    
    human_template = (
        f"基础描述: {request.background}\n\n"
        f"故事复杂度: {request.complexity} (简单/中等/复杂)\n"
        f"计划章节数: {request.chapterCount}章\n\n"
        f"请先生成世界观设定(200字以内)，然后生成2-3个前情提要(每个100字以内)，最后生成2-3个重要地点(名称+描述格式，描述200字以内)"
    )
    
    messages = [
        SystemMessage(content=system_template),
        HumanMessage(content=human_template)
    ]
    
    return StreamingResponse(
        generate_content_stream(messages, cache_key),
        media_type="text/event-stream"
    )

# 在请求模型定义部分添加
class BackgroundEnhanceRequest(BaseModel):
    background: str
    complexity: str = "medium"
    chapterCount: int = 5
    enhance_only: bool = True

# 添加这个API端点
@app.post("/api/enhance-background")
async def enhance_background(request: BackgroundEnhanceRequest):
    """简单拓展故事背景（流式输出）- 仅用于设置页面"""
    # 创建缓存键
    cache_key = f"enhance_{request.background[:50]}_{request.complexity}_{request.chapterCount}"
    
    # 检查缓存
    cached_content = get_from_cache(cache_key)
    if cached_content:
        # 如果有缓存，创建一个模拟流式输出
        async def stream_cached_content():
            yield f"data: {json.dumps({'text': cached_content})}\n\n"
            yield f"data: {json.dumps({'done': True})}\n\n"
        
        return StreamingResponse(
            stream_cached_content(),
            media_type="text/event-stream"
        )
    
    # 构建提示模板 - 简化版，仅用于背景拓展
    system_template = (
        "你是一位富有创造力的互动小说背景设计师。请基于用户提供的简短描述，拓展并丰富这个故事背景。\n\n"
        "要求：\n"
        "1. 生成一段200-300字的连贯段落，不要分段\n"
        "2. 只拓展背景设定，不要创建具体角色或情节\n"
        "3. 保留用户原始描述的核心要素和风格\n"
        "4. 不要使用标题、序号或分类\n"
        "5. 不要超出一个段落\n"
        "6. 不要添加前情提要或地点描述\n"
        f"7. 故事复杂度应为{request.complexity}级别\n"
        f"8. 故事应该设计为适合{request.chapterCount}章节的长度\n\n"
        
        "重要：直接输出拓展后的背景描述，不要添加任何前缀、注释或解释。"
    )
    
    human_template = (
        f"原始背景描述: {request.background}\n\n"
        f"复杂度: {request.complexity} (简单/中等/复杂)\n"
        f"计划章节数: {request.chapterCount}章\n\n"
        f"请将这个简短描述拓展为一个更丰富、更具体的世界背景描述，适合{request.complexity}复杂度和{request.chapterCount}章节的故事。"
    )
    
    messages = [
        SystemMessage(content=system_template),
        HumanMessage(content=human_template)
    ]
    
    # 使用通用的流式生成函数
    return StreamingResponse(
        generate_content_stream(messages, cache_key),
        media_type="text/event-stream"
    )

@app.post("/api/generate-characters")
async def generate_characters(request: CharacterGenerationRequest):
    """生成角色（非流式输出）"""
    try:
        # 创建缓存键
        cache_key = f"characters_{request.background[:50]}_{request.complexity}_{request.characterCount}"
        
        # 检查缓存
        cached_content = get_from_cache(cache_key)
        if cached_content:
            return {"characters": cached_content}
        
        # 构建提示模板
        system_template = (
            "你是一位专业的互动小说角色设计师。请根据提供的故事背景设计多个有深度的角色。"
            "对于每个角色，提供以下信息：\n"
            "1. 角色名称\n"
            "2. 角色身份/职业\n"
            "3. 详细的性格特点\n"
            "4. 背景故事\n"
            "5. 与其他角色的关系或在故事中的作用\n\n"
            "请以以下JSON格式返回角色信息，确保它是有效的JSON：\n"
            "[\n"
            "  {\n"
            "    \"name\": \"角色名称\",\n"
            "    \"description\": \"完整的角色描述包括身份、性格、背景故事和关系\"\n"
            "  },\n"
            "  {\n"
            "    \"name\": \"角色2名称\",\n"
            "    \"description\": \"角色2的完整描述\"\n"
            "  }\n"
            "]\n\n"
            "确保输出是有效的JSON格式，不要包含额外的解释文本。角色数量应为" + str(request.characterCount) + "个。"
        )
        
        human_template = (
            f"故事背景: {request.background}\n\n"
            f"故事复杂度: {request.complexity} (简单/中等/复杂)\n\n"
            f"请创建{request.characterCount}个角色"
        )
        
        messages = [
            SystemMessage(content=system_template),
            HumanMessage(content=human_template)
        ]
        
        # 调用模型（非流式方式）
        try:
            # 使用non-streaming版本的调用
            response = chat_model(messages)
            content = response.content
            
            # 尝试解析为JSON
            import json
            import re
            
            # 尝试找到JSON数组
            json_match = re.search(r'\[\s*\{.*\}\s*\]', content, re.DOTALL)
            
            if json_match:
                characters_json = json_match.group(0)
                characters = json.loads(characters_json)
            else:
                # 如果无法提取JSON，创建默认角色
                characters = [
                    {
                        "name": "主角",
                        "description": "这是故事的主角。基于背景：" + request.background[:100]
                    },
                    {
                        "name": "配角",
                        "description": "这是故事的配角。"
                    },
                    {
                        "name": "反派",
                        "description": "这是故事的反派角色。"
                    }
                ]
            
            # 保存到缓存
            save_to_cache(cache_key, characters)
            
            return {"characters": characters}
        except Exception as e:
            print(f"模型调用或解析失败: {e}")
            
            # 返回默认角色
            default_characters = [
                {
                    "name": "主角",
                    "description": "这是故事的主角。基于背景：" + request.background[:100]
                },
                {
                    "name": "配角",
                    "description": "这是故事的配角。"
                },
                {
                    "name": "反派",
                    "description": "这是故事的反派角色。"
                }
            ]
            
            # 保存到缓存
            save_to_cache(cache_key, default_characters)
            
            return {"characters": default_characters}
            
    except Exception as e:
        print(f"角色生成过程失败: {e}")
        raise HTTPException(status_code=500, detail=f"角色生成失败: {str(e)}")

@app.post("/api/generate-story-node")
async def generate_story_node(request: StoryNodeRequest):
    """生成剧情节点（流式输出）"""
    # 创建缓存键
    previous_content_key = request.previousContent[:30] if request.previousContent else "start"
    cache_key = f"story_node_{previous_content_key}_{request.complexity}"
    
    # 准备角色信息字符串
    characters_info = ""
    if request.characters:
        characters_info = "\n\n".join(
            f"角色名：{char.get('name', '未命名')}\n描述：{char.get('description', '无描述')}" 
            for char in request.characters
        )
    
    # 构建提示模板
    system_template = (
        "你是一位专业的互动小说创作者。请根据提供的故事背景和角色信息，创作一个引人入胜的剧情节点。\n\n"
        "请确保你的内容：\n"
        "1. 符合故事背景和角色设定\n"
        "2. 具有情感深度和冲突\n"
        "3. 为读者提供明确的选择点\n"
        "4. 叙述生动且引人入胜\n\n"
        "在剧情结束时，提供2-4个有意义的选择，这些选择应该代表不同的行动方向或决策，并会导致不同的后果。"
    )
    
    # 填充提示模板
    previous_content_text = f"前一个节点内容：{request.previousContent}" if request.previousContent else "这是故事的开始"
    human_template = (
        f"故事背景: {request.background or '一个充满冒险的奇幻世界'}\n\n"
        f"角色信息:\n{characters_info or '主角是一位勇敢的冒险家'}\n\n"
        f"故事复杂度: {request.complexity} (简单/中等/复杂)\n\n"
        f"{previous_content_text}\n\n"
        f"请创作一个新的剧情节点，并在结尾提供2-4个选择选项。"
    )
    
    messages = [
        SystemMessage(content=system_template),
        HumanMessage(content=human_template)
    ]
    
    return StreamingResponse(
        generate_content_stream(messages, cache_key),
        media_type="text/event-stream"
    )

@app.get("/")
async def root():
    """API根路径，返回服务状态"""
    return {
        "status": "online",
        "service": "互动小说AI后端服务",
        "version": "1.0.0",
        "endpoints": [
            "/api/generate-background",
            "/api/generate-characters",
            "/api/generate-story-node",
            "/api/generate-story-title"
        ]
    }

# 添加新的请求模型
class StoryOutlineRequest(BaseModel):
    background: str
    timeline: List[Dict[str, str]] = []
    locations: List[Dict[str, str]] = []
    characters: List[Dict[str, Any]] = []
    chapterCount: int = 5
    complexity: str = "medium"

class ChapterRequest(BaseModel):
    background: str
    timeline: List[Dict[str, str]] = []
    locations: List[Dict[str, str]] = []
    characters: List[Dict[str, Any]] = []
    complexity: str = "medium"
    chapterNumber: int = 1
    sceneNumber: int = 1
    outline: str = ""

# 生成故事大纲API
@app.post("/api/generate-story-outline")
async def generate_story_outline(request: StoryOutlineRequest):
    """生成故事大纲"""
    # 创建缓存键
    cache_key = f"outline_{request.background[:50]}_{request.complexity}_{request.chapterCount}"
    
    # 检查缓存
    cached_content = get_from_cache(cache_key)
    if cached_content:
        return {"outline": cached_content}
    
    # 构建提示模板
    system_template = (
        "你是一位专业的交互式小说大纲设计师。请根据提供的世界观背景、前情提要、重要地点和角色信息，"
        f"创建一个{request.chapterCount}章的故事大纲。\n\n"
        "请遵循以下要求：\n"
        "1. 大纲应该包含每章的主要内容概述\n"
        "2. 每章应包含2-3个关键场景\n"
        "3. 标明每章涉及的主要角色\n"
        "4. 在大纲中设计合理的冲突和转折\n"
        "5. 大纲应该与提供的背景设定保持一致\n"
        f"6. 按照{request.complexity}级别的复杂度设计情节\n"
        "7. 根据角色的特性设计合适的情节和角色互动\n\n"
        "大纲格式请严格按如下格式输出：\n"
        "第一章：[章节标题]\n"
        "- 场景概述：[场景1概述]\n"
        "- 场景概述：[场景2概述]\n"
        "- 涉及角色：[角色列表]\n"
        "- 关键事件：[事件描述]\n\n"
        "第二章：[章节标题]\n"
        "... 以此类推\n\n"
        "确保大纲具有连贯性和叙事张力，为后续章节内容生成提供足够的指导。"
    )
    
    human_template = (
        f"世界背景：{request.background}\n\n"
        f"前情提要：\n{format_timeline(request.timeline)}\n\n"
        f"重要地点：\n{format_locations(request.locations)}\n\n"
        f"角色信息：\n{format_characters(request.characters)}\n\n"
        f"章节数量：{request.chapterCount}章\n"
        f"故事复杂度：{request.complexity} (简单/中等/复杂)\n\n"
        f"请为这个故事世界创建一个{request.chapterCount}章的完整大纲。"
    )
    
    messages = [
        SystemMessage(content=system_template),
        HumanMessage(content=human_template)
    ]
    
    try:
        response = await chat_model.ainvoke(messages)
        outline = response.content
        
        # 保存到缓存
        save_to_cache(cache_key, outline)
        
        return {"outline": outline}
    except Exception as e:
        print(f"生成大纲失败: {e}")
        raise HTTPException(status_code=500, detail=f"生成大纲失败: {str(e)}")
    


class StoryTitleRequest(BaseModel):
    """生成小说标题的请求模型"""
    outline: str = Field(..., description="完整的故事大纲文本")

# 生成小说题目API
@app.post("/api/generate-story-title")
async def generate_story_title(request: StoryTitleRequest):
    """根据故事大纲生成小说题目"""
    # 创建缓存键
    cache_key = f"title_{hashlib.md5(request.outline[:100].encode()).hexdigest()}"
    
    # 检查缓存
    cached_title = get_from_cache(cache_key)
    if cached_title:
        return {"title": cached_title}
    
    # 从大纲中提取关键信息
    main_themes = extract_themes_from_outline(request.outline)
    tone = analyze_tone(request.outline)
    genre = infer_genre(request.outline)
    
    # 提取主要主题
    themes_text = ", ".join(main_themes[:3]) if main_themes else "故事"
    
    # 构建提示模板
    system_template = (
        "你是一位富有创意的小说标题设计师。根据提供的故事大纲，创作一个吸引人的小说标题。\n\n"
        "标题应符合以下要求：\n"
        "1. 反映故事的核心主题或主要情节\n"
        "2. 与故事的基调(如悬疑/奇幻/爱情)相匹配\n"
        "3. 具有一定的吸引力和独特性\n"
        "4. 长度适中(5-15个字为宜)\n\n"
        "返回格式：\n"
        "主标题 | 副标题(如果有)"
    )
    
    human_template = (
        f"故事大纲：{request.outline[:500]}...\n\n"
        f"从大纲中提取的主题：{themes_text}\n"
        f"推断的故事基调：{tone}\n"
        f"推断的故事类型：{genre}\n\n"
        f"请为这个故事创作一个合适的标题。"
    )
    
    messages = [
        SystemMessage(content=system_template),
        HumanMessage(content=human_template)
    ]
    
    try:
        response = await chat_model.ainvoke(messages)
        title = response.content.strip()
        
        # 保存到缓存
        save_to_cache(cache_key, title)
        
        return {"title": title}
    except Exception as e:
        print(f"生成标题失败: {e}")
        raise HTTPException(status_code=500, detail=f"生成标题失败: {str(e)}")

# 辅助函数：从大纲中提取主题
def extract_themes_from_outline(outline: str) -> List[str]:
    # 使用 jieba 分词并进行词性标注
    words = pseg.cut(outline)
    # 提取名词（n: 名词, nr: 人名, ns: 地名, nt: 机构团体, nz: 其他专有名词）
    nouns = [word for word, flag in words if flag.startswith('n')]
    # 统计词频
    freq_dist = Counter(nouns)
    # 返回出现频率最高的前5个主题词
    return [word for word, freq in freq_dist.most_common(5)]

# 辅助函数：分析大纲的基调
def analyze_tone(outline: str) -> str:
    # 简单实现：基于关键词判断基调
    if "神秘" in outline or "悬疑" in outline or "谜题" in outline:
        return "悬疑"
    elif "爱情" in outline or "浪漫" in outline or "心动" in outline:
        return "爱情"
    elif "冒险" in outline or "旅程" in outline or "探索" in outline:
        return "冒险"
    elif "战争" in outline or "对抗" in outline or "危机" in outline:
        return "紧张"
    else:
        return "普通"

# 辅助函数：推断故事类型
def infer_genre(outline: str) -> str:
    # 简单实现：基于关键词判断类型
    if "魔法" in outline or "奇幻" in outline or "神话" in outline:
        return "奇幻"
    elif "未来" in outline or "科技" in outline or "机器人" in outline:
        return "科幻"
    elif "古代" in outline or "王朝" in outline or "武侠" in outline:
        return "历史/武侠"
    elif "校园" in outline or "青春" in outline or "学生" in outline:
        return "青春"
    else:
        return "通用"    

  

# 生成章节内容API
@app.post("/api/generate-chapter")
async def generate_chapter(request: ChapterRequest):
    """生成章节内容"""
    # 创建缓存键
    cache_key = f"chapter_{request.chapterNumber}_{request.sceneNumber}_{request.background[:30]}_{request.complexity}"
    
    # 检查缓存
    cached_content = get_from_cache(cache_key)
    if cached_content:
        return cached_content
    
    # 构建提示模板
    system_template = (
        "你是一位专业的交互式小说作家。请根据提供的世界观背景、角色信息和故事大纲，"
        f"创作第{request.chapterNumber}章第{request.sceneNumber}场景的具体内容。\n\n"
        "请遵循以下要求：\n"
        "1. 内容应与大纲保持一致，但可以添加细节和对话\n"
        "2. 场景应该有生动的描述和角色互动\n"
        "3. 结尾处设计2-3个有意义的选择，这些选择应该能引导故事向不同方向发展\n"
        "4. 每个选择应包含简短的效果提示\n"
        "5. 章节标题应该简洁有吸引力\n"
        f"6. 按照{request.complexity}级别的复杂度设计场景和对话\n\n"
        "返回JSON格式：\n"
        "{\n"
        '  "title": "第X章：章节标题",\n'
        '  "content": "详细的场景描述和对话内容...",\n'
        '  "choices": [\n'
        '    {"text": "选择1文本", "effect": "选择1效果", "nextContent": "选择1后的简短内容预览"},\n'
        '    {"text": "选择2文本", "effect": "选择2效果", "nextContent": "选择2后的简短内容预览"},\n'
        '    {"text": "选择3文本", "effect": "选择3效果", "nextContent": "选择3后的简短内容预览"}\n'
        '  ]\n'
        "}"
    )
    
    human_template = (
        f"世界背景：{request.background}\n\n"
        f"前情提要：\n{format_timeline(request.timeline)}\n\n"
        f"重要地点：\n{format_locations(request.locations)}\n\n"
        f"角色信息：\n{format_characters(request.characters)}\n\n"
        f"故事大纲：\n{request.outline}\n\n"
        f"当前任务：请创作第{request.chapterNumber}章第{request.sceneNumber}场景的详细内容，"
        f"按照要求提供章节标题、详细内容和2-3个选择。"
    )
    
    messages = [
        SystemMessage(content=system_template),
        HumanMessage(content=human_template)
    ]
    
    try:
        response = await chat_model.ainvoke(messages)
        
        # 尝试解析JSON响应
        content = response.content
        
        # 处理可能的多行JSON格式问题
        try:
            result = json.loads(content)
        except:
            # 尝试提取JSON部分
            json_match = re.search(r'(\{[\s\S]*\})', content)
            if json_match:
                try:
                    result = json.loads(json_match.group(1))
                except:
                    # 如果仍然失败，则构造一个基本结构
                    result = {
                        "title": f"第{request.chapterNumber}章：新的冒险",
                        "content": content,
                        "choices": [
                            {"text": "继续探索", "effect": "寻找更多线索", "nextContent": "你决定继续前进..."},
                            {"text": "谨慎行动", "effect": "保持警惕", "nextContent": "你决定更加小心地行动..."}
                        ]
                    }
            else:
                # 构造一个基本结构
                result = {
                    "title": f"第{request.chapterNumber}章：新的冒险",
                    "content": content,
                    "choices": [
                        {"text": "继续探索", "effect": "寻找更多线索", "nextContent": "你决定继续前进..."},
                        {"text": "谨慎行动", "effect": "保持警惕", "nextContent": "你决定更加小心地行动..."}
                    ]
                }
        
        # 保存到缓存
        save_to_cache(cache_key, result)
        
        return result
    except Exception as e:
        print(f"生成章节内容失败: {e}")
        raise HTTPException(status_code=500, detail=f"生成章节内容失败: {str(e)}")

# 辅助函数：格式化时间线数据
def format_timeline(timeline):
    if not timeline:
        return "无"
    
    result = []
    for event in timeline:
        title = event.get("title", "未知事件")
        content = event.get("content", "")
        result.append(f"- {title}：{content}")
    
    return "\n".join(result)

# 辅助函数：格式化地点数据
def format_locations(locations):
    if not locations:
        return "无"
    
    result = []
    for location in locations:
        name = location.get("name", "未知地点")
        description = location.get("description", "")
        result.append(f"- {name}：{description}")
    
    return "\n".join(result)

# 辅助函数：格式化角色数据
def format_characters(characters):
    if not characters:
        return "无"
    
    result = []
    for character in characters:
        name = character.get("name", "未知角色")
        description = character.get("description", "")
        result.append(f"- {name}：{description}")
    
    return "\n".join(result)

# 定义生成下一场景的请求模型
class NextSceneRequest(BaseModel):
    background: str
    timeline: List[Dict[str, str]] = []
    locations: List[Dict[str, str]] = []
    characters: List[Dict[str, Any]] = []
    complexity: str = "medium"
    chapterNumber: int = 1
    sceneNumber: int = 1
    chapterCount: int = 5  # 添加章节总数字段
    scenesPerChapter: int = 3  # 添加每章场景数字段
    outline: str = ""
    currentContent: str = ""
    selectedChoice: Dict[str, str] = {}
    isChapterFinale: bool = False  # 添加章节结尾标记

@app.post("/api/generate-next-scene")
async def generate_next_scene(request: NextSceneRequest):
    """根据当前剧情和选择生成下一场景"""
    # 记录请求信息以便调试
    print(f"收到生成下一场景请求: chapter={request.chapterNumber}, scene={request.sceneNumber}, complexity={request.complexity}")
    
    # 创建缓存键
    choice_text = request.selectedChoice.get("text", "")[:20]
    cache_key = f"next_scene_{request.chapterNumber}_{request.sceneNumber}_{choice_text}"
    
    # 检查缓存
    cached_content = get_from_cache(cache_key)
    if cached_content:
        return cached_content
    
    # 确定章节结构信息
    scenes_per_chapter = request.scenesPerChapter if hasattr(request, 'scenesPerChapter') else get_scenes_per_complexity(request.complexity)
    is_chapter_finale = request.isChapterFinale if hasattr(request, 'isChapterFinale') else (request.sceneNumber >= scenes_per_chapter)
    chapter_count = request.chapterCount if hasattr(request, 'chapterCount') else 5
    
    # 构建提示模板，增加章节结构相关指导
    system_template = (
        "你是一位专业的交互式小说作家。请根据当前剧情内容和用户的选择，"
        f"创作第{request.chapterNumber}章第{request.sceneNumber}场景的具体内容。\n\n"
        f"基于{request.complexity}复杂度，整个故事被划分为{chapter_count}章，"
        f"每章包含{scenes_per_chapter}个场景。"
        f"当前你正在创作第{request.chapterNumber}章第{request.sceneNumber}场景，"
        f"{'这是本章的最后一个场景，需要为下一章做铺垫' if is_chapter_finale else '这不是本章的最后一个场景，需保持剧情连贯性'}\n\n"
        "请遵循以下要求：\n"
        "1. 内容应与当前剧情和用户选择保持连贯性\n"
        "2. 场景应该有生动的描述和角色互动\n"
        f"3. {'由于这是章节结尾，请设计具有转折性或悬念的剧情，并提供2-3个能引导故事进入下一章的选择' if is_chapter_finale else '请设计2-3个有意义的选择，能够推动剧情向不同方向发展'}\n"
        "4. 每个选择应包含简短的效果提示\n"
        "5. 章节标题应该简洁有吸引力\n"
        f"6. 按照{request.complexity}级别的复杂度设计场景和对话\n\n"
        "返回JSON格式：\n"
        "{\n"
        '  "title": "第X章：章节标题",\n'
        '  "content": "详细的场景描述和对话内容...",\n'
        '  "choices": [\n'
        '    {"text": "选择1文本", "effect": "选择1效果", "nextContent": "选择1后的简短内容预览"},\n'
        '    {"text": "选择2文本", "effect": "选择2效果", "nextContent": "选择2后的简短内容预览"},\n'
        '    {"text": "选择3文本", "effect": "选择3效果", "nextContent": "选择3后的简短内容预览"}\n'
        '  ]\n'
        "}"
    )
    
    human_template = (
        f"世界背景：{request.background}\n\n"
        f"前情提要：\n{format_timeline(request.timeline)}\n\n"
        f"重要地点：\n{format_locations(request.locations)}\n\n"
        f"角色信息：\n{format_characters(request.characters)}\n\n"
        f"故事大纲：\n{request.outline}\n\n"
        f"当前剧情内容：\n{request.currentContent}\n\n"
        f"用户的选择：\n"
        f"选择文本：{request.selectedChoice.get('text', '')}\n"
        f"选择效果：{request.selectedChoice.get('effect', '')}\n"
        f"选择后内容预览：{request.selectedChoice.get('nextContent', '')}\n\n"
        f"当前任务：请创作第{request.chapterNumber}章第{request.sceneNumber}场景的详细内容，"
        f"要与用户的选择保持一致并自然延续，同时按照要求提供章节标题、详细内容和2-3个新的选择。"
    )
    
    messages = [
        SystemMessage(content=system_template),
        HumanMessage(content=human_template)
    ]
    
    try:
        response = await chat_model.ainvoke(messages)
        
        # 尝试解析JSON响应
        content = response.content
        
        # 处理可能的多行JSON格式问题
        try:
            result = json.loads(content)
        except:
            # 尝试提取JSON部分
            json_match = re.search(r'(\{[\s\S]*\})', content)
            if json_match:
                try:
                    result = json.loads(json_match.group(1))
                except:
                    # 如果仍然失败，则构造一个基本结构
                    result = {
                        "title": f"第{request.chapterNumber}章：新的发展",
                        "content": content,
                        "choices": [
                            {"text": "继续探索", "effect": "寻找更多线索", "nextContent": "你决定继续前进..."},
                            {"text": "谨慎行动", "effect": "保持警惕", "nextContent": "你决定更加小心地行动..."}
                        ]
                    }
            else:
                # 构造一个基本结构
                result = {
                    "title": f"第{request.chapterNumber}章：新的发展",
                    "content": content,
                    "choices": [
                        {"text": "继续探索", "effect": "寻找更多线索", "nextContent": "你决定继续前进..."},
                        {"text": "谨慎行动", "effect": "保持警惕", "nextContent": "你决定更加小心地行动..."}
                    ]
                }
        
        # 保存到缓存
        save_to_cache(cache_key, result)
        
        return result
    except Exception as e:
        print(f"生成下一场景失败: {e}")
        raise HTTPException(status_code=500, detail=f"生成下一场景失败: {str(e)}")

# 新增：根据复杂度获取场景数
def get_scenes_per_complexity(complexity: str) -> int:
    """根据复杂度返回每章的场景数"""
    if complexity == "simple":
        return 2
    elif complexity == "complex":
        return 4
    else:  # medium 或其他
        return 3
    
# 启动服务器（开发环境）
if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)