
from openai import OpenAI
import os

# Initialize the OpenAI client
client = OpenAI(api_key=os.getenv('OPENAI_API_KEY'))

try:
    # Use the correct chat completions API
    response = client.chat.completions.create(
        model="gpt-4",
        messages=[
            {"role": "user", "content": "Write a one-sentence bedtime story about a unicorn."}
        ],
        max_tokens=100
    )

    # Extract the response text
    story = response.choices[0].message.content
    print(story)

except Exception as e:
    print(f"Error: {e}")
    print("Make sure you have set your OPENAI_API_KEY environment variable.")
