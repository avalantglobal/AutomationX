

### how to build ###
## run
  docker build -t avalantglobal/workflow:0.0.1 .  
  docker push avalantglobal/workflow:0.0.1 
  ## or 
  docker build --no-cache -t  avalantglobal/workflow:0.0.1 .
  docker push avalantglobal/workflow:0.0.1 


DOCKER_BUILDKIT=0  docker build -t avalantglobal/workflow:0.0.4_rc1    --no-cache --progress=plain .