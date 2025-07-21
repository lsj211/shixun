import jieba
import jieba
import jieba.posseg as pseg
from collections import Counter
from typing import List, Dict, Optional, Union, AsyncGenerator, Any
from datetime import datetime, timedelta
from pathlib import Path
import re
import os
import json
import time
import asyncio
import hashlib
from http import HTTPStatus  # 新增导入
from urllib.parse import urlparse, unquote  # 新增导入
from pathlib import PurePosixPath  # 新增导入
try:
    from dotenv import load_dotenv
    load_dotenv()
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
from dashscope import ImageSynthesis  # 新增导入

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

import numpy as np
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
        model_name="qwen-max",
        temperature=0.7,
        top_p=0.8,
        max_tokens=500,
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



from fastapi import FastAPI
from pydantic import BaseModel
from fastapi.responses import StreamingResponse
import faiss
import json
from langchain_community.embeddings.dashscope import DashScopeEmbeddings

# Initialize DashScopeEmbeddings model
embeddings = DashScopeEmbeddings(model="text-embedding-v1")

# Dictionary of novel data file paths by genre
novel_data = {
    "玄幻": r"H:\llm\model\data\玄幻.json",
    "科幻": r"H:\llm\model\data\科幻.json",
    "都市": r"H:\llm\model\data\都市.json",
    "历史": r"H:\llm\model\data\历史.json"
}

# Load novel data from JSON file
def load_novel_data(genre: str):
    try:
        file_path = novel_data.get(genre, "")
        if not file_path:
            raise ValueError(f"No file path defined for genre {genre}.")
        with open(file_path, "r", encoding="utf-8") as f:
            return json.load(f)
    except FileNotFoundError:
        raise FileNotFoundError(f"File for genre {genre} not found at {file_path}.")
    except json.JSONDecodeError:
        raise ValueError(f"Invalid JSON format in file for genre {genre}.")


def split_text_by_paragraph(text: str, max_length: int = 2048):
    """将长文本按换段符分割成多个不超过最大长度的片段"""
    paragraphs = text.split('\n\n')
    
    split_texts = []
    current_text = ""
    
    for paragraph in paragraphs:
        # 判断当前文本和段落的长度是否超过最大长度
        if len(current_text) + len(paragraph) + 2 <= max_length:  # +2 是为了加入换行符
            if current_text:
                current_text += '\n\n' + paragraph  # 加入换段符
            else:
                current_text = paragraph
        else:
            if current_text:
                split_texts.append(current_text)  # 当前片段超长，保存并开始新的片段
            current_text = paragraph  # 新的片段开始

    if current_text:
        split_texts.append(current_text)

    return split_texts


# Embed novels and create FAISS index
def embed_novels(genre: str):
    # Load novel data
    data = load_novel_data(genre)
    texts = []
    metadata = []
    
    # Extract chapter content and metadata
    for novel in data:
        novel_name = novel.get("novel_name", "Unknown Novel")
        for chapter in novel.get("chapters", []):
            if "content" in chapter and "title" in chapter:
                # 对每个章节的内容按段落进行分割
                split_texts = split_text_by_paragraph(chapter["content"])
                
                for idx, text in enumerate(split_texts):
                    # 添加每个分割后的文本及其元数据
                    texts.append(text)
                    metadata.append({
                        "novel_name": novel_name,
                        "chapter_title": chapter["title"],
                        "chapter_id": chapter.get("chapter_id", "Unknown"),
                        "part_index": idx  # 为每个片段添加索引
                    })
    
    if not texts:
        raise ValueError(f"No valid chapter content found for genre {genre}.")
    
    # Convert texts to embeddings
    novel_embeddings = embeddings.embed_documents(texts)
    
    # Convert embeddings to numpy array for FAISS
    embedding_array = np.array(novel_embeddings).astype('float32')
    
    # Create FAISS index
    dimension = embedding_array.shape[1]
    faiss_index = faiss.IndexFlatL2(dimension)
    faiss_index.add(embedding_array)
    
    return faiss_index, texts, metadata



# Retrieve relevant content based on query
def retrieve_relevant_content(query: str, genre: str, k: int = 3):
    # Get FAISS index, texts, and metadata
    faiss_index, texts, metadata = embed_novels(genre)
    # Convert query to embedding
    query_embedding = embeddings.embed_query(query)
    query_array = np.array([query_embedding]).astype('float32')
    
    # Perform similarity search
    distances, indices = faiss_index.search(query_array, k)
    # Return the top k relevant texts with metadata
    results = []
    for i in indices[0]:
        if i < len(texts):
            results.append({
                "novel_name": metadata[i]["novel_name"],
                "chapter_title": metadata[i]["chapter_title"],
                "chapter_id": metadata[i]["chapter_id"],
                "content": texts[i][:200] + "..." if len(texts[i]) > 200 else texts[i]
            })
    print(f"检索到 {len(results)} 条相关内容")
    return results

stroytheme=None

from classify import classifier  # 导入分类器

