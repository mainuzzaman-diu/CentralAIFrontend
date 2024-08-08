from flask_cors import CORS

from flask import Flask, request, jsonify
import pandas as pd
from qdrant_client import QdrantClient
from qdrant_client.http import models
from transformers import AutoTokenizer, AutoModel
import torch
from openai import OpenAI
import json

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "http://localhost:3000"}})
# Initialize Hugging Face model and tokenizer
model_name = "sentence-transformers/all-MiniLM-L6-v2"
tokenizer = AutoTokenizer.from_pretrained(model_name)
model = AutoModel.from_pretrained(model_name)

# Initialize OpenAI API key
OPENAI_API_KEY = 'sk-proj-'
openai_client = OpenAI(api_key=OPENAI_API_KEY)

# Initialize Qdrant client
qdrant_client = QdrantClient(host='localhost', port=6333)
def swithcing_info(user_query, current_company):
    prompt = f"""
    Daffodil family has different Concerns. You are Currently interacting with: {current_company} assistant. 
    Here is a user query: {user_query}. If the user query is not relevant to the existing company, return:
    {{
        "message": "your response (Just one sentence)",
        "switch": "true or false",
        "company_slug": "if switch is true then change company which is relevant",
        "current_company_slug": "current company"
    }}
    
    Company Info:
    {{
        "categories": {{
            "Education Institutes": [
                {{
                    "name": "Daffodil International University (DIU)",
                    "slug": "daffodil-international-university",
                    "keywords": ["higher education", "undergraduate programs", "graduate programs", "University"]
                }},
                {{
                    "name": "International Online University(IOU)",
                    "slug": "international-online-university",
                    "keywords": ["E-Learning Platform", "Online Course Provider", "Global Access", "Course Certificate Provider"]
                }}
            ],
            "E-Commerce Platform": [
                {{
                    "name": "Daffodil Computers Limited(DCL)",
                    "slug": "daffodil-computers-limited",
                    "keywords": ["e-commerce platform", "electronic product", "Gaming PC and Laptop Shop"]
                }}
            ]
        }}
    }}
    """
    response1 = openai_client.chat.completions.create(
    model="gpt-3.5-turbo-1106",
    max_tokens=400,
    response_format={"type": "json_object"},
    messages=[
        {"role": "system", "content":  "You are a helpful Assistant. Please respond in JSON format."},
        {"role": "user", "content": prompt}
        ]
        )
    query = response1.choices[0].message.content
    print("Switch response", query)
    try:
        normalText = json.loads(query)
    except json.JSONDecodeError as e:
        return jsonify({"error": f"Error decoding JSON response: {e}"}), 500

    q2 = normalText['switch']
    q3 = normalText['company_slug']
    return q2,q3 
def get_embedding(text):
    inputs = tokenizer(text, return_tensors='pt', truncation=True, padding=True)
    outputs = model(**inputs)
    embeddings = outputs.last_hidden_state.mean(dim=1)  # Mean pooling
    return embeddings.detach().numpy()

@app.route('/upload_csv', methods=['POST'])
def upload_csv():
    if 'file' not in request.files:
        return jsonify({"error": "No file part"}), 400
    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400
    if file and file.filename.endswith('.csv'):
        try:
            # Try reading the CSV file with utf-8 encoding
            df = pd.read_csv(file, encoding='utf-8')
            # df = pd.read_csv(file, encoding='utf-8', delimiter=';') #DCL
        except UnicodeDecodeError:
            # If utf-8 fails, try reading with latin1 encoding
            file.seek(0)
            df = pd.read_csv(file, encoding='latin1', delimiter=';')
        
        collection_name = request.form.get('collection_name')
        if not collection_name:
            return jsonify({"error": "No collection name provided"}), 400

        column_names = df.columns.tolist()
        print(column_names)
        vector_size = model.config.hidden_size

        # Create Qdrant collection
        qdrant_client.recreate_collection(
            collection_name=collection_name,
            vectors_config=models.VectorParams(size=vector_size, distance=models.Distance.COSINE)
        )

        # Insert embeddings into Qdrant
        for idx, row in df.iterrows():
            text = " ".join([str(row[col]) for col in column_names])
            embedding = get_embedding(text)
            payload = {col: row[col] for col in column_names}
            qdrant_client.upsert(
                collection_name=collection_name,
                points=[
                    models.PointStruct(id=idx, vector=embedding.flatten().tolist(), payload=payload)
                ]
            )
        return jsonify({"message": "Collection created and embeddings inserted successfully!"}), 200
    else:
        return jsonify({"error": "Invalid file type, only CSV is allowed"}), 400
    



