import os
import dashscope
from dashscope import Generation

def get_user_input():
    """获取用户输入的故事基本要素"""
    print("请输入故事基本要素：")
    story_background = input("故事背景：")
    main_roles = input("主要角色设定：")
    branch_complexity = input("分支复杂度：")
    chapter_count = input("章节数：")
    return story_background, main_roles, branch_complexity, chapter_count

def generate_story_content(story_background, main_roles, branch_complexity, chapter_count):
    """调用大模型生成故事内容（流式输出）"""
    print("\n正在生成故事内容...\n")
    
    # 构造提示词
    user_prompt = f"""基于以下游玩模式要素，生成详细内容：
1. 故事背景：{story_background}
2. 主要角色设定：{main_roles}
3. 分支复杂度：{branch_complexity}
4. 章节数：{chapter_count}

请生成：
- 详细的故事背景（补充世界观、核心冲突、时代背景等）
- 主要角色介绍（包括姓名、年龄、外貌特征、性格、特殊能力/身份、背景故事）
- 角色立绘描述（说明立绘风格，如二次元/写实/国风；突出角色关键特征，如服饰、标志性物品、神态等）
- 故事开端（从故事开始时的剧情走势写起，到第一个关键选择点停下）
"""

    # 构造对话消息
    messages = [
        {
            'role': 'system',
            'content': '你是专业的故事创作者，会边思考边创作，输出内容要自然流畅，逐步推进'
        },
        {
            'role': 'user',
            'content': user_prompt
        }
    ]

    # 调用dashscope接口（流式输出）
    try:
        full_content = ""
        # 使用流式API调用
        responses = Generation.call(
            api_key=os.getenv('DASHSCOPE_API_KEY') or "您的API密钥",
            model="qwen-turbo",
            messages=messages,
            result_format='message',
            stream=True
        )
        
        # 处理流式响应
        for response in responses:
            if response.status_code == 200:
                # 处理有效的消息块
                if hasattr(response.output, 'choices') and response.output.choices:
                    message = response.output.choices[0].message
                    if message and hasattr(message, 'content'):
                        chunk = message.content
                        print(chunk, end='', flush=True)
                        full_content += chunk
            else:
                print(f"\n请求失败，状态码: {response.status_code}, 原因: {response.message}")
                return None
        
        return full_content
    except Exception as e:
        print(f"\n接口调用失败: {str(e)}")
        return None

def process_story_content(content):
    """从生成内容中提取故事背景、角色和剧情开端"""
    sections = content.split('\n\n')
    story_data = {
        'background': '',
        'characters': '',
        'prologue': '',
        'first_choice': '',
        'choice_options': {}
    }

    current_section = None
    for section in sections:
        if not section.strip():
            continue

        if "故事背景" in section:
            current_section = 'background'
            story_data[current_section] = section
        elif "主要角色介绍" in section or "角色介绍" in section:
            current_section = 'characters'
            story_data[current_section] = section
        elif "故事开端" in section or "剧情开端" in section:
            current_section = 'prologue'
            story_data[current_section] = section
        elif current_section == 'prologue':
            story_data[current_section] += '\n\n' + section

    # 提取第一个选择点和选项
    if story_data['prologue']:
        # 查找选择点标记
        choice_markers = ["这是一个决定他们命运的选择……", "请选择：", "你的选择是：", "关键选择点："]
        choice_text = ""
        
        for marker in choice_markers:
            if marker in story_data['prologue']:
                parts = story_data['prologue'].split(marker, 1)
                if len(parts) > 1:
                    story_data['prologue'] = parts[0]
                    choice_text = marker + parts[1]
                    break
        
        if choice_text:
            story_data['first_choice'] = choice_text
            
            # 提取选项内容
            import re
            option_pattern = re.compile(r'([A-Z])\.\s*([^\n]+)')
            options = option_pattern.findall(choice_text)
            
            if options and len(options) >= 2:
                story_data['choice_options'] = {
                    'A': options[0][1],
                    'B': options[1][1]
                }
            else:
                # 如果没有找到标准格式的选项，手动添加两个通用选项
                story_data['choice_options'] = {
                    'A': "选项A",
                    'B': "选项B"
                }
                story_data['first_choice'] += "\nA. 选项A\nB. 选项B"

    return story_data

