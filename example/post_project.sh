jwt=`cat ~/.sca/keys/cli.jwt`

curl \
    -H "Authorization: Bearer $jwt" \
    -H "Content-Type: application/json" \
    -X POST https://soichi7.ppa.iu.edu/api/warehouse/project -d '
{
    "name": "test",
    "access": "public",
    "description": "description",
    "admins": ["1"], 
    "members": ["1"]
}'

