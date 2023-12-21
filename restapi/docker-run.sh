CONTAINER="restapi"
IMAGE="restapi"
PORT="3001"
docker build -t $IMAGE .
docker rm -f $CONTAINER
docker run -p $PORT:$PORT -d --name $CONTAINER $IMAGE