@app.post("/api/generate-background")
async def generate_background(request: BackgroundGenerationRequest):
    """生成故事背景（流式输出）"""
    # 创建缓存键
    cache_key = f"background_{request.background[:50]}_{request.complexity}_{request.chapterCount}"

    result=classifier(
        request.background,
        candidate_labels=["科幻", "玄幻", "历史", "都市"]
    )
    # 步骤 1: 根据背景推断小说类型（这里直接假设是科幻）
    # genre = "玄幻"  # 假设从分类模型中得到了该结果
    genre = result["labels"][0]

    stroytheme=genre

    # 步骤 2: 基于小说类型检索相关内容
    relevant_content = retrieve_relevant_content(request.background, genre)
    
    # 步骤 3: 将相关内容转换为字符串列表，并拼接成一个字符串
    relevant_content_text = "\n\n".join([content["content"] for content in relevant_content])
    # 步骤 3: 构建背景生成的系统模板，包含检索到的相关内容
    system_template = (
        f"作为一个专业的互动小说创作者，请基于以下简短描述，创建一个故事背景和世界观设定。\n\n"
        f"相关背景内容: {relevant_content_text}\n\n"
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
    
    # 生成内容并流式返回
    return StreamingResponse(
        generate_content_stream(messages, cache_key),
        media_type="text/event-stream"
    )



# @app.post("/api/generate-background")
# async def generate_background(request: BackgroundGenerationRequest):
#     """生成故事背景（流式输出）"""
#     # 创建缓存键
#     cache_key = f"background_{request.background[:50]}_{request.complexity}_{request.chapterCount}"
    
#     # 构建提示模板，在系统提示中直接添加字数和格式限制
#     system_template = (
#         "作为一个专业的互动小说创作者，请基于以下简短描述，创建一个故事背景和世界观设定。\n\n"
#         "请严格遵守以下要求：\n"
#         "1. 仅提供世界观相关内容，不要包含任何故事情节或剧情内容\n"
#         "2. 世界观设定：限制在200字以内，仅描述故事发生的背景环境、社会结构、规则系统等\n"
#         "3. 前情提要：每个事件不超过100字，仅提供故事发生前的关键剧情事件\n"
#         "4. 重要地点：每个地点格式为\"重要地点: 地点名称\" + \"描述: 地点描述\"，描述不超过200字\n\n"
        
#         "格式要求：\n"
#         "1. 世界观：纯文本段落，不使用标题或编号\n"
#         "2. 前情提要：每个事件格式为\"前情提要: 事件名称\" + \"描述: 事件描述\"\n"
#         "3. 重要地点：每个地点格式为\"重要地点: 地点名称\" + \"描述: 地点描述\"\n\n"
        
#         "请严格遵循以上格式，前情提要一定要是前情提要：标题：内容：，重要地点一定要是重要地点：名称：描述：，不要添加其他内容或解释，确保内容简洁精炼。"
#     )
    
#     human_template = (
#         f"基础描述: {request.background}\n\n"
#         f"故事复杂度: {request.complexity} (简单/中等/复杂)\n"
#         f"计划章节数: {request.chapterCount}章\n\n"
#         f"请先生成世界观设定(200字以内)，然后生成2-3个前情提要(每个100字以内)，最后生成2-3个重要地点(名称+描述格式，描述200字以内)"
#     )
    
#     messages = [
#         SystemMessage(content=system_template),
#         HumanMessage(content=human_template)
#     ]
    
#     return StreamingResponse(
#         generate_content_stream(messages, cache_key),
#         media_type="text/event-stream"
#     )

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
    return {
        "status": "online",
        "service": "互动小说AI后端服务",
        "version": "1.0.0",
        "endpoints": [
            "/api/generate-background",
            "/api/enhance-background",
            "/api/generate-characters",
            "/api/generate-story-node",
            "/api/generate-story-outline",
            "/api/generate-story-title",
            "/api/generate-chapter",
            "/api/generate-next-scene",
            "/api/generate-story-ending",
            "/api/generate-image",
            "/api/generate-character-image"
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
        f"6. 小说的主题为{stroytheme}\n\n"
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
async def generate_next_scene(request: dict):  # 简化为dict以避免严格的模型验证
    """根据当前剧情和选择生成下一场景（流式输出）"""
    # 记录请求信息以便调试
    print(f"收到生成下一场景请求: chapter={request.get('chapterNumber')}, scene={request.get('sceneNumber')}, complexity={request.get('complexity')}")
    
    # 创建缓存键
    choice_text = request.get('selectedChoice', {}).get("text", "")[:20]
    cache_key = f"next_scene_{request.get('chapterNumber')}_{request.get('sceneNumber')}_{choice_text}"
    
    # 检查缓存
    cached_content = get_from_cache(cache_key)
    if cached_content:
        async def stream_cached_content():
            yield f"data: {json.dumps({'text': cached_content, 'done': True})}\n\n"
        
        return StreamingResponse(
            stream_cached_content(),
            media_type="text/event-stream"
        )
    
    # 确定章节结构信息
    scenes_per_chapter = request.get('scenesPerChapter', get_scenes_per_complexity(request.get('complexity', 'medium')))
    is_chapter_finale = request.get('isChapterFinale', request.get('sceneNumber', 1) >= scenes_per_chapter)
    chapter_count = request.get('chapterCount', 5)


    relevant_content=retrieve_relevant_content(request.get('selectedChoice', {}).get('nextContent', ''),stroytheme)

    # 构建提示模板，增加章节结构相关指导
    system_template = (
        "你是一位专业的交互式小说作家。请根据当前剧情内容和用户的选择，"
        f"创作第{request.get('chapterNumber')}章第{request.get('sceneNumber')}场景的具体内容。\n\n"
        f"基于{request.get('complexity')}复杂度，整个故事被划分为{chapter_count}章，"
        f"每章包含{scenes_per_chapter}个场景。"
        f"当前你正在创作第{request.get('chapterNumber')}章第{request.get('sceneNumber')}场景，"
        f"相关内容: {relevant_content}\n\n"
        f"{'这是本章的最后一个场景，需要为下一章做铺垫' if is_chapter_finale else '这不是本章的最后一个场景，需保持剧情连贯性'}\n\n"
        "请遵循以下要求：\n"
        "1. 内容应与当前剧情和用户选择保持连贯性\n"
        "2. 场景应该有生动的描述和角色互动\n"
        f"3. {'由于这是章节结尾，请设计具有转折性或悬念的剧情，并提供2-3个能引导故事进入下一章的选择' if is_chapter_finale else '请设计2-3个有意义的选择，能够推动剧情向不同方向发展'}\n"
        "4. 每个选择应包含简短的效果提示\n"
        "5. 章节标题应该简洁有吸引力\n"
        f"6. 按照{request.get('complexity')}级别的复杂度设计场景和对话\n\n"
        "7. **必须严格返回JSON格式，且JSON语法中所有标点符号（包括逗号、引号、冒号）必须使用英文标点（如, 、\" 、:），绝对不能使用中文标点（如，、“”、：）**\n"
        "8. 确保JSON中键值对之间用英文逗号分隔，数组元素（如choices中的选项）之间也用英文逗号分隔，且最后一个元素后无多余逗号\n\n"
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
        f"世界背景：{request.get('background', '')}\n\n"
        f"前情提要：\n{format_timeline(request.get('timeline', []))}\n\n"
        f"重要地点：\n{format_locations(request.get('locations', []))}\n\n"
        f"角色信息：\n{format_characters(request.get('characters', []))}\n\n"
        f"故事大纲：\n{request.get('outline', '')}\n\n"
        f"当前剧情内容：\n{request.get('currentContent', '')}\n\n"
        f"用户的选择：\n"
        f"选择文本：{request.get('selectedChoice', {}).get('text', '')}\n"
        f"选择效果：{request.get('selectedChoice', {}).get('effect', '')}\n"
        f"选择后内容预览：{request.get('selectedChoice', {}).get('nextContent', '')}\n\n"
        f"当前任务：请创作第{request.get('chapterNumber')}章第{request.get('sceneNumber')}场景的详细内容，"
        f"要与用户的选择保持一致并自然延续，同时按照要求提供章节标题、详细内容和2-3个新的选择。"
    )
    
    messages = [
        SystemMessage(content=system_template),
        HumanMessage(content=human_template)
    ]
    
    async def stream_json_content():
        full_response = ""
        try:
            async for chunk in chat_model.astream(messages):
                content = chunk.content
                content = content.replace('\n', ' ').replace('\r', ' ').strip()
                if content:
                    full_response += content
                    print(f"发送流式片段: {content}")  # 调试日志
                    yield f"data: {json.dumps({'text': content, 'done': False})}\n\n"
            
            # 尝试解析完整的JSON响应
            try:
                result = json.loads(full_response)
            except json.JSONDecodeError as e:
                print(f"JSON解析失败: {e}, full_response: {full_response}")
                # 尝试提取JSON部分
                json_match = re.search(r'\{[\s\S]*?\}', full_response)
                if json_match:
                    try:
                        result = json.loads(json_match.group(0))
                    except json.JSONDecodeError as e2:
                        print(f"提取JSON失败: {e2}")
                        # 构造默认结构
                        result = {
                            "title": f"第{request.get('chapterNumber')}章：新的发展",
                            "content": full_response,
                            "choices": [
                                {"text": "继续探索", "effect": "寻找更多线索", "nextContent": "你决定继续前进..."},
                                {"text": "谨慎行动", "effect": "保持警惕", "nextContent": "你决定更加小心地行动..."}
                            ]
                        }
                else:
                    print("无法提取JSON，构造默认结构")
                    # 构造默认结构
                    result = {
                        "title": f"第{request.get('chapterNumber')}章：新的发展",
                        "content": full_response,
                        "choices": [
                            {"text": "继续探索", "effect": "寻找更多线索", "nextContent": "你决定继续前进..."},
                            {"text": "谨慎行动", "effect": "保持警惕", "nextContent": "你决定更加小心地行动..."}
                        ]
                    }
            
            # 保存到缓存
            save_to_cache(cache_key, result)
            
            # 发送最终JSON结果（确保是字符串化的JSON）
            yield f"data: {json.dumps({'text': json.dumps(result), 'done': True})}\n\n"
        
        except Exception as e:
            print(f"生成下一场景失败: {e}")
            error_response = {
                "error": f"生成下一场景失败: {str(e)}"
            }
            # yield f"data: {json.dumps({'text': json.dumps(error_response), 'done': True})}\n\n"
            yield f"data: {json.dumps({'text': json.dumps(result, ensure_ascii=False), 'done': True}, ensure_ascii=False)}\n\n"
    
    return StreamingResponse(
        stream_json_content(),
        media_type="text/event-stream"
    )
# 新增：根据复杂度获取场景数
def get_scenes_per_complexity(complexity: str) -> int:
    """根据复杂度返回每章的场景数"""
    if complexity == "simple":
        return 2
    elif complexity == "complex":
        return 4
    else:  # medium 或其他
        return 3
    
class StoryEndingRequest(BaseModel):
    background: str
    timeline: list
    locations: list
    characters: list
    complexity: str
    chapterCount: int
    scenesPerChapter: int
    outline: str
    pathNodes: list
    currentNode: dict
    currentChapter: int
    currentScene: int
    isFinalEnding: bool

# 格式化路径节点（将所有节点拼接为一段文本）
def format_path_nodes(path_nodes):
    # 拼接所有路径节点的内容
    full_content = "\n".join([f"第{node.get('chapter', 1)}章 第{node.get('scene', 1)}场景: {node.get('content', '')}" for node in path_nodes])
    return full_content

# @app.post("/api/generate-story-ending")
# async def generate_story_ending(request: StoryEndingRequest):
#     """根据当前剧情和选择生成故事结局"""
#     # 记录请求信息以便调试
#     print(f"收到生成故事结局请求: chapter={request.currentChapter}, scene={request.currentScene}, complexity={request.complexity}")

#     # 构建提示模板
#     system_template = (
#         "你是一位专业的交互式小说作家。请根据当前剧情内容，创作整个故事的结局。\n\n"
#         f"基于{request.complexity}复杂度，整个故事被划分为{request.chapterCount}章，"
#         f"每章包含{request.scenesPerChapter}个场景。"
#         f"当前你正在创作整个故事的结局内容，结局应当与当前剧情、角色发展以及大纲保持一致。\n\n"
#         "请参考以下信息并结合当前已发生的剧情设计结局：\n\n"
#         f"当前剧情内容：\n{format_path_nodes(request.pathNodes)}\n\n"
#         f"故事大纲：\n{request.outline}\n\n"
#         f"角色信息：\n{format_characters(request.characters)}\n\n"
#         f"世界背景：\n{request.background}\n\n"
#         "结局应包含以下要求：\n"
#         "1. 内容应与当前剧情、角色发展和大纲保持连贯性\n"
#         "2. 场景应有生动的描述和角色互动\n"
#         "3. 结局应该具有转折性或悬念\n"
#         "4. 返回的结局不应包含新的选择\n"
#         "5. 章节标题应该简洁有吸引力\n\n"
#         "6. **必须严格返回JSON格式，且JSON语法中所有标点符号（包括逗号、引号、冒号）必须使用英文标点（如, 、\" 、:），绝对不能使用中文标点（如，、“”、：）**\n"
#         "7. 确保JSON中键值对之间用英文逗号分隔，数组元素之间也用英文逗号分隔，且最后一个元素后无多余逗号\n\n"
#         "返回JSON格式：\n"
#         "{\n"
#         '  "title": "结局标题",\n'
#         '  "content": "详细的结局描述...",\n'
#         '}'
#     )

#     human_template = (
#         f"世界背景：{request.background}\n\n"
#         f"前情提要：\n{format_timeline(request.timeline)}\n\n"
#         f"重要地点：\n{format_locations(request.locations)}\n\n"
#         f"角色信息：\n{format_characters(request.characters)}\n\n"
#         f"故事大纲：\n{request.outline}\n\n"
#         f"当前剧情内容：\n{format_path_nodes(request.pathNodes)}\n\n"
#         f"当前任务：请创作整个故事的结局，结局应与当前剧情和大纲保持一致，并且不应包含新的选择。"
#     )

#     messages = [
#         {"role": "system", "content": system_template},
#         {"role": "user", "content": human_template}
#     ]

#     try:
#         # 模拟调用聊天模型生成内容
#         response = await chat_model.ainvoke(messages)

#         # 尝试解析JSON响应
#         content = response.content

#         try:
#             result = json.loads(content)    
#             print(f"生成的结局内容: {result}")
#         except:
#             result = {
#                 "title": "结局：新的开始",
#                 "content": content.content
#             }
#             # result = {
#             #     "title": content.title,
#             #     "content": content.content
#             # }

#         # 返回生成的结局
#         return {
#             "title": "尾声: "+result.get('title', "结局标题"),
#             "content": result.get('content', ""),
#             "choices": []  # 不返回新的选择
#         }
#     except Exception as e:
#         print(f"生成故事结局失败: {e}")
#         raise HTTPException(status_code=500, detail=f"生成故事结局失败: {str(e)}")



from fastapi import HTTPException
from fastapi.responses import StreamingResponse
import json
import asyncio
from fastapi.responses import StreamingResponse
import json

@app.post("/api/generate-story-ending")
async def generate_story_ending(request: StoryEndingRequest):
    """根据当前剧情和选择生成故事结局（流式输出）"""
    # 记录请求信息以便调试
    print(f"收到生成故事结局请求: chapter={request.currentChapter}, scene={request.currentScene}, complexity={request.complexity}")

    # 构建提示模板
    system_template = (
        "你是一位专业的交互式小说作家。请根据当前剧情内容，创作整个故事的结局。\n\n"
        f"基于{request.complexity}复杂度，整个故事被划分为{request.chapterCount}章，"
        f"每章包含{request.scenesPerChapter}个场景。"
        f"当前你正在创作整个故事的结局内容，结局应当与当前剧情、角色发展以及大纲保持一致。\n\n"
        "请参考以下信息并结合当前已发生的剧情设计结局：\n\n"
        f"当前剧情内容：\n{format_path_nodes(request.pathNodes)}\n\n"
        f"故事大纲：\n{request.outline}\n\n"
        f"角色信息：\n{format_characters(request.characters)}\n\n"
        f"世界背景：\n{request.background}\n\n"
        "结局应包含以下要求：\n"
        "1. 内容应与当前剧情、角色发展和大纲保持连贯性\n"
        "2. 场景应有生动的描述和角色互动\n"
        "3. 结局应该具有转折性或悬念\n"
        "4. 返回的结局不应包含新的选择\n"
        "5. 章节标题应该简洁有吸引力\n\n"
        "6. **必须严格返回JSON格式，且JSON语法中所有标点符号（包括逗号、引号、冒号）必须使用英文标点（如, 、\" 、:），绝对不能使用中文标点（如，、“”、：）**\n"
        "7. 确保JSON中键值对之间用英文逗号分隔，数组元素之间也用英文逗号分隔，且最后一个元素后无多余逗号\n\n"
        "返回JSON格式：\n"
        "{\n"
        '  "title": "结局标题",\n'
        '  "content": "详细的结局描述..."\n'
        '}'
    )

    human_template = (
        f"世界背景：{request.background}\n\n"
        f"前情提要：\n{format_timeline(request.timeline)}\n\n"
        f"重要地点：\n{format_locations(request.locations)}\n\n"
        f"角色信息：\n{format_characters(request.characters)}\n\n"
        f"故事大纲：\n{request.outline}\n\n"
        f"当前剧情内容：\n{format_path_nodes(request.pathNodes)}\n\n"
        f"当前选择：{request.currentNode.get('choice', {}).get('text', '无选择文本')}\n\n"
        f"当前任务：请创作整个故事的结局，结局应与当前剧情和大纲保持一致，并且不应包含新的选择。"
    )

    messages = [
        {"role": "system", "content": system_template},
        {"role": "user", "content": human_template}
    ]

    async def stream_json_content():
        full_response = ""
        try:
            # 调用聊天模型生成内容（流式响应）
            async for chunk in  chat_model.astream(messages):
                content = chunk.content.replace('\n', ' ').replace('\r', ' ').strip()

                if content:
                    full_response += content
                    print(f"发送流式片段: {content}")  # 调试日志

                    # 发送流式文本片段，确保格式与前端和Node.js代理匹配
                    yield f"data: {json.dumps({'text': content, 'done': False}, ensure_ascii=False)}\n\n"
                    await asyncio.sleep(0.01)  # 确保流式传输顺畅

            # 尝试解析完整的JSON响应
            try:
                result = json.loads(full_response)
                if not isinstance(result, dict) or "title" not in result or "content" not in result:
                    raise json.JSONDecodeError("Invalid JSON structure", full_response, 0)
            except json.JSONDecodeError as e:
                print(f"JSON解析失败: {e}, 使用默认结构")
                result = {
                    "title": f"第{request.currentChapter}章 结局",
                    "content": full_response or "在关键时刻，故事迎来了意想不到的结局..."
                }

            # 确保结果符合JSON格式要求
            final_result = {
                "title": result.get("title", f"第{request.currentChapter}章 结局"),
                "content": result.get("content", full_response)
            }

            # 发送最终JSON结果
            yield f"data: {json.dumps({'text': final_result, 'done': True}, ensure_ascii=False)}\n\n"

        except Exception as e:
            print(f"生成故事结局失败: {e}")
            error_response = {
                "title": f"第{request.currentChapter}章 结局",
                "content": f"生成故事结局失败: {str(e)}"
            }
            yield f"data: {json.dumps({'text': error_response, 'done': True}, ensure_ascii=False)}\n\n"

    # 使用StreamingResponse进行流式返回
    return StreamingResponse(
        stream_json_content(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive"
        }
    )





class ImageGenerationRequest(BaseModel):
    description: str = Field(..., description="场景描述")
    style: str = Field("realistic", description="图像风格")
    colorTone: str = Field("warm", description="图像色调")

# 修改后的图像生成端点
@app.post("/api/generate-image")
async def generate_image(request: ImageGenerationRequest):
    """生成场景图像"""
    cache_key = f"image_{hashlib.md5(request.description[:50].encode()).hexdigest()}_{request.style}_{request.colorTone}"
    cached_content = get_from_cache(cache_key)
    if cached_content:
        print(f"图像缓存命中: {cache_key}")
        return {"imageUrl": cached_content}

    try:
        # 使用 DashScope ImageSynthesis.call 生成图像
        response = ImageSynthesis.call(
            api_key=DASHSCOPE_API_KEY,
            model="wanx2.1-t2i-turbo",
            prompt=f"{request.description}, style: {request.style}, tone: {request.colorTone}",
            n=1,
            size="1024*1024"
        )

        if response.status_code == HTTPStatus.OK:
            # 获取图像 URL
            image_url = response.output.results[0].url
            print(f"图像生成成功: {image_url}")
            save_to_cache(cache_key, image_url)
            return {"imageUrl": image_url}
        else:
            print(f"图像生成失败, status_code: {response.status_code}, code: {response.code}, message: {response.message}")
            raise HTTPException(
                status_code=500,
                detail=f"图像生成失败: status_code={response.status_code}, message={response.message}"
            )

    except Exception as e:
        print(f"图像生成过程失败: {str(e)}")
        raise HTTPException(status_code=500, detail=f"图像生成失败: {str(e)}")

class CharacterImageGenerationRequest(BaseModel):
    name: str = Field(..., description="角色名称")
    description: str = Field(..., description="角色描述")
    style: str = Field("realistic", description="立绘风格")
    colorTone: str = Field("warm", description="立绘色调")
    
# 新增角色立绘生成端点
@app.post("/api/generate-character-image")
async def generate_character_image(request: CharacterImageGenerationRequest):
    """生成角色立绘"""
    cache_key = f"character_image_{hashlib.md5((request.name + request.description[:50]).encode()).hexdigest()}_{request.style}_{request.colorTone}"
    cached_content = get_from_cache(cache_key)
    if cached_content:
        print(f"角色立绘缓存命中: {cache_key}")
        return {"imageUrl": cached_content}

    try:
        # 优化提示词以生成角色立绘
        prompt = f"角色: {request.name}, {request.description}, 高清角色立绘, 全身肖像, 详细服装和面部特征, 背景简洁, style: {request.style}, tone: {request.colorTone}"
        response = ImageSynthesis.call(
            api_key=DASHSCOPE_API_KEY,
            model="wanx2.1-t2i-turbo",
            prompt=prompt,
            n=1,
            size="1024*1024"
        )

        if response.status_code == HTTPStatus.OK:
            image_url = response.output.results[0].url
            print(f"角色立绘生成成功: {image_url}")
            save_to_cache(cache_key, image_url)
            return {"imageUrl": image_url}
        else:
            print(f"角色立绘生成失败, status_code: {response.status_code}, code: {response.code}, message: {response.message}")
            raise HTTPException(
                status_code=500,
                detail=f"角色立绘生成失败: status_code={response.status_code}, message={response.message}"
            )
    except Exception as e:
        print(f"角色立绘生成过程失败: {str(e)}")
        raise HTTPException(status_code=500, detail=f"角色立绘生成失败: {str(e)}")






# 新增：剧情树生成请求模型
class StoryTreeRequest(BaseModel):
    background: str
    characters: List[Dict[str, str]]
    chapterCount: int = 7
    chapterLength: int = 1000
    complexity: str = "medium"

# 新增：剧情树生成接口
@app.post("/api/generate-story-tree")
async def generate_story_tree(request: StoryTreeRequest):
    """生成完整剧情树（带异常处理）"""
    print(f"收到剧情树生成请求，章节数: {request.chapterCount}")  # 确认收到章节数
    try:
        # 创建缓存键时包含chapterCount
        cache_key = f"story_tree_{request.background[:50]}_{len(request.characters)}_{request.chapterCount}_{request.chapterLength}"
        print(f"生成剧情树的缓存键: {cache_key}")  # 确认缓存键
        # 检查缓存
        cached_tree = get_from_cache(cache_key)
        if cached_tree:
            return {"tree": cached_tree}
        
        # 准备角色信息字符串
        characters_info = "\n".join(
            f"- {char.get('name', '未命名')}: {char.get('description', '无描述')[:100]}"
            for char in request.characters
        )
        
        # 构建提示模板（使用 request.chapterLength 控制每章长度）
        system_template = (
            "你是一位专业的小说作家，请根据提供的故事背景和角色信息，创作一个完整的多章节故事大纲。\n\n"
            "请严格按照以下要求创作：\n"
            f"1. 总共创作 {request.chapterCount} 个章节\n"
            f"2. 每个章节的内容长度控制在 {request.chapterLength} 字左右\n"  # 此处使用传入的章节长度
            "3. 为每个章节创建富有吸引力且与内容相关的标题\n"
            "4. 内容需要连贯，形成一个完整的故事线\n"
            "5. 确保所有主要角色都有适当的戏份\n"
            "6. 故事发展要符合提供的背景设定\n"
            "7. 章节之间要有逻辑衔接\n\n"
            "请以JSON格式返回，格式如下：\n"
            "{\n"
            "  \"chapters\": [\n"
            "    {\"title\": \"第一章的标题\", \"content\": \"第一章的具体内容...\"},\n"
            "    {\"title\": \"第二章的标题\", \"content\": \"第二章的具体内容...\"},\n"
            "    ...\n"
            "  ]\n"
            "}\n\n"
            "确保输出是有效的JSON，不要包含任何额外的解释或说明文字。"
        )
        
        human_template = (
            f"故事背景: {request.background}\n\n"
            f"角色信息:\n{characters_info}\n\n"
            f"请创作一个包含 {request.chapterCount} 个章节的故事，每章约 {request.chapterLength} 字。"
        )
        
        messages = [
            SystemMessage(content=system_template),
            HumanMessage(content=human_template)
        ]
        
        # 调用模型（非流式）
        try:
            response = chat_model(messages)
            content = response.content.strip()
            print(f"模型返回原始内容: {content[:200]}...")
            
            # 解析JSON（修正版）
            try:
                import re
                json_match = re.search(r'\{.*\}', content, re.DOTALL)
                if not json_match:
                    raise ValueError("未找到有效的JSON结构")
                
                json_str = json_match.group(0)
                story_data = json.loads(json_str)
                
                # 验证基本结构
                if not isinstance(story_data, dict) or "chapters" not in story_data:
                    raise ValueError("JSON缺少chapters字段")
                
                if not isinstance(story_data["chapters"], list) or len(story_data["chapters"]) == 0:
                    raise ValueError("chapters必须是包含至少一个元素的数组")
                
                valid_chapters = []
                for i, chapter in enumerate(story_data["chapters"]):
                    # 确保章节是字典类型
                    if not isinstance(chapter, dict):
                        chapter = {"content": str(chapter)}
                    
                    # 优先使用模型生成的title和content
                    title = chapter.get("title", "").strip()
                    content = chapter.get("content", "").strip()
                    
                    # 仅在title缺失时才尝试从content中提取
                    if not title and content:
                        # 尝试从content中提取标题（仅作为后备）
                        title_pattern = r'^第\s*([一二三四五六七八九十1-90]+)\s*章\s*[:：]?\s*([^\n]*)'
                        title_match = re.search(title_pattern, content)
                        
                        if title_match:
                            chapter_number = title_match.group(1)
                            title_text = title_match.group(2).strip()
                            title = title_text if title_text else f"第{chapter_number}章"
                            content = content.replace(title_match.group(0), '', 1).strip()
                        else:
                            # 未匹配到章节格式，使用默认标题
                            title = f"第{i+1}章"
                    
                    # 如果仍然没有标题，使用默认值
                    if not title:
                        title = f"第{i+1}章"
                    
                    # 处理内容为空的情况
                    if not content:
                        content = f"{title}: 未生成有效内容"
                    
                    valid_chapters.append({
                        "title": title,
                        "content": content
                    })
                
                # 确保章节数量匹配
                if len(valid_chapters) < request.chapterCount:
                    print(f"警告: 章节数量不足（预期{request.chapterCount}，实际{len(valid_chapters)}）")
                    for i in range(len(valid_chapters), request.chapterCount):
                        valid_chapters.append({
                            "title": f"第{i+1}章",
                            "content": f"第{i+1}章: 未生成有效内容"
                        })
                
                story_data["chapters"] = valid_chapters
                save_to_cache(cache_key, story_data)
                return {"tree": story_data}
                
            except json.JSONDecodeError as e:
                raise HTTPException(
                    status_code=500,
                    detail=f"解析剧情树JSON失败: {str(e)}"
                )
            except ValueError as e:
                raise HTTPException(
                    status_code=500,
                    detail=f"剧情树数据结构错误: {str(e)}"
                )
        
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"调用模型失败: {str(e)}"
            )
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"剧情树生成接口未处理异常: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"剧情树生成失败: {str(e)}"
        )




@app.post("/api/generate-chapter-titles")
async def generate_chapter_titles(request: StoryTreeRequest):
    """生成章节标题列表"""
    # 创建缓存键（包含复杂度和章节数）
    cache_key = f"chapter_titles_{request.background[:50]}_{request.complexity}_{request.chapterCount}"
    
    # 检查缓存
    cached_titles = get_from_cache(cache_key)
    if cached_titles:
        return {"titles": cached_titles}
    
    # 构建提示模板
    system_template = (
        "你是一位专业的小说作家，请根据提供的故事背景和角色信息，为一个多章节故事创作章节标题。\n\n"
        "请严格按照以下要求创作：\n"
        f"1. 总共创作 {request.chapterCount} 个章节标题\n"
        "2. 每个标题应富有吸引力且与内容相关\n"
        "3. 标题之间要有逻辑连贯性，体现故事发展脉络\n"
        "4. 标题应简洁明了，长度适中\n\n"
        "请以JSON格式返回，格式如下：\n"
        "[\n"
        "  \"第一章的标题\",\n"
        "  \"第二章的标题\",\n"
        "  ...\n"
        "]\n\n"
        "确保输出是有效的JSON数组，不要包含任何额外的解释或说明文字。"
    )
    
    # 增加复杂度描述到提示中
    complexity_description = {
        "low": "简单的情节发展和基础的角色互动",
        "medium": "中等复杂度的情节，包含一些转折和角色发展",
        "high": "复杂的情节线、多重冲突和深入的角色心理描写"
    }.get(request.complexity, "中等复杂度的情节")
    
    human_template = (
        f"故事背景: {request.background}\n\n"
        f"角色信息:\n{format_characters(request.characters)}\n\n"
        f"故事复杂度: {complexity_description}\n\n"
        f"请为这个故事创作 {request.chapterCount} 个章节的标题。"
    )
    
    messages = [
        SystemMessage(content=system_template),
        HumanMessage(content=human_template)
    ]
    
    try:
        response = await chat_model.ainvoke(messages)
        content = response.content.strip()
        
        # 解析JSON
        try:
            titles = json.loads(content)
            if not isinstance(titles, list) or len(titles) == 0:
                raise ValueError("返回的不是有效的标题列表")
            
            # 确保标题数量正确
            if len(titles) < request.chapterCount:
                print(f"警告: 标题数量不足（预期{request.chapterCount}，实际{len(titles)}）")
                for i in range(len(titles), request.chapterCount):
                    titles.append(f"第{i+1}章")
            
            save_to_cache(cache_key, titles)
            return {"titles": titles}
            
        except json.JSONDecodeError as e:
            raise HTTPException(
                status_code=500,
                detail=f"解析章节标题JSON失败: {str(e)}"
            )
    
    except Exception as e:
        print(f"生成章节标题失败: {e}")
        raise HTTPException(status_code=500, detail=f"生成章节标题失败: {str(e)}")

# 定义前置章节的结构（包含id、title、content）
class ChapterInfo(BaseModel):
    id: int  # 明确允许id字段，类型为整数
    title: str  # 章节标题
    content: str  # 章节内容（允许空字符串）

class SpecificChapterRequest(BaseModel):
    background: str
    characters: List[Dict[str, Any]]
    complexity: str = "medium"
    chapterNumber: int
    chapterCount: int
    currentChapterTitle: str
    previousChapters: List[ChapterInfo] = []  

@app.post("/api/generate-specific-chapter")
async def generate_specific_chapter(request: SpecificChapterRequest):
    """生成特定章节的内容"""
    # 创建缓存键
    # previous_chapters_key = "_".join([f"{ch['title'][:10]}" for ch in request.previousChapters])
    # cache_key = f"specific_chapter_{request.chapterNumber}_{request.currentChapterTitle[:20]}_{previous_chapters_key}"
    
    # 检查缓存
    # cached_content = get_from_cache(cache_key)
    # if cached_content:
    #     return {"content": cached_content}
    
    # 构建提示模板
    system_template = (
        "你是一位专业的小说作家，请根据提供的故事背景、角色信息和前面章节内容，"
        f"创作第{request.chapterNumber}章的具体内容。\n\n"
        f"整个故事共{request.chapterCount}章，当前是第{request.chapterNumber}章。\n\n"
        "请遵循以下要求：\n"
        "1. 内容应与前面章节保持连贯性\n"
        "2. 章节内容应围绕当前章节标题展开\n"
        "3. 根据章节在故事中的位置微调各章节的叙事节奏\n"
        "4. 确保所有主要角色都有适当的戏份\n"
        "5. 内容需要连贯，形成一个完整的故事线\n\n"
        "请直接返回章节的详细内容文本，不要包含任何额外的解释或说明文字。"
    )
    
    # 构建前面章节的摘要
    previous_chapters_summary = ""
    if request.previousChapters:
        previous_chapters_summary = "前面章节全部内容：\n"
        for i, chapter in enumerate(request.previousChapters):
            # previous_chapters_summary += f"第{i+1}章《{chapter['title']}》：{chapter['content']}\n\n"
            previous_chapters_summary += f"第{i+1}章《{chapter.title}》：{chapter.content}\n\n"

    
    human_template = (
        f"故事背景: {request.background}\n\n"
        f"角色信息:\n{format_characters(request.characters)}\n\n"
        f"{previous_chapters_summary}"
        f"当前章节: 第{request.chapterNumber}章《{request.currentChapterTitle}》\n\n"
        f"请创作第{request.chapterNumber}章的详细内容。"
    )
    
    messages = [
        SystemMessage(content=system_template),
        HumanMessage(content=human_template)
    ]
    
    try:
        response = await chat_model.ainvoke(messages)
        content = response.content.strip()
        
        # 保存到缓存
        # save_to_cache(cache_key, content)
        
        return {"content": content}
    
    except Exception as e:
        print(f"生成特定章节内容失败: {e}")
        raise HTTPException(status_code=500, detail=f"生成特定章节内容失败: {str(e)}")




class laterChapterRequest(BaseModel):
    background: str
    characters: List[Dict[str, Any]]
    complexity: str = "medium"
    chapterNumber: int
    chapterCount: int
    # 使用子模型指定previousChapters的结构，允许包含id
    previousChapters: List[ChapterInfo] = []  # 替换原有的List[Dict[str, str]]

@app.post("/api/generate-later-chapters")
async def generate_later_chapters(request: laterChapterRequest):
    """生成特定章节的内容"""
    # 创建缓存键
    # previous_chapters_key = "_".join([f"{ch['title'][:10]}" for ch in request.previousChapters])
    # cache_key = f"later_chapter_{request.chapterNumber}_{request.currentChapterTitle[:20]}_{previous_chapters_key}"

    # # 检查缓存
    # cached_content = get_from_cache(cache_key)
    # if cached_content:
    #     return {"content": cached_content}
    
    # 构建提示模板
    system_template = (
        "你是一位专业的小说作家，请根据提供的故事背景、角色信息和前面章节内容，"
        f"创作第{request.chapterNumber}章以及后续章节的章节标题和具体内容。\n\n"
        f"整个故事共{request.chapterCount}章，当前已创作完成了第{request.chapterNumber - 1}章。\n\n"
        "请遵循以下要求：\n"
        "1. 各章节标题和内容应与前面章节保持连贯性\n"
        "2. 各章节内容应围绕对应章节标题展开\n"
        "3. 根据章节在故事中的位置微调各章节的叙事节奏\n"
        "4. 确保所有主要角色都有适当的戏份\n"
        "5. 内容需要连贯，形成一个完整的故事线\n\n"
        "请按照以下JSON格式返回：\n"
        "{\n"
        "  \"chapters\": [\n"
        "    {\n"
        "      \"chapterNumber\": X,\n"
        "      \"title\": \"标题内容\",\n"
        "      \"content\": \"章节完整内容文本\"\n"
        "    },\n"
        "    ...\n"
        "  ]\n"
        "}"
        "确保输出是有效的JSON数组，不要包含任何额外的解释或说明文字。"
    )
    
    # 构建前面章节的摘要
    previous_chapters_summary = ""
    if request.previousChapters:
        previous_chapters_summary = "前面章节全部内容：\n"
        for i, chapter in enumerate(request.previousChapters):
            # 修正后代码
            previous_chapters_summary += f"第{i+1}章《{chapter.title}》：{chapter.content}\n\n"
    
    human_template = (
        f"故事背景: {request.background}\n\n"
        f"角色信息:\n{format_characters(request.characters)}\n\n"
        f"{previous_chapters_summary}"
        # f"当前章节: 第{request.chapterNumber}章《{request.currentChapterTitle}》\n\n"
        f"请根据要求创作。"
    )
    
    messages = [
        SystemMessage(content=system_template),
        HumanMessage(content=human_template)
    ]
    
    try:
        response = await chat_model.ainvoke(messages)
        print(f"AI返回内容: {response.content[:200]}...")  # 打印前200个字符以便调试
        content = response.content.strip()
        
        # 保存到缓存
        # save_to_cache(cache_key, content)
        
        # return {"content": content}
    

        cleaned_content = re.sub(r'[\x00-\x1F\x7F]', '', content)

        try:
            # 解析清洗后的JSON
            ai_result = json.loads(cleaned_content)
            chapters_from_ai = ai_result.get("chapters", [])

            # （后续格式转换逻辑不变）
            formatted_chapters = []
            for chapter in chapters_from_ai:
                formatted_chapters.append({
                    "id": chapter.get("chapterNumber"),
                    "title": chapter.get("title"),
                    "content": chapter.get("content"),
                    "generated": True
                })

            return {"chapters": formatted_chapters}

        except json.JSONDecodeError as e:
            print(f"清洗后仍无法解析JSON: {e}，原始内容: {cleaned_content}")
            raise HTTPException(status_code=500, detail=f"生成内容解析失败: {str(e)}")

    except Exception as e:
        print(f"生成失败: {e}")
        raise HTTPException(status_code=500, detail=f"生成失败: {str(e)}")





# 启动服务器（开发环境）
if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)