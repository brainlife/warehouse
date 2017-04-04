jwt="eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJodHRwczovL3NjYS5pdS5lZHUvYXV0aCIsImlhdCI6MTQ4ODc2NTUyMC4yMTIsInNjb3BlcyI6eyJzY2EiOlsidXNlciJdfSwic3ViIjoxfQ.jhKfhyFDw4dPHQNi6hYVpQjYSuZIUJ3FoyMTafBVchrt4160hLQOkNhwRJHg-s7xj-iCaZ7Jj-JSF0ubkY0wlRcRaApqENLqRxUiXu_4dXbEmZ4b3LsjUSpP1tHJoUkeFfzzHfS4LByr9LqSv_4tEYEUGJohMHWH6mIHQiXdHQs"

curl -H "Authorization: Bearer $jwt" \
    -H "Content-Type: application/json" \
    -X POST https://soichi7.ppa.iu.edu/api/warehouse/dataset -d '
{
    "project_id": "58a79defcd07ba53cb8a3a04", 
    "instance_id": "58a6621faa253c4013ffd19a",
    "task_id": "58a66231aa253c4013ffd19e",
    "datatype_id": "58c33bcee13a50849b25879a",
    "name": "name here",
    "desc": "desc here",
    "tags": ["apple", "banana"]
}'

