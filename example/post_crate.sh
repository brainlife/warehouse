jwt=`cat ~/.sca/keys/cli.jwt`

curl \
    -H "Authorization: Bearer $jwt" \
    -H "Content-Type: application/json" \
    -X POST https://soichi7.ppa.iu.edu/api/warehouse/crate -d '
{
    "project_id": "58a79defcd07ba53cb8a3a04", 
    "instance_id": "58a6621faa253c4013ffd19a",
    "name": "name here",
    "desc": "desc here"
}'

