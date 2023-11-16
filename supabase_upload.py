import supabase
import pandas as pd
from sentence_transformers import SentenceTransformer

supabase_url = "https://xltaamjnbvmhkgcolklo.supabase.co"
supabase_key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhsdGFhbWpuYnZtaGtnY29sa2xvIiwicm9sZSI6ImFub24iLCJpYXQiOjE2OTYzNzIxNDMsImV4cCI6MjAxMTk0ODE0M30.r9o-e_j4B3muP_o4wYAD-LY07ZRkBnMjGbemg6lgtmU"

client = supabase.Client(supabase_url, supabase_key)


model = SentenceTransformer('sentence-transformers/all-MiniLM-L12-v2')
print(model)

table_name = 'SP23'

df = pd.read_csv('SP23Courses.csv', delimiter='\t')
#df = pd.read_csv('FA23_rows.csv', delimiter=',')
print(df.head(5))

for (index, row) in df.iterrows():
    course_description = str(row['description'])
    course_name = str(row['name'])
    #embedding_data = list(row["embedding_384"])
    #print(type(list(embedding_data)))
    #break
    course_description = [course_name + " " + course_description]
    print(index)
    try:
        embedding_data = model.encode(
            course_description, show_progress_bar=True).tolist()[0]
        response = client.table(table_name).update(
            {"embedding_384": embedding_data}).eq("name", course_name).execute()
    except:
        print("Error in encoding: ", course_name)

    # print(response.data)
"""
course_description = ""
course_name = ""
embedding_data = list(range(384))
"""

