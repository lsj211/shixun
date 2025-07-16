import os
import json
import time
import asyncio
from typing import Dict, List, Optional, Union, AsyncGenerator
from datetime import datetime, timedelta
from pathlib import Path

# 导入 dotenv 用于加载环境变量
try:
    from dotenv import load_dotenv
    load_dotenv()  # 加载 .env 文件中的环境变量
    print("成功加载 .env 文件")
except ImportError:
    print("警告: python-dotenv 未安装，尝试直接使用环境变量")

import uvicorn
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

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

# API路由
@app.post("/api/generate-background")
async def generate_background(request: BackgroundGenerationRequest):
    """生成故事背景（流式输出）"""
    # 检查是否有字数限制参数
    character_limit = getattr(request, 'characterLimit', 200)  # 默认200字
    format_restrictions = getattr(request, 'formatRestrictions', True)  # 默认启用格式限制
    world_building_only = getattr(request, 'worldBuildingOnly', True)  # 默认仅生成世界观
    
    # 创建缓存键
    cache_key = f"background_{request.background[:50]}_{request.complexity}_{request.chapterCount}_limit{character_limit}"
    
    # 构建提示模板，增加字数和格式限制
    system_template = (
        "作为一个专业的互动小说创作者，请基于以下简短描述，创建一个故事背景和世界观设定。\n\n"
    )
    
    # 根据需求调整系统提示
    if world_building_only:
        system_template += (
            "请仅提供世界观相关内容，不要包含任何故事情节或剧情内容。\n"
            "世界观应该仅描述故事发生的背景环境、社会结构、规则系统等。\n\n"
        )
    
    # 添加字数限制要求
    system_template += f"请严格遵守以下字数限制:\n"
    system_template += f"1. 世界观背景设定: 不超过{character_limit}字\n"
    system_template += f"2. 前情提要中的每个事件: 不超过{character_limit}字\n"
    
    # 添加格式要求
    if format_restrictions:
        system_template += (
            "\n格式要求：\n"
            "1. 世界观：纯文本段落，不使用标题或编号\n"
            "2. 前情提要：每个事件格式为\"标题: 事件名称\" + \"内容: 事件描述\"\n"
            "3. 重要地点：每个地点格式为\"名称: 地点名称\" + \"描述: 地点描述\"\n\n"
            "请严格遵循以上格式，不要添加其他内容或解释。"
        )
    
    human_template = (
        f"基础描述: {request.background}\n\n"
        f"故事复杂度: {request.complexity} (简单/中等/复杂)\n"
        f"计划章节数: {request.chapterCount}章"
    )
    
    messages = [
        SystemMessage(content=system_template),
        HumanMessage(content=human_template)
    ]
    
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
            "/api/generate-story-node"
        ]
    }

# 启动服务器（开发环境）
if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)