def present_story_intro(story_data):
    """展示故事简介部分"""
    print("\n\n===== 故事背景 =====")
    print(story_data.get('background', '无故事背景信息'))
    
    print("\n===== 主要角色 =====")
    print(story_data.get('characters', '无角色信息'))

def present_prologue_and_choice(story_data):
    """展示故事开端和第一个选择"""
    print("\n===== 故事开始 =====")
    print(story_data.get('prologue', '无故事开端信息'))
    
    if story_data.get('first_choice'):
        print("\n===== 你的选择 =====")
        print(story_data['first_choice'])

def get_user_choice(story_data):
    """获取用户的选择"""
    options = story_data.get('choice_options', {})
    if not options:
        # 如果没有选项，使用默认选项
        options = {'A': "选项A", 'B': "选项B"}
    
    while True:
        print("\n请选择:")
        for key, desc in options.items():
            print(f"{key}. {desc}")
            
        choice = input("\n请输入你的选择（例如 A/B）：").strip().upper()
        if choice in options:
            return choice
        print("无效选择，请重新输入。")

def generate_branch_content(story_data, user_choice, story_background, main_roles):
    """根据用户选择生成后续剧情（流式输出）"""
    # 获取用户选择的具体描述
    choice_description = story_data.get('choice_options', {}).get(user_choice, f"选择了选项 {user_choice}")
    
    print("\n正在生成后续剧情...\n")
    
    # 构造分支剧情的提示词
    branch_prompt = f"""
【已有故事背景】
{story_background}

【主要角色】
{main_roles}

【已有的故事开端】
{story_data.get('prologue', '')}

【第一个关键选择】
用户选择了：{choice_description}

请生成：
1. 严格基于用户选择的详细剧情发展（约500-800字）
2. 至少两个新的选择点，并以清晰的选项格式呈现（例如：A. 探索左边的房间 B. 继续沿着走廊前进）
"""

    # 构造对话消息
    messages = [
        {
            'role':'system',
            'content': '你是专业的故事创作者，会边思考边创作，输出内容要严格遵循用户选择，逐步推进剧情，自然流畅'
        },
        {
            'role': 'user',
            'content': branch_prompt
        }
    ]

    # 调用dashscope接口（流式输出）
    try:
        full_branch = ""
        responses = Generation.call(
            api_key=os.getenv('DASHSCOPE_API_KEY') or "您的API密钥",
            model="qwen-turbo",
            messages=messages,
            result_format='message',
            stream=True
        )
        
        for response in responses:
            if response.status_code == 200:
                if hasattr(response.output, 'choices') and response.output.choices:
                    message = response.output.choices[0].message
                    if message and hasattr(message, 'content'):
                        chunk = message.content
                        print(chunk, end='', flush=True)
                        full_branch += chunk
            else:
                print(f"\n请求失败，状态码: {response.status_code}, 原因: {response.message}")
                return None
        
        return full_branch
    except Exception as e:
        print(f"\n接口调用失败: {str(e)}")
        return None

def main():
    """主函数：控制故事生成和交互流程"""
    print("=== 互动故事生成器 ===")
    
    # 获取用户输入
    story_background, main_roles, branch_complexity, chapter_count = get_user_input()
    
    # 生成故事内容（流式输出）
    content = generate_story_content(story_background, main_roles, branch_complexity, chapter_count)
    
    if not content:
        print("故事生成失败，程序退出。")
        return
    
    # 处理生成内容
    story_data = process_story_content(content)
    
    # 展示故事简介
    present_story_intro(story_data)
    
    # 展示故事开端和第一个选择
    present_prologue_and_choice(story_data)
    
    # 获取用户选择
    user_choice = get_user_choice(story_data)
    
    # 生成分支剧情（流式输出）
    branch_content = generate_branch_content(story_data, user_choice, story_background, main_roles)
    
    if branch_content:
        print("\n\n===== 剧情小结 =====")
        print("剧情已按你的选择推进，可继续选择下一步")

if __name__ == "__main__":
    main()