def flag_keyword(history_prompt, query):
        prompt2 = f"""See the History of a Chat which is being done previously: {history_prompt}. Current Query of user is: {query}.
        Based on the text, generate a summary and keywords(Keywords should be between 4 to 5 only).. 
        Give response as like below json: 
        {{
            "summary": "",
            "keywords": "yes or no" 
        }}
        Don't give any question answer(solution) from you, just give as per my instructions and needs.
        """
        response1 = openai_client.chat.completions.create(
            model="gpt-3.5-turbo-1106",
            max_tokens=400,
            response_format={"type": "json_object"},
            messages=[
                {"role": "system", "content": "You are a helpful assistant."},
                {"role": "user", "content": prompt2}
            ]
        )
        query1 = response1.choices[0].message.content
        print("Query 1", query1)
        try:
            normalText = json.loads(query1)
        except json.JSONDecodeError as e:
            return jsonify({"error": f"Error decoding JSON response: {e}"}), 500

        summary = normalText['summary']
        keywords = normalText['keywords']
        return summary, keywords

def chat_completion(keywords,summary,q2):
    collections = {
        "iousecond": "Title,Price,what_you_learn,Slug,instructor",
        "diusecond": "Question,Answer,URL,Other Info",
        "dcl": "Product Name,Price,Product Details,Product URL"
    }

    query_embedding = get_embedding(summary).flatten().tolist()
    all_results = []

    for collection_name, column_names_str in collections.items():
        column_names = column_names_str.split(',')
        search_result = qdrant_client.search(
            collection_name=collection_name,
            query_vector=query_embedding,
            limit=3
        )

        if not search_result:  # Check if the search result is empty
            print(f"No relevant data found in {collection_name}")
            continue
        
        relevant_texts = [
            "\n".join([f"{col}: {hit.payload[col]}" for col in column_names])
            for hit in search_result
        ]
        similarity_scores = [hit.score for hit in search_result]
        
        collection_results = {
            "collection_name": collection_name,
            "results": []
        }

        for i, text in enumerate(relevant_texts):
            result = {
                "similarity_score": similarity_scores[i],
                "text": text
            }
            collection_results["results"].append(result)
            print(f"Similarity Score for result {i+1} in {collection_name}: {similarity_scores[i]}")
            print(f"Relevant Text for result {i+1} in {collection_name}:\n{text}\n")

        all_results.append(collection_results)
    
    if not all_results:
        return jsonify({"error": "No relevant data found in any collection."}), 404

    return jsonify(all_results)


