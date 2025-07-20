from transformers import pipeline

# 加载本地模型
classifier = pipeline(
    "zero-shot-classification",
    model="./my_model",  # 本地模型路径
    tokenizer="./my_model",  # 本地 tokenizer 路径
    device=0  # 使用 CPU；如果有 GPU，可以设置为 0
)

# 测试文本
text = "在末日后的废墟上，人类文明正在逐步重建，机器人统治着城市的秩序。"


# 分类
result = classifier(
    text,
    candidate_labels=["科幻", "玄幻", "悬疑", "末世", "爱情", "历史", "都市", "军事", "校园"]
)

print(result)