@app.route('/ask', methods=['POST'])
def ask():
    data = request.get_json()
    query = data.get('query')
    collection_name = data.get('collection_name')
    column_names = data.get('column_names')
    history = data.get('history', [])
    chat_type = data.get('chat_type')
    if not query or not collection_name or not column_names:
        return jsonify({"error": "Query, collection_name, and column_names are required"}), 400
    print("Chat Type: ",chat_type)
    history_prompt = ""
    if chat_type == "DIU":
        system_prompt = "You are a helpful AI assistant of Daffodil International University(DIU)."
        main_prompt = "You are a helpful assistant of Daffodil International University(DIU). You are designed to exactly give the response as per instructions. If you provide any URL, just give the exact url(Don't give extra characters with it)"
    if chat_type == "IOU":
        system_prompt = "You are a helpful assistant of International Online University(IOU) which is an online e-learning platform."
        main_prompt = "You are a helpful assistant of International Online University(IOU) which is an online e-learning platform that offers different courses. You are designed to exactly give the response as per instructions. As you are an Assistant of IOU, your primary intention is to sell course based on the customer interest. Slug means a part of the url, complete url if user wants like below: https://iou.ac/course/{Slug} . If you provide any URL, just give the exact url(Don't give extra characters with it)"
    if chat_type == "DCL":
        system_prompt = "You are a helpful assistant of Daffodil Computers Limited(DCL) which is an e-commerce platform."
        main_prompt = "You are a helpful assistant of Daffodil Computers Limited(DCL) which is an an e-commerce platform that sells different kinds of Electronics product. You are designed to exactly give the response as per instructions. As you are an Assistant of DCL, your primary intention is to sell products based on the customer interest. If you provide product URL, just give the exact url(Don't give extra characters with it)"
    # print("history is: ", history)
    if history:
        for i, interaction in enumerate(history, 1):
            history_prompt += f"Previous Interaction {i}:\nQuestion: {interaction['question']}\nAnswer: {interaction['answer']}\n\n"
        print("History Prompt",history_prompt)
        prompt2 = f"""See the History of a Chat which is being done previously: {history_prompt}. Current Query of user is: {query}. Give whether current query is relevant to the previous chat history.
        Also, If the Current Query is relevant to previous chat, Give a summery in one sentence giving most priority to current query.
        Another thing is, based on the history(Question, Answer and current question) tell me whether user intension and chat is almost complete or not. Give this as percentage. 
          
        Give response as like below json: 
        {{
            "summary": "",
            "relevant_or_not": "yes or no",
            "chat_complete":"%"
        }}
        Don't give any question answer(solution) from you, just give as per instruction.
        """
        
        response1 = openai_client.chat.completions.create(
            model="gpt-3.5-turbo-1106",
            max_tokens=400,
            response_format={"type": "json_object"},
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": prompt2}
            ]
        )
        query1 = response1.choices[0].message.content
        print("Query 1", query1)
        try:
            normalText = json.loads(query1)
        except json.JSONDecodeError as e:
            return jsonify({"error": f"Error decoding JSON response: {e}"}), 500

        q2 = normalText['summary']
        cht_c = normalText['chat_complete']

        numeric_value = int(cht_c.rstrip('%'))
        if numeric_value >= 50:
            summary, keywords = flag_keyword(history_prompt, query)
            print("Summary, Keywords",summary,keywords)
            output = chat_completion(keywords,summary,q2)
            print("Output From other source: ", output)
        if normalText['relevant_or_not'] == 'no':
            q2 = query
            hdh,djd = swithcing_info(query, chat_type)
            print("State1, state2",hdh,djd )
    else:
        q2 = query

    query_embedding = get_embedding(q2).flatten().tolist()
    search_result = qdrant_client.search(
        collection_name=collection_name,
        query_vector=query_embedding,
        limit=3
    )
    # print("Matched Three results: ", search_result)
    if not search_result:  # Check if the search result is empty
        print("No relevant Data Found")
        return jsonify({"error": "No relevant data found in the collection."}), 404
    print("relevant Data Found")
    relevant_texts = [
        "\n".join([f"{col}: {hit.payload[col]}" for col in column_names])
        for hit in search_result
    ]
    similarity_scores = [hit.score for hit in search_result]
    for i, text in enumerate(relevant_texts):
        print(f"Similarity Score for result {i+1}: {similarity_scores[i]}")
    prompt = f"Previous chat history: {history_prompt}. Answer the question based on the following context:\n{relevant_texts}\n\nQuestion: {query}"

    response = openai_client.chat.completions.create(
        model="gpt-3.5-turbo-0125",
        max_tokens=500,
        messages=[
            {"role": "system", "content": main_prompt},
            {"role": "user", "content": prompt}
        ]
    )

    answer = response.choices[0].message.content
    print("Main Text",answer)
    return jsonify({"answer": answer}), 200

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
